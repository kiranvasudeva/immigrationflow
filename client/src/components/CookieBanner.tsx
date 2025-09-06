import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Settings, Shield, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Link } from 'wouter';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'immigration-flow-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'immigration-flow-cookie-preferences';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!hasConsent) {
      // Show banner after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Load saved preferences
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.warn('Failed to parse saved cookie preferences:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    
    setPreferences(allAccepted);
    saveConsent(allAccepted);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimal: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    
    setPreferences(minimal);
    saveConsent(minimal);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setIsVisible(false);
    setShowSettings(false);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    
    // Dispatch custom event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', {
      detail: prefs
    }));
  };

  const handleUpdatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <Card className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-sm">Cookie & Privacy Notice</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience and analyze usage. 
              By continuing, you consent to our use of cookies as described in our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/cookies" className="text-blue-600 hover:underline">
                Cookie Policy
              </Link>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-cookie-settings"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Cookie Preferences
                  </DialogTitle>
                  <DialogDescription>
                    Choose which cookies you'd like to allow. Necessary cookies are required for basic functionality.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Necessary</span>
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Essential for authentication, security, and core site functionality
                      </p>
                    </div>
                    <div className="text-green-600">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Functional Cookies */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <span className="font-medium text-sm">Functional</span>
                      <p className="text-xs text-muted-foreground">
                        Remember preferences, language settings, and user interface customizations
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => handleUpdatePreference('functional', e.target.checked)}
                        className="sr-only peer"
                        data-testid="checkbox-functional-cookies"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <span className="font-medium text-sm">Analytics</span>
                      <p className="text-xs text-muted-foreground">
                        Help us understand usage patterns to improve the platform
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => handleUpdatePreference('analytics', e.target.checked)}
                        className="sr-only peer"
                        data-testid="checkbox-analytics-cookies"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <span className="font-medium text-sm">Marketing</span>
                      <p className="text-xs text-muted-foreground">
                        Show relevant product updates and feature announcements
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => handleUpdatePreference('marketing', e.target.checked)}
                        className="sr-only peer"
                        data-testid="checkbox-marketing-cookies"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSettings(false)}
                    className="flex-1"
                    data-testid="button-cancel-cookie-settings"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSavePreferences}
                    className="flex-1"
                    data-testid="button-save-cookie-preferences"
                  >
                    Save Preferences
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              data-testid="button-reject-all-cookies"
            >
              Reject All
            </Button>

            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-accept-all-cookies"
            >
              Accept All
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="p-2"
              data-testid="button-close-cookie-banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook to access cookie preferences
export function useCookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Load initial preferences
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.warn('Failed to parse cookie preferences:', error);
      }
    }

    // Listen for preference updates
    const handlePreferencesUpdate = (event: CustomEvent<CookiePreferences>) => {
      setPreferences(event.detail);
    };

    window.addEventListener('cookiePreferencesUpdated', handlePreferencesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cookiePreferencesUpdated', handlePreferencesUpdate as EventListener);
    };
  }, []);

  return preferences;
}