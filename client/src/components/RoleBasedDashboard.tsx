import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import WorkerDashboard from "@/pages/worker-dashboard";

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  
  // Set page title based on user role
  usePageTitle('dashboard.title');
  
  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'OWNER':
      return <ClientDashboard />;
    case 'WORKER':
      return <WorkerDashboard />;
    case 'VIEWER':
      return <AdminDashboard />;
    default:
      return <ClientDashboard />;
  }
}