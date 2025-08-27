import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Link } from 'wouter';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NavigationBreadcrumb() {
  const { breadcrumbs, navigateBack } = useBreadcrumb();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      {breadcrumbs.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={navigateBack}
          className="flex items-center gap-2"
          data-testid="breadcrumb-back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage data-testid={`breadcrumb-current-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      href={item.href}
                      data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}