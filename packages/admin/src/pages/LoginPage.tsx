/**
 * Login page component.
 * Refined minimal design with subtle animations.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, useCanRegister } from '@/stores/auth';
import { Loader2, UserPlus, Layers } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { login, register, isLoading, isAuthenticated, error, clearError, checkSetupStatus } = useAuthStore();
  const canRegister = useCanRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  // Check setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  // Reset to login mode if registration is no longer available
  useEffect(() => {
    if (!canRegister && isRegister) {
      setIsRegister(false);
    }
  }, [canRegister, isRegister]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (isRegister) {
      await register(email, password, name);
    } else {
      await login(email, password);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 animate-fade-in">
      <Card className="w-full max-w-md border-border/60 notion-shadow animate-scale-in">
        <CardHeader className="space-y-4 pb-5">
          {/* Logo */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center">
                <Layers className="w-4 h-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-lg tracking-tight">Reverso</span>
            </div>
          </div>

          <div className="text-center space-y-1.5 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardTitle className="text-xl font-semibold text-foreground">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isRegister
                ? 'Enter your details to create your admin account'
                : 'Sign in to access your admin panel'
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/5 rounded-md border border-destructive/20 animate-slide-up">
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '75ms' }}>
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isRegister ? '100ms' : '75ms' }}>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete={isRegister ? 'email' : 'email'}
                autoFocus={!isRegister}
              />
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isRegister ? '125ms' : '100ms' }}>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isRegister ? 'Create a password (min 8 characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 8 : undefined}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-9 bg-foreground hover:bg-foreground/90 text-background font-medium animate-slide-up"
              disabled={isLoading}
              style={{ animationDelay: isRegister ? '150ms' : '125ms' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {isRegister && <UserPlus className="mr-2 h-4 w-4" />}
                  {isRegister ? 'Create account' : 'Sign in'}
                </>
              )}
            </Button>

            {canRegister && (
              <div className="text-center pt-1 animate-slide-up" style={{ animationDelay: '175ms' }}>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isRegister
                    ? 'Already have an account? Sign in'
                    : 'First time? Create an account'
                  }
                </button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
