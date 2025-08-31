import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ClientForm from "@/components/forms/client-form";
import { ClientProfile, InsertClientProfile } from "@shared/schema";
import { Link } from "wouter";

export default function ClientsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery<ClientProfile[]>({
    queryKey: ['/api/clients']
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClientProfile) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      toast({
        title: "Client created successfully",
        description: "The new client has been added to the system."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowNewClientDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create client",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Filter clients based on search
  const filteredClients = clients.filter((client: ClientProfile) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.legalName?.toLowerCase().includes(searchLower) ||
      client.cui?.toLowerCase().includes(searchLower) ||
      client.contactEmail?.toLowerCase().includes(searchLower) ||
      client.adminName?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateClient = (data: any) => {
    // Remove ownerUserId if it's undefined since it's optional
    const { ownerUserId, ...clientData } = data;
    const finalData = ownerUserId ? { ...clientData, ownerUserId } : clientData;
    createClientMutation.mutate(finalData);
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600 mt-2">Manage your client companies and their information</p>
            </div>
          </div>
        </div>

        {/* Search and Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-clients"
                  />
                </div>
              </div>
              <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="whitespace-nowrap"
                    data-testid="button-add-client"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Create a new client company profile
                    </DialogDescription>
                  </DialogHeader>
                  <ClientForm 
                    onSubmit={handleCreateClient}
                    isLoading={createClientMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clients ({filteredClients.length})
            </CardTitle>
            <CardDescription>
              View and manage client companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? `No clients match "${searchTerm}"`
                    : 'Get started by adding your first client company'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowNewClientDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                              {client.legalName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mb-2">
                              {client.adminName}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">CUI:</span>
                            <span className="font-mono text-gray-900">{client.cui}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Email:</span>
                            <span className="text-gray-900 truncate ml-2">{client.contactEmail}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Phone:</span>
                            <span className="text-gray-900">{client.phoneNumber}</span>
                          </div>
                          {client.caen && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">CAEN:</span>
                              <span className="font-mono text-gray-900">{client.caen}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}