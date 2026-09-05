import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, useCanRegister } from '@/stores/auth';
import { Loader2, UserPlus } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function LoginPage() {
  const {
    login,
    register,
    isSubmitting,
    isAuthenticated,
    error,
    clearError,
    checkAuth,
    checkSetupStatus,
    needsSetup,
  } = useAuthStore();
  const canRegister = useCanRegister();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    checkSetupStatus();
    // A user who already has a session should not see the form.
    checkAuth();
  }, [checkSetupStatus, checkAuth]);

  useEffect(() => {
    if (!canRegister && isRegister) {
      setIsRegister(false);
    }
  }, [canRegister, isRegister]);

  // Fresh install: there is nobody to sign in as yet, so open straight in
  // "create your account" mode instead of making the user find the toggle.
  useEffect(() => {
    if (needsSetup === true) {
      setIsRegister(true);
    }
  }, [needsSetup]);

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? '/'} replace />;
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
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--subtle))] p-4 animate-fade-in">
      <div className="w-full max-w-[440px] bg-white dark:bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-12 py-14 space-y-10 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center">
            <span className="text-white font-display text-xl font-bold">R</span>
          </div>
          <span className="font-display text-3xl font-bold" style={{ letterSpacing: '-0.5px' }}>
            Reverso
          </span>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/5 rounded-md border border-[hsl(var(--destructive))]/10 animate-slide-up">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
                className="h-11 text-[13px] border-[hsl(var(--border))] bg-white dark:bg-transparent"
              />
            </div>
          )}

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: isRegister ? '50ms' : '0ms' }}>
            <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus={!isRegister}
              className="h-11 text-[13px] border-[hsl(var(--border))] bg-white dark:bg-transparent"
            />
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: isRegister ? '75ms' : '25ms' }}>
            <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isRegister ? 'Min 8 characters' : 'Enter your password...'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={isRegister ? 8 : undefined}
              className="h-11 text-[13px] border-[hsl(var(--border))] bg-white dark:bg-transparent"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-medium text-[13px] bg-[hsl(var(--foreground))] text-white hover:bg-[hsl(var(--foreground))]/90 animate-slide-up"
            disabled={isSubmitting}
            style={{ animationDelay: isRegister ? '100ms' : '50ms' }}
          >
            {isSubmitting ? (
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
            <div className="text-center pt-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <button
                type="button"
                onClick={toggleMode}
                className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors"
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"
                }
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
