import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, Calendar, User, Activity, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin privileges required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  // Fetch audit logs from API
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/audit'],
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Filter logs based on search criteria
  const filteredLogs = (auditLogs as any[]).filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === 'all' || log.userId === selectedUser;
    const matchesAction = selectedAction === 'all' || log.action.includes(selectedAction.toUpperCase());
    
    return matchesSearch && matchesUser && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('POST')) {
      return <Badge variant="default" className="bg-green-500">Create</Badge>;
    }
    if (action.includes('PUT') || action.includes('PATCH')) {
      return <Badge variant="default" className="bg-blue-500">Update</Badge>;
    }
    if (action.includes('DELETE')) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (action.includes('GET')) {
      return <Badge variant="secondary">View</Badge>;
    }
    return <Badge variant="outline">Action</Badge>;
  };

  const getEntityIcon = (entityType: string) => {
    if (entityType.includes('client')) return '🏢';
    if (entityType.includes('worker')) return '👤';
    if (entityType.includes('document')) return '📄';
    if (entityType.includes('template')) return '📋';
    return '🔧';
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t('pages.audit.title') || 'Audit Logs'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.audit.description') || 'Security and activity monitoring for administrative actions'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search actions, entities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-audit"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {/* User options will be populated from the logs data */}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="post">Create</SelectItem>
                    <SelectItem value="put">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="get">View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading audit logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedUser !== 'all' || selectedAction !== 'all' 
                    ? 'Try adjusting your filters to see more results.' 
                    : 'No audit activities have been recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log: any) => (
                  <div 
                    key={log.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`audit-log-${log.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getEntityIcon(log.entityType)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActionBadge(log.action)}
                            <span className="font-medium text-gray-900">{log.action}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {log.entityType} • {log.entityId}
                          </p>
                          {log.metadata && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {log.metadata.statusCode} • IP: {log.ip || 'Unknown'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                        {log.userId && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {log.userId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}