import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { initializeStorage } from '@/utils/storageMongo';
import { authAPI } from '@/utils/api';
import { User } from '@/App';
import { toast } from 'sonner';
import { OTPVerification } from './OTPVerification';
import { generateOTP, storeOTP, cleanExpiredOTPs } from '@/utils/otp';
import { sendOTPEmail } from '@/utils/emailService';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (user: User) => void;
  defaultTab?: 'login' | 'register';
}

type DialogStep = 'login' | 'register' | 'otp-verification';

export function AuthDialog({ open, onOpenChange, onLogin, defaultTab = 'login' }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [currentStep, setCurrentStep] = useState<DialogStep>(defaultTab);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Clean expired OTPs when dialog opens
  useEffect(() => {
    if (open) {
      cleanExpiredOTPs();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(defaultTab);
      setActiveTab(defaultTab);
      setError('');
      setSuccess('');
    }
  }, [open, defaultTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(loginEmail, loginPassword);
      if (response.user && response.token) {
        onLogin(response.user, response.token);
        toast.success('Login successful!');
        onOpenChange(false);
      } else {
        setError('Login failed');
        toast.error('Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send OTP via API
      const response = await authAPI.sendOTP(regEmail, 'registration');
      
      if (response.success) {
        // OTP is returned in response.otp for EmailJS
        const otpCode = response.otp;
        
        // Send email via EmailJS
        const emailResult = await sendOTPEmail(regEmail, otpCode, 'registration');
        
        if (emailResult.success) {
          toast.success('OTP sent to your email');
          setCurrentStep('otp-verification');
        } else {
          setError(emailResult.message);
          toast.error(emailResult.message);
        }
      } else {
        setError(response.message || 'Failed to send OTP');
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    setRegOTP(['', '', '', '', '', '']);
    
    try {
      // Resend OTP via API
      const response = await authAPI.sendOTP(regEmail, 'registration');
      
      if (response.success) {
        const otpCode = response.otp;
        const emailResult = await sendOTPEmail(regEmail, otpCode, 'registration');
        
        if (emailResult.success) {
          toast.success('New OTP sent to your email');
          setSuccess('New OTP sent to your email. Please check and enter the code.');
        } else {
          setError(emailResult.message);
          toast.error(emailResult.message);
        }
      } else {
        setError(response.message || 'Failed to resend OTP');
        toast.error(response.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP');
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Register user via API (MongoDB)
      const { authAPI } = await import('@/utils/api');
      const response = await authAPI.register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        referralCode: referralCode.trim() || undefined
      });
      
      if (response.user && response.token) {
        if (response.user.referredBy) {
          toast.success('Account created! Referral bonus awarded to your referrer.');
        } else {
          toast.success('Account created successfully!');
        }
        
        // Clear form and switch to login
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setReferralCode('');
        setCurrentStep('login');
        setActiveTab('login');
        setSuccess('Account created successfully! Please log in.');
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show OTP verification in dialog
  if (currentStep === 'otp-verification') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Verify Your Email</DialogTitle>
            <DialogDescription className="text-center">
              We've sent a 6-digit code to {regEmail}
            </DialogDescription>
          </DialogHeader>
          <OTPVerification
            email={regEmail}
            purpose="registration"
            onVerify={handleOTPVerified}
            onResend={handleResendOTP}
            onBack={() => setCurrentStep('register')}
            title=""
            description=""
            compact={true}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Welcome to Kacha Taka</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">Manage your finances with ease</DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => {
            setActiveTab(v as any);
            setCurrentStep(v as DialogStep);
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button className="w-full h-11" type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input 
                  id="reg-name" 
                  placeholder="John Doe" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input 
                  id="reg-email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone (Optional)</Label>
                <Input 
                  id="reg-phone" 
                  placeholder="+880..." 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-pass">Password</Label>
                  <Input 
                    id="reg-pass" 
                    type="password" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm</Label>
                  <Input 
                    id="reg-confirm" 
                    type="password" 
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                <Input 
                  id="referral-code" 
                  placeholder="Enter referral code" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <Button className="w-full h-11" type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}