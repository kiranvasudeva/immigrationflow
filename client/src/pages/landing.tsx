import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = () => {
    window.location.href = "/api/login";
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
              <Button variant="ghost" data-testid="button-features">Features</Button>
              <Button variant="ghost" data-testid="button-pricing">Pricing</Button>
              <Button variant="ghost" data-testid="button-support">Support</Button>
              <Button onClick={() => setShowLoginModal(true)} data-testid="button-login">
                Login
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
              Streamline Romanian <br />
              <span className="text-primary">Immigration Workflows</span>
            </h1>
            <p className="text-xl text-secondary mb-8 max-w-3xl mx-auto">
              Complete SaaS platform for managing work permits, visa applications, and residence permits. 
              From AJOFM labor market tests to final IGI approvals.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-trial">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" data-testid="button-demo">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-secondary">Comprehensive immigration workflow management</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-client-management">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Client Management</h3>
                <p className="text-secondary">Manage Romanian companies with CUI, ONRC, and CAEN data. Track multiple workers per client profile.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-workflow-tracking">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-clipboard-check text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Workflow Tracking</h3>
                <p className="text-secondary">Complete Romanian immigration stages: AJOFM → Work Permit → Visa D/AM → Residence Permit.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-document-generation">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-file-pdf text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Generation</h3>
                <p className="text-secondary">Auto-generate PDFs from templates with client data. Watermarking and secure preview system.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-smart-reminders">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-bell text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Reminders</h3>
                <p className="text-secondary">Automated reminders for deadlines, document expiries, and missing submissions with email notifications.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-gdpr-compliant">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">GDPR Compliant</h3>
                <p className="text-secondary">EU data residency, comprehensive audit trails, and secure file storage with role-based access.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow" data-testid="card-advanced-search">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-search text-white text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Search</h3>
                <p className="text-secondary">Global search by client, worker, CUI, passport. Filters for overdue, expiring documents, and stages.</p>
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
              <DialogTitle className="text-2xl font-bold text-gray-900">Access ImmigrationFlow</DialogTitle>
              <p className="text-secondary mt-2">Sign in to your account</p>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fas fa-user-shield text-blue-600"></i>
                  <h4 className="font-semibold text-blue-900">For Administrators</h4>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  If you're new, signing up will automatically give you admin access to manage your immigration workflows.
                </p>
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="button-admin-login"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Admin Login / Register
                </Button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fas fa-user-tie text-green-600"></i>
                  <h4 className="font-semibold text-green-900">For Workers</h4>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  If you're a worker, you need an invitation link from your administrator to access your documents and deadlines.
                </p>
                <div className="text-center">
                  <p className="text-green-600 text-sm font-medium">
                    Check your email for an invitation link
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-secondary">
                Need help? Contact your administrator or{" "}
                <Button variant="link" className="p-0 h-auto text-xs" data-testid="link-support">
                  support team
                </Button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
