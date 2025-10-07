import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTranslation } from "@/contexts/I18nProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { supabase, buildAuthOptions } from "@/lib/supabase";
import { normalizeEmail, isValidEmail } from "@/utils/normalizeEmail";

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setLanguage, t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  
  usePageTitle('landing.title', 'Welcome to ImmigrationFlow');
  
  useEffect(() => {
    const saved = localStorage.getItem('immigration-app-language');
    if (!saved) {
      setLanguage('ro');
    }
  }, [setLanguage]);

  const handleLogin = () => {
    // Open the login modal instead of redirecting
    setShowLoginModal(true);
  };

  const handleAdminLogin = () => {
    setShowLoginForm(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user?.firstName || 'User'}!`,
        });
        setShowLoginModal(false);
        setShowLoginForm(false);
        setLocation('/dashboard');
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Connection error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const emailToUse = normalizeEmail(otpEmail);
      
      if (!isValidEmail(emailToUse)) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address.",
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        console.debug("[auth] OTP submit", { email: emailToUse });
      }
      
      const authOptions = buildAuthOptions('otp', emailToUse);
      const { error } = await supabase.auth.signInWithOtp(authOptions);
      
      if (error) throw error;
      
      setOtpSent(true);
      toast({
        title: "Code Sent",
        description: "Check your email for a 6-digit verification code.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification code.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const emailToUse = normalizeEmail(otpEmail);
      
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'email',
        email: emailToUse,
        token: otpCode,
      });
      
      if (error) throw error;
      
      if (data.session) {
        const response = await fetch('/api/auth/supabase-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: data.session.access_token
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        toast({
          title: "Success",
          description: "You have been logged in successfully!",
        });
        
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid or expired code.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLinkLoading(true);
    try {
      const emailToUse = normalizeEmail(magicLinkEmail);
      
      if (!isValidEmail(emailToUse)) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address.",
        });
        return;
      }
      
      if (import.meta.env.DEV) {
        console.debug("[auth] Magic-link submit", { email: emailToUse });
      }
      
      const authOptions = buildAuthOptions('magic-link', emailToUse);
      const { error } = await supabase.auth.signInWithOtp(authOptions);
      
      if (error) throw error;
      
      setMagicLinkSent(true);
      toast({
        title: "Magic Link Sent",
        description: "Check your email and click the link to sign in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send magic link.",
      });
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-passport text-primary text-2xl mr-3"></i>
              <span className="font-bold text-xl text-gray-900">ImmigrationFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button variant="ghost" data-testid="button-features">{t('nav.features') || 'Features'}</Button>
              <Button variant="ghost" data-testid="button-pricing">{t('nav.pricing') || 'Pricing'}</Button>
              <Button variant="ghost" data-testid="button-support">{t('nav.support') || 'Support'}</Button>
              <Button onClick={() => setShowLoginModal(true)} data-testid="button-login">
                {t('landing.login') || 'Login'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('landing.title') || 'Streamline Romanian'} <br />
              <span className="text-primary">{t('landing.subtitle') || 'Immigration Workflows'}</span>
            </h1>
            <p className="text-xl text-secondary mb-8 max-w-3xl mx-auto">
              {t('landing.description') || 'Complete SaaS platform for managing work permits, visa applications, and residence permits. From AJOFM labor market tests to final IGI approvals.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-trial">
                {t('landing.trial') || 'Start Free Trial'}
              </Button>
              <Button variant="outline" size="lg" data-testid="button-demo">
                {t('landing.demo') || 'Schedule Demo'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.features.title') || 'Everything You Need'}</h2>
            <p className="text-xl text-secondary">{t('landing.features.subtitle') || 'Comprehensive immigration workflow management'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-client-management">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.clientManagement') || 'Client Management'}</h3>
                <p className="text-secondary">{t('landing.features.clientManagementDesc') || 'Manage Romanian companies with CUI, ONRC, and CAEN data. Track multiple workers per client profile.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-workflow-tracking">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-clipboard-check text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.workflowTracking') || 'Workflow Tracking'}</h3>
                <p className="text-secondary">{t('landing.features.workflowTrackingDesc') || 'Complete Romanian immigration stages: AJOFM → Work Permit → Visa D/AM → Residence Permit.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-document-generation">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-file-pdf text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.documentGeneration') || 'Document Generation'}</h3>
                <p className="text-secondary">{t('landing.features.documentGenerationDesc') || 'Auto-generate PDFs from templates with client data. Watermarking and secure preview system.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-smart-reminders">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-bell text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.smartReminders') || 'Smart Reminders'}</h3>
                <p className="text-secondary">{t('landing.features.smartRemindersDesc') || 'Automated reminders for deadlines, document expiries, and missing submissions with email notifications.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-gdpr-compliant">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.gdprCompliant') || 'GDPR Compliant'}</h3>
                <p className="text-secondary">{t('landing.features.gdprCompliantDesc') || 'EU data residency, comprehensive audit trails, and secure file storage with role-based access.'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-advanced-search">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-search text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('landing.features.advancedSearch') || 'Advanced Search'}</h3>
                <p className="text-secondary">{t('landing.features.advancedSearchDesc') || 'Global search by client, worker, CUI, passport. Filters for overdue, expiring documents, and stages.'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-center mb-4">
              <i className="fas fa-passport text-primary text-3xl mb-4"></i>
              <DialogTitle className="text-2xl font-bold text-gray-900">{t('modal.login.title') || 'Access ImmigrationFlow'}</DialogTitle>
              <p className="text-secondary mt-2">{t('modal.login.subtitle') || 'Sign in to your account'}</p>
            </div>
          </DialogHeader>

          {!showLoginForm ? (
            <Tabs defaultValue="otp" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="otp" data-testid="tab-otp">Email Code</TabsTrigger>
                <TabsTrigger value="magic-link" data-testid="tab-magic-link">Magic Link</TabsTrigger>
                <TabsTrigger value="admin" data-testid="tab-admin">Admin/Worker</TabsTrigger>
              </TabsList>
              
              <TabsContent value="otp" className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email</Label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="you@example.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        onBlur={(e) => setOtpEmail(normalizeEmail(e.target.value))}
                        inputMode="email"
                        autoComplete="email"
                        pattern='[^\s"<>@]+@[^\s"<>@]+\.[^\s"<>@]+'
                        required
                        data-testid="input-otp-email"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={otpLoading} data-testid="button-send-otp">
                      {otpLoading ? "Sending..." : "Send Code"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-code">Enter 6-digit code</Label>
                      <p className="text-sm text-muted-foreground">
                        Check your email ({otpEmail}) for the verification code
                      </p>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otpCode}
                          onChange={setOtpCode}
                          data-testid="input-otp-code"
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        data-testid="button-otp-back"
                      >
                        Back
                      </Button>
                      <Button type="submit" className="w-full" disabled={otpLoading || otpCode.length !== 6} data-testid="button-verify-otp">
                        {otpLoading ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="magic-link" className="space-y-4">
                {!magicLinkSent ? (
                  <form onSubmit={handleSendMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-link-email">Email</Label>
                      <Input
                        id="magic-link-email"
                        type="email"
                        placeholder="you@example.com"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        onBlur={(e) => setMagicLinkEmail(normalizeEmail(e.target.value))}
                        inputMode="email"
                        autoComplete="email"
                        pattern='[^\s"<>@]+@[^\s"<>@]+\.[^\s"<>@]+'
                        required
                        data-testid="input-magic-link-email"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={magicLinkLoading} data-testid="button-send-magic-link">
                      {magicLinkLoading ? "Sending..." : "Send Magic Link"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">Magic link sent!</p>
                      <p className="text-sm text-muted-foreground">
                        Check your email ({magicLinkEmail}) and click the link to sign in.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setMagicLinkEmail("");
                      }}
                      data-testid="button-magic-link-back"
                    >
                      Send Another Link
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-user-shield text-blue-600"></i>
                      <h4 className="font-semibold text-blue-900">{t('modal.login.adminTitle') || 'For Administrators'}</h4>
                    </div>
                    <p className="text-blue-700 text-sm mb-3">
                      {t('modal.login.adminDesc') || "If you're new, signing up will automatically give you admin access to manage your immigration workflows."}
                    </p>
                    <Button 
                      onClick={handleAdminLogin} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      data-testid="button-admin-login"
                    >
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      {t('modal.login.adminButton') || 'Admin Login / Register'}
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-user-tie text-green-600"></i>
                      <h4 className="font-semibold text-green-900">{t('modal.login.workerTitle') || 'For Workers'}</h4>
                    </div>
                    <p className="text-green-700 text-sm mb-3">
                      {t('modal.login.workerDesc') || "If you have an invitation link from your employer, use it to access your immigration progress."}
                    </p>
                    <div className="text-center">
                      <p className="text-green-600 text-sm font-medium">
                        {t('modal.login.invitationText') || 'Check your email for an invitation link'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-secondary">
                    {t('modal.login.supportText') || 'Need help? Contact your administrator or'}{" "}
                    <Button variant="link" className="p-0 h-auto text-xs" data-testid="link-support">
                      {t('modal.login.supportLink') || 'support team'}
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@demo.law"
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Demo!2345"
                  required
                  data-testid="input-password"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Test credentials:</strong><br />
                  Email: admin@demo.law<br />
                  Password: Demo!2345
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLoginForm(false)}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="button-submit-login"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
