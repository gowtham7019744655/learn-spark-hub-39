import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArrowLeft, Loader2, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';

interface AuthFormProps {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  dashboardPath: string;
  emailPlaceholder?: string;
  namePlaceholder?: string;
  showUsn?: boolean;
  requireCollegeEmail?: boolean;
}

const collegeEmailRegex = /^[^@]+@[^@]+\.ac\.in$/i;

const createLoginSchema = (requireCollegeEmail: boolean) => z.object({
  email: z.string().email('Please enter a valid email').refine(
    (email) => !requireCollegeEmail || collegeEmailRegex.test(email),
    { message: 'Please use an official college email (e.g., name@college.ac.in)' }
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const createBaseSignupSchema = (requireCollegeEmail: boolean) => z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email').refine(
    (email) => !requireCollegeEmail || collegeEmailRegex.test(email),
    { message: 'Please use an official college email (e.g., name@college.ac.in)' }
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const createSignupWithUsnSchema = (requireCollegeEmail: boolean) => createBaseSignupSchema(requireCollegeEmail).extend({
  usn: z.string().min(3, 'USN must be at least 3 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const createSignupSchema = (requireCollegeEmail: boolean) => createBaseSignupSchema(requireCollegeEmail).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const AuthForm = ({
  role,
  title,
  description,
  icon: Icon,
  iconClassName = "bg-primary/10",
  dashboardPath,
  emailPlaceholder = "you@email.com",
  namePlaceholder = "Your Name",
  showUsn = false,
  requireCollegeEmail = false,
}: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', usn: '' });
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, isAuthenticated, role: userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userRole) {
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, userRole, dashboardPath, navigate]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setLoginForm({ email: '', password: '' });
    setSignupForm({ email: '', password: '', confirmPassword: '', fullName: '', usn: '' });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = createLoginSchema(requireCollegeEmail).safeParse(loginForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      if (error) {
        toast.error(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message);
      } else {
        toast.success('Welcome back!');
        navigate(dashboardPath);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = showUsn ? createSignupWithUsnSchema(requireCollegeEmail) : createSignupSchema(requireCollegeEmail);
    const result = schema.safeParse(signupForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(signupForm.email, signupForm.password, role, signupForm.fullName, showUsn ? signupForm.usn : undefined);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
          handleTabChange('login');
          setLoginForm(prev => ({ ...prev, email: signupForm.email }));
        } else {
          toast.error(error.message || 'Failed to create account');
        }
      } else {
        toast.success('Account created! Welcome!');
        navigate(dashboardPath);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          {/* Background glow */}
          <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-xl" />
          
          <Card className="border-border/50 shadow-xl shadow-primary/5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <CardHeader className="pb-4 text-center">
              <div className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${iconClassName} transition-transform hover:scale-105`}>
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="font-semibold">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="font-semibold">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="animate-in fade-in-0 duration-300">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={emailPlaceholder}
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        autoComplete="email"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        autoComplete="current-password"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="h-11 w-full text-base font-semibold shadow-md shadow-primary/20" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="animate-in fade-in-0 duration-300">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={namePlaceholder}
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        autoComplete="name"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                    {showUsn && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-usn" className="text-sm font-medium">USN (University Serial Number)</Label>
                        <Input
                          id="signup-usn"
                          type="text"
                          placeholder="1XX21CS001"
                          value={signupForm.usn}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, usn: e.target.value.toUpperCase() }))}
                          required
                          disabled={loading}
                          className="h-11"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={emailPlaceholder}
                        value={signupForm.email}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        autoComplete="email"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="h-11 w-full text-base font-semibold shadow-md shadow-primary/20" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-8 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
