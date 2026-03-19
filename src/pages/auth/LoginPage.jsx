import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authAPI } from '@/api/auth';

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const response = await authAPI.login(data.email, data.password);
      const { access, refresh, user } = response.data;

      // Store tokens
      localStorage.setItem('token', access);
      localStorage.setItem('refresh', refresh);

      // Normalize role to lowercase for frontend permission checks
      const normalizedUser = {
        ...user,
        role: user.role.toLowerCase(),
        name: user.full_name,
      };

      if (onLogin) {
        onLogin(normalizedUser);
      }
      navigate('/dashboard');
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Invalid email or password.';
      setLoginError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[#1a4d8f] via-[#2064B7] to-[#1e5a9f]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 relative backdrop-blur-sm bg-white/95">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2064B7] to-[#1a4d8f] shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#2064B7] to-[#1a4d8f] bg-clip-text text-transparent">
            ProofLine
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Fraud Investigation Platform
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {loginError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 animate-slide-in">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="h-11 border-gray-200 focus:border-[#2064B7] focus:ring-[#2064B7] transition-colors"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600 animate-slide-in">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="h-11 border-gray-200 focus:border-[#2064B7] focus:ring-[#2064B7] transition-colors pr-10"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-[#2064B7]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 animate-slide-in">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#2064B7] to-[#1a4d8f] hover:from-[#1a4d8f] hover:to-[#2064B7] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardFooter>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            © 2026 ProofLine. All rights reserved.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
