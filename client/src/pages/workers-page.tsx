import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Worker, ClientProfile } from "@shared/schema";
import { Link } from "wouter";

export default function WorkersPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all workers (admin endpoint)
  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ['/api/workers']
  });

  // Fetch clients to get company names
  const { data: clients = [], isLoading: clientsLoading } = useQuery<ClientProfile[]>({
    queryKey: ['/api/clients']
  });

  // Create client lookup map
  const clientMap = clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {} as Record<string, ClientProfile>);

  // Filter workers based on search
  const filteredWorkers = workers.filter((worker: Worker) => {
    const searchLower = searchTerm.toLowerCase();
    const client = clientMap[worker.clientProfileId];
    
    return (
      worker.firstName?.toLowerCase().includes(searchLower) ||
      worker.lastName?.toLowerCase().includes(searchLower) ||
      worker.email?.toLowerCase().includes(searchLower) ||
      worker.nationality?.toLowerCase().includes(searchLower) ||
      worker.passportNumber?.toLowerCase().includes(searchLower) ||
      client?.legalName?.toLowerCase().includes(searchLower)
    );
  });

  const isLoading = workersLoading || clientsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
              <p className="text-gray-600 mt-2">View and manage all workers across all clients</p>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-workers"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Workers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers ({filteredWorkers.length})
            </CardTitle>
            <CardDescription>
              View all workers across all client companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No workers found' : 'No workers yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? `No workers match "${searchTerm}"`
                    : 'Workers will appear here once clients add them'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkers.map((worker) => {
                  const client = clientMap[worker.clientProfileId];
                  return (
                    <Link key={worker.id} href={`/workers/${worker.id}`}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                                {worker.firstName} {worker.lastName}
                              </CardTitle>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                <Building2 className="h-3 w-3" />
                                {client?.legalName || 'Unknown Client'}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Nationality:</span>
                              <span className="text-gray-900">{worker.nationality}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Email:</span>
                              <span className="text-gray-900 truncate ml-2">{worker.email}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Phone:</span>
                              <span className="text-gray-900">{worker.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Passport:</span>
                              <span className="font-mono text-gray-900">{worker.passportNumber}</span>
                            </div>
                            {worker.assignedWorkflowIds && worker.assignedWorkflowIds.length > 0 && (
                              <div className="mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  {worker.assignedWorkflowIds.length} workflow{worker.assignedWorkflowIds.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}