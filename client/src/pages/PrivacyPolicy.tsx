import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Download, Mail, Eye, Lock, Database, UserCheck, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
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
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your privacy is our priority. This policy explains how ImmigrationFlow collects, 
            uses, and protects your personal data in compliance with GDPR and Romanian data protection laws.
          </p>
          <Badge variant="secondary" className="gap-2">
            <FileText className="w-4 h-4" />
            Last updated: {lastUpdated}
          </Badge>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="text-center">
              <p className="font-medium mb-2">Exercise Your Rights</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  <Link href="/gdpr/export">Export Data</Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Contact DPO
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Controller */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <UserCheck className="w-6 h-6 text-blue-600 mt-1" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Data Controller</h2>
              <div className="space-y-1 text-sm">
                <p><strong>Company:</strong> ImmigrationFlow SRL</p>
                <p><strong>Registration:</strong> J40/XXXXX/2025, CUI: ROXXXXXXXX</p>
                <p><strong>Address:</strong> Bucharest, Romania</p>
                <p><strong>Email:</strong> privacy@immigrationflow.com</p>
                <p><strong>DPO Contact:</strong> dpo@immigrationflow.com</p>
              </div>
            </div>
          </div>
        </Card>

        {/* What Data We Collect */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-green-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What Personal Data We Collect</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Email address and password</li>
                    <li>• Full name and contact details</li>
                    <li>• Professional role and company</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Immigration Data</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Passport and identity documents</li>
                    <li>• Work permits and visa applications</li>
                    <li>• Employment and education history</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Technical Data</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• IP addresses and device information</li>
                    <li>• Browser type and usage patterns</li>
                    <li>• Cookies and session data</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Communication Data</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Support tickets and correspondence</li>
                    <li>• System notifications and reminders</li>
                    <li>• Audit logs and activity records</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Legal Basis */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-purple-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Legal Basis for Processing</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Contract Performance (Art. 6(1)(b) GDPR)</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing necessary to provide immigration workflow services you've requested
                  </p>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Legitimate Interest (Art. 6(1)(f) GDPR)</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Security monitoring, fraud prevention, and service improvement
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Legal Obligation (Art. 6(1)(c) GDPR)</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compliance with Romanian immigration laws and tax requirements
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Consent (Art. 6(1)(a) GDPR)</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Marketing communications and optional analytics (you can withdraw anytime)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Retention */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Eye className="w-6 h-6 text-orange-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">How Long We Keep Your Data</h2>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <strong className="text-sm">Active Accounts</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    For the duration of your account plus 3 years for legal compliance
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <strong className="text-sm">Immigration Documents</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    Retained for 7 years as required by Romanian immigration law
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <strong className="text-sm">Audit Logs</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    Security logs kept for 12 months, compliance logs for 3 years
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <strong className="text-sm">Marketing Data</strong>
                  <p className="text-xs text-muted-foreground mt-1">
                    Until you unsubscribe or withdraw consent
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Rights Under GDPR</h2>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <strong className="text-sm">Right to Access & Portability</strong>
                    <p className="text-xs text-muted-foreground">
                      Get a copy of your personal data in a machine-readable format
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <strong className="text-sm">Right to Rectification</strong>
                    <p className="text-xs text-muted-foreground">
                      Correct inaccurate or incomplete personal information
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <strong className="text-sm">Right to Erasure ("Right to be Forgotten")</strong>
                    <p className="text-xs text-muted-foreground">
                      Request deletion of your personal data (subject to legal retention requirements)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <strong className="text-sm">Right to Restrict Processing</strong>
                    <p className="text-xs text-muted-foreground">
                      Limit how we process your data while disputes are resolved
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                <p className="text-sm">
                  <strong>To exercise your rights:</strong> Contact our Data Protection Officer at{' '}
                  <a href="mailto:dpo@immigrationflow.com" className="text-blue-600 hover:underline">
                    dpo@immigrationflow.com
                  </a>{' '}
                  or use the automated tools above. We respond within 30 days as required by GDPR.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Sharing */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <UserCheck className="w-6 h-6 text-indigo-600 mt-1" />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Data Sharing & Third Parties</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Romanian Government Agencies</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    IGI (Immigration Office), AJOFM/ANOFM (Employment Agency), and other relevant authorities 
                    as required for immigration processing
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Service Providers</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cloud hosting (EU-based), payment processors, and email services - all with GDPR compliance guarantees
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong className="text-sm">Legal Requirements</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    Court orders, law enforcement requests, or other legal obligations under Romanian or EU law
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm">
                  <strong>Important:</strong> We never sell your personal data to third parties. 
                  All data transfers outside the EU are protected by adequacy decisions or appropriate safeguards.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Questions About This Policy?</h2>
          <p className="text-muted-foreground mb-4">
            Our Data Protection Officer is here to help with any privacy questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              dpo@immigrationflow.com
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cookies">Cookie Policy</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}