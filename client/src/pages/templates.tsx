import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { TemplateBuilder } from '@/components/template-builder/template-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Settings } from 'lucide-react';
import { DocumentTemplate, TemplateField } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<{ template: DocumentTemplate; fields: TemplateField[] } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
    enabled: isAuthenticated && !isLoading,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: { template: Partial<DocumentTemplate>; fields: Partial<TemplateField>[] }) =>
      apiRequest('POST', '/api/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreating(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Created",
        description: "Template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { template: Partial<DocumentTemplate>; fields: Partial<TemplateField>[] } }) =>
      apiRequest('PUT', `/api/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setSelectedTemplate(null);
      toast({
        title: "Template Updated",
        description: "Template has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (template: Partial<DocumentTemplate>, fields: Partial<TemplateField>[]) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.template.id,
        data: { template, fields },
      });
    } else {
      createTemplateMutation.mutate({ template, fields });
    }
  };

  const handleEdit = async (template: DocumentTemplate) => {
    try {
      const response = await apiRequest('GET', `/api/templates/${template.id}`);
      const data = await response.json();
      setSelectedTemplate(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (selectedTemplate || isCreating) {
    return (
      <div className="flex flex-col">
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null);
                  setIsCreating(false);
                }}
              >
                ← Back to Templates
              </Button>
            </div>
            <TemplateBuilder
              template={selectedTemplate?.template}
              fields={selectedTemplate?.fields}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Document Templates</h1>
            <p className="text-secondary mt-1">Create and manage document templates for Romanian immigration forms</p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2"
              data-testid="button-create-template"
            >
              <Plus className="h-4 w-4" />
              <span>Create Template</span>
            </Button>
          }
        />
        
        <div className="p-8">
          {templatesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full">
                  <Card className="text-center py-12">
                    <CardContent>
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Templates Yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first document template to get started with automated form generation.
                      </p>
                      <Button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create First Template</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                templates.map((template: DocumentTemplate) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                            className="h-8 w-8 p-0"
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            data-testid={`button-delete-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {template.description || 'No description provided'}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="capitalize">
                          {template.type.toLowerCase()}
                        </Badge>
                        <Badge variant="outline" className="uppercase">
                          {template.language}
                        </Badge>
                        {template.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>

                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Settings className="h-3 w-3 mr-1" />
                        <span>
                          {template.templateData && typeof template.templateData === 'object' && 'fields' in template.templateData
                            ? (template.templateData.fields as any[])?.length || 0
                            : 0} fields
                        </span>
                      </div>

                      <div className="text-xs text-gray-400">
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </main>
      </div>
  );
}