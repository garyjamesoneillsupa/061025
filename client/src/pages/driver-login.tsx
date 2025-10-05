import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Truck, Eye, EyeOff } from 'lucide-react';

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    driverId?: string;
  };
}

export default function DriverLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPin, setShowPin] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    username: '',
    pin: ''
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; pin: string }) => {
      const response = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        // Store driver session with token
        const session = {
          driver: {
            id: data.user.id,
            name: data.user.name, // Use full name from response
          },
          token: data.token,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('driverSession', JSON.stringify(session));
        
        // Set session expiry (30 days)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('driverSessionExpiry', expiry.toISOString());
        
        // Dispatch event to trigger auth check in DriverLayout
        window.dispatchEvent(new Event('driverLogin'));
        
        // Navigate to drivers dashboard
        navigate('/drivers');
      } else {
        throw new Error('Login failed - invalid response');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username.trim() || !loginForm.pin.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter both username and PIN",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate(loginForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00ABE7] to-[#0095d1] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[#00ABE7] rounded-full flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Driver Portal</CardTitle>
              <p className="text-gray-600 mt-2">Sign in to access your jobs</p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="h-12 px-4 text-base border-gray-300 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium text-gray-700">
                  PIN
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter your PIN"
                    value={loginForm.pin}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, pin: e.target.value }))}
                    className="h-12 px-4 pr-12 text-base border-gray-300 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-[#00ABE7] hover:bg-[#0095d1] text-white rounded-lg transition-colors"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p>Need help accessing your account?</p>
                <p className="mt-1">Contact your transport manager</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">OVM Pro Transport Management System</p>
        </div>
      </motion.div>
    </div>
  );
}