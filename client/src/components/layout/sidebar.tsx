import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/contexts/I18nProvider";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface SidebarProps {
  userRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
  onSectionChange?: (section: string) => void;
  currentSection?: string;
}

export default function AppSidebar({ userRole, onSectionChange, currentSection }: SidebarProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    switch (userRole) {
      case 'ADMIN': return 'AD';
      case 'OWNER': return 'TC';
      case 'WORKER': return 'JS';
      default: return 'VW';
    }
  };

  const getUserName = () => {
    switch (userRole) {
      case 'ADMIN': return 'Admin User';
      case 'OWNER': return 'TechCorp SRL';
      case 'WORKER': return 'John Smith';
      default: return 'Viewer';
    }
  };
  
  const handleNavigation = (href: string, sectionKey: string) => {
    if (onSectionChange && userRole === 'ADMIN') {
      onSectionChange(sectionKey);
    } else {
      window.location.href = href;
    }
  };

  const getNavItems = () => {
    const isActive = (href: string, sectionKey?: string) => {
      // For admin users, use currentSection if available
      if (userRole === 'ADMIN' && currentSection && sectionKey) {
        return currentSection === sectionKey;
      }
      // Fallback to URL-based matching for non-admin or when no currentSection
      if (href === '/' && (location === '/' || location === '/dashboard')) return true;
      return location.startsWith(href) && href !== '/';
    };

    const commonItems = [
      { icon: 'fas fa-chart-bar', label: 'Dashboard', href: '/dashboard', sectionKey: 'overview', active: isActive('/dashboard', 'overview') }
    ];

    switch (userRole) {
      case 'ADMIN':
        return [
          ...commonItems,
          { icon: 'fas fa-building', label: 'Clients & Employees', href: '/clients', sectionKey: 'clients', active: isActive('/clients', 'clients') },
          { icon: 'fas fa-project-diagram', label: 'Workflow Assignments', href: '/workflow-assignments', sectionKey: 'workflow', active: isActive('/workflow-assignments', 'workflow') },
          { icon: 'fas fa-file-text', label: 'Templates', href: '/templates', sectionKey: 'documents', active: isActive('/templates', 'documents') },
          { icon: 'fas fa-chart-line', label: 'Reports', href: '/reports', sectionKey: 'reports', active: isActive('/reports', 'reports') },
          { icon: 'fas fa-clipboard-list', label: 'Requirements', href: '/requirements', sectionKey: 'requirements', active: isActive('/requirements', 'requirements') },
          { icon: 'fas fa-bell', label: 'Reminders', href: '/reminders', sectionKey: 'reminders', active: isActive('/reminders', 'reminders') },
          { icon: 'fas fa-history', label: 'Audit Logs', href: '/audit', sectionKey: 'audit', active: isActive('/audit', 'audit') },
          { icon: 'fas fa-heartbeat', label: 'System Health', href: '/health-check', sectionKey: 'health', active: isActive('/health-check', 'health') },
          ...(import.meta.env.DEV || import.meta.env.VITE_QA_MODE === 'true' ? [
            { icon: 'fas fa-flask', label: 'QA Dashboard', href: '/qa', sectionKey: 'qa', active: isActive('/qa', 'qa') }
          ] : []),
          { icon: 'fas fa-cog', label: 'Settings', href: '/settings', sectionKey: 'settings', active: isActive('/settings', 'settings') }
        ];
      case 'OWNER':
        return [
          ...commonItems,
          { icon: 'fas fa-building', label: 'Company Profile', href: '/profile', active: isActive('/profile') },
          { icon: 'fas fa-users', label: 'Workers', href: '/workers', active: isActive('/workers') },
          { icon: 'fas fa-file-alt', label: 'Documents', href: '/documents', active: isActive('/documents') },
          { icon: 'fas fa-chart-line', label: 'Reports', href: '/reports', active: isActive('/reports') },
          { icon: 'fas fa-euro-sign', label: 'Payments', href: '/payments', active: isActive('/payments') },
          { icon: 'fas fa-cog', label: 'Settings', href: '/settings', active: isActive('/settings') }
        ];
      case 'WORKER':
        return [
          { icon: 'fas fa-chart-bar', label: 'My Progress', href: '/dashboard', active: isActive('/dashboard') || isActive('/') },
          { icon: 'fas fa-file-alt', label: 'Documents', href: '/documents', active: isActive('/documents') },
          { icon: 'fas fa-calendar', label: 'Deadlines', href: '/deadlines', active: isActive('/deadlines') },
          { icon: 'fas fa-user', label: 'Profile', href: '/profile', active: isActive('/profile') }
        ];
      default:
        return commonItems;
    }
  };

  return (
    <ShadcnSidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center px-4 py-2">
          <i className="fas fa-passport text-primary text-xl mr-3"></i>
          <span className="font-bold text-lg text-gray-900">ImmigrationFlow</span>
        </div>
      </SidebarHeader>
      
      <ShadcnSidebarContent>
        <SidebarGroup>
          <div className="px-4 py-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                userRole === 'ADMIN' ? 'bg-primary' :
                userRole === 'OWNER' ? 'bg-indigo-600' :
                userRole === 'WORKER' ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                <span className="text-white text-sm font-medium">{getUserInitials()}</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                <p className="text-xs text-secondary">{userRole === 'OWNER' ? 'Client Owner' : userRole.charAt(0) + userRole.slice(1).toLowerCase()}</p>
              </div>
            </div>
          </div>
          
          <SidebarMenu>
            {getNavItems().map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton 
                  isActive={(item as any).active}
                  onClick={() => handleNavigation((item as any).href || '/', (item as any).sectionKey || 'overview')}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={`${item.icon} mr-3`}></i>
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </ShadcnSidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-3 space-y-2">
          <LanguageSelector className="w-full" />
          <Button 
            variant="ghost" 
            className="w-full justify-start text-secondary hover:bg-gray-50"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt mr-3"></i>
            {t('actions.signOut') || 'Sign Out'}
          </Button>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
