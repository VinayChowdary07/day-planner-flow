import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from '@/lib/validation';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [signInErrors, setSignInErrors] = useState<Partial<SignInFormData>>({});
  const [signUpErrors, setSignUpErrors] = useState<Partial<SignUpFormData>>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (formData: FormData) => {
    setLoading(true);
    setSignInErrors({});
    
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    // Validate input data
    const validation = signInSchema.safeParse(rawData);
    
    if (!validation.success) {
      const fieldErrors: Partial<SignInFormData> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof SignInFormData] = error.message;
        }
      });
      setSignInErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const { email, password } = validation.data;
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      });
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (formData: FormData) => {
    setLoading(true);
    setSignUpErrors({});
    
    const rawData = {
      name: formData.get('name') as string || undefined,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    // Validate input data
    const validation = signUpSchema.safeParse(rawData);
    
    if (!validation.success) {
      const fieldErrors: Partial<SignUpFormData> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof SignUpFormData] = error.message;
        }
      });
      setSignUpErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const { email, password, name } = validation.data;
    const { error } = await signUp(email, password, name);
    
    if (error) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to Day Planner! You can now start organizing your tasks.",
      });
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Day Planner</CardTitle>
          <CardDescription>
            Organize your day efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSignIn(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className={signInErrors.email ? "border-destructive" : ""}
                  />
                  {signInErrors.email && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {signInErrors.email}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className={signInErrors.password ? "border-destructive" : ""}
                  />
                  {signInErrors.password && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {signInErrors.password}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    className={signUpErrors.name ? "border-destructive" : ""}
                  />
                  {signUpErrors.name && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {signUpErrors.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className={signUpErrors.email ? "border-destructive" : ""}
                  />
                  {signUpErrors.email && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {signUpErrors.email}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min 8 chars, mixed case, numbers, symbols)"
                    required
                    className={signUpErrors.password ? "border-destructive" : ""}
                  />
                  {signUpErrors.password && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {signUpErrors.password}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Password must contain: uppercase, lowercase, number, and symbol
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;