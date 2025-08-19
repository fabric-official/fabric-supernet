import { useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import logoUrl from '@/assets/fabric-logo.png'; // or '@/assets/supernet-banner.png'

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        // note: see signature note below
        // @ts-ignore
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply blur-xl animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply blur-xl animate-pulse [animation-delay:2s]" />

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
        <CardHeader className="space-y-3 pb-6">
          {/* REPLACED the decorative square with your logo */}
          <div className="flex justify-center">
            <img
              src={logoUrl}
              alt="Fabric / SuperNet"
              className="h-10 w-auto object-contain dark:brightness-110 select-none"
              draggable={false}
            />
          </div>

          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {isSignUp
              ? 'Join us and unlock the full potential of our platform'
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20 pr-11"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in here'
                  : "Don't have an account? Create one now"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
