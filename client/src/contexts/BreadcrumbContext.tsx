import { createContext, useContext, useState, ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
  sectionKey?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  navigateBack: () => void;
  clear: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const addBreadcrumb = (item: BreadcrumbItem) => {
    setBreadcrumbs(prev => {
      // Check if this breadcrumb already exists
      const existingIndex = prev.findIndex(crumb => crumb.href === item.href);
      if (existingIndex !== -1) {
        // If it exists, return breadcrumbs up to and including that item
        return prev.slice(0, existingIndex + 1);
      }
      // Otherwise, add the new breadcrumb
      return [...prev, item];
    });
  };

  const navigateBack = () => {
    if (breadcrumbs.length > 1) {
      const previousBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
      setBreadcrumbs(prev => prev.slice(0, -1));
      window.location.href = previousBreadcrumb.href;
    } else if (breadcrumbs.length === 1) {
      // If only one breadcrumb, go to dashboard
      setBreadcrumbs([]);
      window.location.href = '/dashboard';
    }
  };

  const clear = () => {
    setBreadcrumbs([]);
  };

  return (
    <BreadcrumbContext.Provider value={{
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      navigateBack,
      clear
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}