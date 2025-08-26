import { Button } from "@/components/ui/button";

interface SidebarProps {
  userRole: 'ADMIN' | 'OWNER' | 'WORKER' | 'VIEWER';
}

export default function Sidebar({ userRole }: SidebarProps) {
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

  const getNavItems = () => {
    const commonItems = [
      { icon: 'fas fa-chart-bar', label: 'Dashboard', active: true }
    ];

    switch (userRole) {
      case 'ADMIN':
        return [
          ...commonItems,
          { icon: 'fas fa-building', label: 'Clients' },
          { icon: 'fas fa-users', label: 'Workers' },
          { icon: 'fas fa-clipboard-list', label: 'Requirements' },
          { icon: 'fas fa-bell', label: 'Reminders' },
          { icon: 'fas fa-history', label: 'Audit Logs' }
        ];
      case 'OWNER':
        return [
          ...commonItems,
          { icon: 'fas fa-building', label: 'Company Profile' },
          { icon: 'fas fa-users', label: 'Workers' },
          { icon: 'fas fa-file-alt', label: 'Documents' },
          { icon: 'fas fa-euro-sign', label: 'Payments' }
        ];
      case 'WORKER':
        return [
          { icon: 'fas fa-chart-bar', label: 'My Progress', active: true },
          { icon: 'fas fa-file-alt', label: 'Documents' },
          { icon: 'fas fa-calendar', label: 'Deadlines' },
          { icon: 'fas fa-user', label: 'Profile' }
        ];
      default:
        return commonItems;
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <i className="fas fa-passport text-primary text-xl mr-3"></i>
        <span className="font-bold text-lg text-gray-900">ImmigrationFlow</span>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 mb-4">
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

        <div className="space-y-1 px-3">
          {getNavItems().map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "default" : "ghost"}
              className={`w-full justify-start ${
                item.active 
                  ? 'bg-blue-50 text-primary hover:bg-blue-100' 
                  : 'text-secondary hover:bg-gray-50'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <i className={`${item.icon} mr-3`}></i>
              {item.label}
            </Button>
          ))}
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-secondary hover:bg-gray-50"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt mr-3"></i>
            Sign Out
          </Button>
        </div>
      </nav>
    </div>
  );
}
