import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import User from './models/User.js';
import OTP from './models/OTP.js';
import GameHistory from './models/GameHistory.js';
import Transaction from './models/Transaction.js';
import Message from './models/Message.js';
import PaymentRequest from './models/PaymentRequest.js';
import GameSettings from './models/GameSettings.js';
import GlobalSettings from './models/GlobalSettings.js';
import PlatformStats from './models/PlatformStats.js';
import { authenticate, isAdmin } from './middleware/auth.js';
import jwt from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'kachataka-super-secret-jwt-key-2024';

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3006',
      'http://localhost:3013',
      'https://*.vercel.app'
    ].filter(Boolean);
    
    // Allow all Vercel preview deployments
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // Allow all origins for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Initialize admin user (run once per instance)
let adminInitPromise = null;
async function initializeAdmin() {
  if (adminInitPromise) return adminInitPromise;
  
  adminInitPromise = (async () => {
    try {
      await connectDB();
      const adminExists = await User.findOne({ email: 'admin@kachataka.com' });
      if (!adminExists) {
        await User.create({
          name: 'Super Admin',
          email: 'admin@kachataka.com',
          phone: '+8801700000000',
          password: 'kachataka',
          demoPoints: 100,
          realBalance: 100000,
          isAdmin: true,
          kycStatus: 'verified',
          referralCode: 'ADMIN001'
        });
        console.log('✅ Default admin user created');
      }
    } catch (error) {
      console.error('Admin initialization error:', error);
    }
  })();
  
  return adminInitPromise;
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB();
    const { name, email, phone, password, referralCode } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userData = {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password
    };

    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        userData.referredBy = referrer._id;
      }
    }

    const user = await User.create(userData);
    user.referralCode = user.generateReferralCode();
    await user.save();

    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        referrer.referralEarnings += 500;
        referrer.demoPoints += 500;
        await referrer.save();
      }
    }

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    await connectDB();
    const { email, purpose } = req.body;

    if (purpose === 'password-reset') {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email: email.toLowerCase(), purpose });
    await OTP.create({
      email: email.toLowerCase(),
      code: otpCode,
      purpose,
      expiresAt
    });

    console.log(`[OTP] Generated for ${email}: ${otpCode} (${purpose})`);

    res.json({ 
      message: 'OTP sent successfully',
      success: true,
      otp: otpCode
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    await connectDB();
    const { email, code, purpose } = req.body;

    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      purpose,
      code: code.trim(),
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid or expired OTP' 
      });
    }

    otp.attempts += 1;
    if (otp.attempts >= 5) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(400).json({ 
        valid: false,
        message: 'Too many attempts. Please request a new OTP.' 
      });
    }

    await OTP.deleteOne({ _id: otp._id });
    res.json({ 
      valid: true,
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      valid: false,
      message: error.message || 'OTP verification failed' 
    });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    await connectDB();
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    await connectDB();
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ==================== USER ROUTES ====================
app.get('/api/users', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/referral/:code', async (req, res) => {
  try {
    await connectDB();
    const user = await User.findOne({ referralCode: req.params.code.toUpperCase() }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:id/referrals', authenticate, async (req, res) => {
  try {
    await connectDB();
    const referrals = await User.find({ referredBy: req.params.id }).select('-password');
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    await connectDB();
    if (req.params.id !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.isAdmin) {
      Object.assign(user, req.body);
    } else {
      if (req.body.demoPoints !== undefined) user.demoPoints = req.body.demoPoints;
      if (req.body.realBalance !== undefined) user.realBalance = req.body.realBalance;
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.phone !== undefined) user.phone = req.body.phone;
    }

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/users/:id/balance', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    const { demoPoints, realBalance } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (demoPoints !== undefined) user.demoPoints = demoPoints;
    if (realBalance !== undefined) user.realBalance = realBalance;

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== GAME ROUTES ====================
app.post('/api/games/history', authenticate, async (req, res) => {
  try {
    await connectDB();
    const gameHistory = await GameHistory.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(gameHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/games/history', authenticate, async (req, res) => {
  try {
    await connectDB();
    const { game, limit = 100 } = req.query;
    const query = { userId: req.user._id };
    if (game) query.game = game;

    const history = await GameHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/games/stats', authenticate, async (req, res) => {
  try {
    await connectDB();
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = {
      crash: {
        totalBets: await GameHistory.countDocuments({ game: 'crash' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'crash' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'crash' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'crash' }).then(r => r.length)
      },
      mines: {
        totalBets: await GameHistory.countDocuments({ game: 'mines' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'mines' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'mines' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'mines' }).then(r => r.length)
      },
      slots: {
        totalBets: await GameHistory.countDocuments({ game: 'slots' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'slots' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'slots' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'slots' }).then(r => r.length)
      },
      dice: {
        totalBets: await GameHistory.countDocuments({ game: 'dice' }),
        totalWagered: await GameHistory.aggregate([
          { $match: { game: 'dice' } },
          { $group: { _id: null, total: { $sum: '$betAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalWon: await GameHistory.aggregate([
          { $match: { game: 'dice' } },
          { $group: { _id: null, total: { $sum: '$winAmount' } } }
        ]).then(r => r[0]?.total || 0),
        totalPlayers: await GameHistory.distinct('userId', { game: 'dice' }).then(r => r.length)
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TRANSACTION ROUTES ====================
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    await connectDB();
    const transaction = await Transaction.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    await connectDB();
    const query = { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== MESSAGE ROUTES ====================
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    await connectDB();
    const message = await Message.create({
      ...req.body,
      userId: req.user._id,
      userName: req.user.name
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/messages', authenticate, async (req, res) => {
  try {
    await connectDB();
    const query = req.user.isAdmin ? {} : { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/messages/:id', authenticate, async (req, res) => {
  try {
    await connectDB();
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.body.reply && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can reply' });
    }

    Object.assign(message, req.body);
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PAYMENT ROUTES ====================
app.post('/api/payments', authenticate, async (req, res) => {
  try {
    await connectDB();
    const paymentRequest = await PaymentRequest.create({
      ...req.body,
      userId: req.user._id,
      userName: req.user.name
    });
    res.status(201).json(paymentRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/payments', authenticate, async (req, res) => {
  try {
    await connectDB();
    const query = req.user.isAdmin ? {} : { userId: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const requests = await PaymentRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/payments/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    const request = await PaymentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    const oldStatus = request.status;
    Object.assign(request, req.body);
    await request.save();

    if (request.status === 'approved' && oldStatus !== 'approved') {
      const user = await User.findById(request.userId);
      if (user) {
        if (request.type === 'deposit') {
          user.realBalance += request.amount;
          await Transaction.create({
            userId: user._id,
            type: 'deposit',
            amount: request.amount,
            status: 'completed',
            method: request.method,
            details: `Deposit via ${request.method} - ${request.transactionId || ''}`
          });
        } else if (request.type === 'withdraw') {
          if (user.realBalance < request.amount) {
            request.status = 'rejected';
            await request.save();
            return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
          }
          user.realBalance -= request.amount;
          await Transaction.create({
            userId: user._id,
            type: 'withdraw',
            amount: request.amount,
            status: 'completed',
            method: request.method,
            details: `Withdrawal via ${request.method} to ${request.accountDetails || ''}`
          });
        }
        await user.save();
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/payments/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    const request = await PaymentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    await PaymentRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SETTINGS ROUTES ====================
app.get('/api/settings/game', async (req, res) => {
  try {
    await connectDB();
    const settings = await GameSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings/game', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    const { crash, mines, slots, dice } = req.body;
    const updateData = { crash, mines, slots, dice };
    
    let settings = await GameSettings.findOne();
    if (!settings) {
      settings = await GameSettings.create(updateData);
    } else {
      if (crash) settings.crash = crash;
      if (mines) settings.mines = mines;
      if (slots) settings.slots = slots;
      if (dice) settings.dice = dice;
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    console.error('Update game settings error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings/global', async (req, res) => {
  try {
    await connectDB();
    const settings = await GlobalSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings/global', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings/stats', async (req, res) => {
  try {
    await connectDB();
    const stats = await PlatformStats.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings/stats', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    let stats = await PlatformStats.findOne();
    if (!stats) {
      stats = await PlatformStats.create(req.body);
    } else {
      Object.assign(stats, req.body);
      await stats.save();
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize admin on first request (non-blocking)
app.use(async (req, res, next) => {
  // Initialize admin in background, don't block requests
  initializeAdmin().catch(err => console.error('Admin init error:', err));
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Export for Vercel
export default app;

