import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';

interface Requirement {
  id: string;
  title: string;
  description?: string;
  category: string;
  stage: string;
  isRequired: boolean;
  documentTypes?: string[];
  templateId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function RequirementsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    category: '',
    stage: '',
    isRequired: true,
    documentTypes: [] as string[],
    templateId: '',
    order: 0
  });

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || ''))) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Admin or Owner privileges required.",
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

  if (!isAuthenticated || !['ADMIN', 'OWNER'].includes(user?.role || '')) {
    return null;
  }

  // Fetch requirements from API
  const { data: requirements = [], isLoading: requirementsLoading } = useQuery({
    queryKey: ['/api/requirements'],
    enabled: isAuthenticated && ['ADMIN', 'OWNER'].includes(user?.role || ''),
  });

  // Create requirement mutation
  const createRequirementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create requirement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/requirements'] });
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewRequirement({
        title: '',
        description: '',
        category: '',
        stage: '',
        isRequired: true,
        documentTypes: [],
        templateId: '',
        order: 0
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create requirement",
        variant: "destructive",
      });
    },
  });

  // Filter requirements based on search criteria
  const filteredRequirements = (requirements as Requirement[]).filter((req: Requirement) => {
    const matchesSearch = !searchTerm || 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || req.category === selectedCategory;
    const matchesStage = selectedStage === 'all' || req.stage === selectedStage;
    
    return matchesSearch && matchesCategory && matchesStage;
  });

  const handleCreateRequirement = () => {
    createRequirementMutation.mutate(newRequirement);
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              {t('pages.requirements.title') || 'Document Requirements'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.requirements.description') || 'Manage document requirements for immigration workflows'}
            </p>
          </div>
          
          {user?.role === 'ADMIN' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-create-requirement">
                  <Plus className="h-4 w-4" />
                  Add Requirement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Requirement</DialogTitle>
                  <DialogDescription>
                    Add a new document requirement for immigration workflows.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newRequirement.title}
                      onChange={(e) => setNewRequirement({...newRequirement, title: e.target.value})}
                      placeholder="e.g., Valid Passport"
                      data-testid="input-requirement-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newRequirement.description}
                      onChange={(e) => setNewRequirement({...newRequirement, description: e.target.value})}
                      placeholder="Detailed description of the requirement..."
                      data-testid="textarea-requirement-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={newRequirement.category}
                        onChange={(e) => setNewRequirement({...newRequirement, category: e.target.value})}
                        placeholder="e.g., Identity, Education"
                        data-testid="input-requirement-category"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stage">Stage</Label>
                      <Input
                        id="stage"
                        value={newRequirement.stage}
                        onChange={(e) => setNewRequirement({...newRequirement, stage: e.target.value})}
                        placeholder="e.g., Initial Application"
                        data-testid="input-requirement-stage"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateRequirement}
                    disabled={createRequirementMutation.isPending}
                    data-testid="button-save-requirement"
                  >
                    {createRequirementMutation.isPending ? 'Creating...' : 'Create Requirement'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
                    placeholder="Search requirements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-requirements"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Identity">Identity</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Employment">Employment</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="Initial Application">Initial Application</SelectItem>
                    <SelectItem value="Work Permit">Work Permit</SelectItem>
                    <SelectItem value="Visa Application">Visa Application</SelectItem>
                    <SelectItem value="Residence Permit">Residence Permit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Requirements ({filteredRequirements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requirementsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading requirements...</p>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all' || selectedStage !== 'all' 
                    ? 'Try adjusting your filters to see more results.' 
                    : 'No document requirements have been created yet.'}
                </p>
                {user?.role === 'ADMIN' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-requirement">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Requirement
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequirements.map((requirement: Requirement) => (
                  <div 
                    key={requirement.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`requirement-card-${requirement.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{requirement.title}</h3>
                          {requirement.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{requirement.category}</Badge>
                        </div>
                        
                        {requirement.description && (
                          <p className="text-gray-600 text-sm mb-2">{requirement.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Stage: {requirement.stage}</span>
                          <span>Order: {requirement.order}</span>
                          {requirement.documentTypes && requirement.documentTypes.length > 0 && (
                            <span>Types: {requirement.documentTypes.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      
                      {user?.role === 'ADMIN' && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-edit-requirement-${requirement.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`button-delete-requirement-${requirement.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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