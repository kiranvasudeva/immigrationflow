import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import WorkerDashboard from "@/pages/worker-dashboard";

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  
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