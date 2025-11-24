import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Wallet, User as UserIcon, LogOut, Settings, ShieldCheck, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { formatCurrency } from '@/utils/storageMongo';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-background/80 backdrop-blur-md border-b shadow-sm h-16' 
            : 'bg-transparent h-20'
        }`}
      >
        <div className="container mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold tracking-tight hidden sm:block">
              Kacha<span className="text-primary">Taka</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink label="Home" onClick={() => navigate('/')} active={location.pathname === '/'} />
            <NavLink label="Games" onClick={() => navigate(user ? '/dashboard' : '/')} active={location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/crash') || location.pathname.startsWith('/mines') || location.pathname.startsWith('/slots') || location.pathname.startsWith('/dice')} />
            <NavLink label="Fairness" onClick={() => navigate('/fairness')} active={location.pathname === '/fairness'} />
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Main:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(user.realBalance)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Demo:</span>
                    <span className="font-bold text-blue-500">{formatCurrency(user.demoPoints)}</span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')}>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                       <Gamepad2 className="mr-2 h-4 w-4" />
                       <span>Dashboard</span>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:flex">
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')} className="shadow-lg shadow-primary/20">
                  Sign up
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
               <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>Access all pages and features</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 mt-10">
                    <Button variant="ghost" onClick={() => navigate('/')} className="justify-start text-lg">
                      Home
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(user ? '/dashboard' : '/')} className="justify-start text-lg">
                      Games
                    </Button>
                    {user && (
                       <>
                        <Button variant="ghost" onClick={() => navigate('/wallet')} className="justify-start text-lg">
                          Wallet
                        </Button>
                        <Button variant="ghost" onClick={() => navigate('/profile')} className="justify-start text-lg">
                          Profile
                        </Button>
                       </>
                    )}
                    <div className="mt-auto">
                       {user ? (
                          <Button variant="destructive" className="w-full" onClick={() => { logout(); navigate('/'); }}>Log Out</Button>
                       ) : (
                          <div className="grid gap-2">
                            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>Log In</Button>
                            <Button className="w-full" onClick={() => navigate('/register')}>Sign Up</Button>
                          </div>
                       )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function NavLink({ label, onClick, active }: { label: string, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        active ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      {label}
    </button>
  );
}