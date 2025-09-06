import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cookie, Settings, Shield, BarChart3, Megaphone, Database, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

export default function CookiePolicy() {
  const lastUpdated = new Date('2025-09-06').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-2">
            <Cookie className="w-8 h-8 text-amber-600" />
            <h1 className="text-4xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This policy explains how ImmigrationFlow uses cookies and similar technologies 
            to provide, secure, and improve our immigration workflow services.
          </p>
          <Badge variant="secondary" className="gap-2">
            <Database className="w-4 h-4" />
            Last updated: {lastUpdated}
          </Badge>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="text-center">
              <p className="font-medium mb-2">Manage Cookie Preferences</p>
              <div className="flex gap-2">
                <Button className="gap-2" data-testid="button-open-cookie-settings">
                  <Settings className="w-4 h-4" />
                  Cookie Settings
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/privacy">Privacy Policy</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* What Are Cookies */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-amber-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What Are Cookies?</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  Cookies are small text files stored on your device when you visit websites. They help websites 
                  remember information about your visit, like your preferences and login status. Similar technologies 
                  include local storage, session storage, and pixels.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/10">
                  <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">First-Party Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Set directly by ImmigrationFlow for essential functionality like authentication and preferences
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
                  <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Third-Party Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Set by external services we use (with your consent) for analytics and security
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Types of Cookies We Use */}
        <Card className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-600" />
              Types of Cookies We Use
            </h2>

            {/* Necessary Cookies */}
            <div className="border rounded-lg p-4 bg-red-50/30 dark:bg-red-950/10">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-red-600 mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Necessary Cookies</h3>
                    <Badge variant="destructive" className="text-xs">Always Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Essential for the website to function properly. Cannot be disabled without affecting core functionality.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Authentication Cookies</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">access_token</code> - JWT access token (15 min)</div>
                        <div><code className="bg-muted px-1 rounded">refresh_token</code> - JWT refresh token (30 days)</div>
                        <div><code className="bg-muted px-1 rounded">csrf-token</code> - CSRF protection (1 hour)</div>
                      </div>
                    </div>

                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Session Cookies</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">connect.sid</code> - Session identifier (session)</div>
                        <div><code className="bg-muted px-1 rounded">cookie-consent</code> - Cookie preferences (1 year)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-950/10">
              <div className="flex items-start gap-3">
                <Settings className="w-6 h-6 text-blue-600 mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Functional Cookies</h3>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Remember your preferences and settings to provide a personalized experience.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">User Preferences</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">theme</code> - Dark/light mode preference</div>
                        <div><code className="bg-muted px-1 rounded">language</code> - Interface language</div>
                        <div><code className="bg-muted px-1 rounded">dashboard-layout</code> - UI customizations</div>
                      </div>
                    </div>

                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Workflow State</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">last-viewed-client</code> - Resume workflow</div>
                        <div><code className="bg-muted px-1 rounded">form-draft</code> - Save form progress</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border rounded-lg p-4 bg-green-50/30 dark:bg-green-950/10">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-6 h-6 text-green-600 mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Analytics Cookies</h3>
                    <Badge variant="outline" className="text-xs">Requires Consent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Help us understand how the platform is used so we can improve performance and user experience.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Usage Analytics</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">_analytics_session</code> - Session tracking (2 hours)</div>
                        <div><code className="bg-muted px-1 rounded">_page_views</code> - Page visit counter (1 month)</div>
                        <div><code className="bg-muted px-1 rounded">_feature_usage</code> - Feature adoption (3 months)</div>
                      </div>
                    </div>

                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Performance Monitoring</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">_performance_metrics</code> - Load times (1 week)</div>
                        <div><code className="bg-muted px-1 rounded">_error_tracking</code> - Error reports (1 month)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="border rounded-lg p-4 bg-purple-50/30 dark:bg-purple-950/10">
              <div className="flex items-start gap-3">
                <Megaphone className="w-6 h-6 text-purple-600 mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Marketing Cookies</h3>
                    <Badge variant="outline" className="text-xs">Requires Consent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track visits across websites to show relevant product updates and feature announcements.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Product Communication</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">_announcement_shown</code> - Feature announcements (6 months)</div>
                        <div><code className="bg-muted px-1 rounded">_onboarding_progress</code> - Tutorial state (1 year)</div>
                      </div>
                    </div>

                    <div className="p-3 bg-background/60 rounded border">
                      <div className="font-medium text-sm mb-1">Content Personalization</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><code className="bg-muted px-1 rounded">_content_interests</code> - Relevant content (3 months)</div>
                        <div><code className="bg-muted px-1 rounded">_help_preferences</code> - Support personalization (6 months)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Third-Party Services */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-indigo-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Third-Party Services</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Security Services
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• reCAPTCHA (Google) - Bot protection</li>
                    <li>• Cloudflare - DDoS protection & CDN</li>
                    <li>• Auth0 - Identity verification</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Analytics Services
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Plausible Analytics - Privacy-first analytics</li>
                    <li>• Sentry - Error monitoring</li>
                    <li>• Hotjar - User experience insights</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-600" />
                    Communication
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Mailjet - Transactional emails</li>
                    <li>• Intercom - Customer support chat</li>
                    <li>• Calendly - Meeting scheduling</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-600" />
                    Infrastructure
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AWS (EU-West-1) - Cloud hosting</li>
                    <li>• Neon - Database services</li>
                    <li>• Redis Cloud - Session storage</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Data Processing Agreements</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      All third-party services have signed Data Processing Agreements (DPAs) ensuring GDPR compliance 
                      and appropriate data protection safeguards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Managing Cookies */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Settings className="w-6 h-6 text-slate-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Managing Your Cookie Preferences</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Cookie Settings Panel</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use our cookie preferences panel to control which types of cookies you allow. 
                    Your choices are saved and respected across all sessions.
                  </p>
                  <Button className="gap-2" data-testid="button-manage-cookies">
                    <Cookie className="w-4 h-4" />
                    Manage Cookie Preferences
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Browser Settings</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You can also control cookies through your browser settings. Note that blocking 
                    necessary cookies may affect website functionality.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• Chrome: Settings → Privacy and security → Cookies</div>
                    <div>• Firefox: Settings → Privacy & Security → Cookies</div>
                    <div>• Safari: Preferences → Privacy → Cookies</div>
                    <div>• Edge: Settings → Site permissions → Cookies</div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Do Not Track</h3>
                  <p className="text-sm text-muted-foreground">
                    We respect Do Not Track (DNT) signals. When DNT is enabled, we automatically 
                    disable analytics and marketing cookies while maintaining essential functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Questions About Cookies?</h2>
          <p className="text-muted-foreground mb-4">
            Contact our Data Protection Officer if you have questions about how we use cookies or tracking technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" className="gap-2">
              <Cookie className="w-4 h-4" />
              dpo@immigrationflow.com
            </Button>
            <Button variant="outline" asChild>
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}