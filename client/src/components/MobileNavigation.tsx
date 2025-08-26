import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  Search
} from 'lucide-react';

interface MobileNavigationProps {
  user: any;
  onLogout: () => void;
}

export function MobileNavigation({ user, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/clients', icon: Users, label: t('nav.clients') },
    { href: '/workers', icon: UserCheck, label: t('nav.workers') },
    { href: '/templates', icon: FileText, label: t('nav.templates') },
    { href: '/analytics', icon: BarChart3, label: t('nav.analytics') },
    { href: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && location === '/') return true;
    return location.startsWith(href) && href !== '/';
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden" data-testid="mobile-menu-button">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user?.username}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {navItems.map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href}>
                      <Button
                        variant={isActive(href) ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          isActive(href) ? 'bg-primary text-white' : ''
                        }`}
                        onClick={() => setIsOpen(false)}
                        data-testid={`mobile-nav-${href.replace('/', '')}`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-3">
                  <LanguageSelector className="w-full" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onLogout}
                  data-testid="mobile-logout-button"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* App Title */}
        <h1 className="text-lg font-semibold">{t('common.immigrationFlow') || 'ImmigrationFlow'}</h1>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" data-testid="mobile-search-button">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="relative" data-testid="mobile-notifications-button">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
              3
            </Badge>
          </Button>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 4).map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center p-2 h-auto ${
                  isActive(href) ? 'text-primary' : 'text-gray-600'
                }`}
                data-testid={`bottom-nav-${href.replace('/', '')}`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}