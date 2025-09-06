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
import { Bell, Plus, Search, Filter, Edit2, Trash2, Calendar, Clock } from 'lucide-react';

interface ReminderRule {
  id: string;
  name: string;
  description?: string;
  triggerEvent: string;
  daysBefore: number;
  isActive: boolean;
  emailTemplate?: string;
  recipients: string[];
  createdAt: string;
  updatedAt: string;
}

export default function RemindersPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    name: '',
    description: '',
    triggerEvent: '',
    daysBefore: 7,
    isActive: true,
    emailTemplate: '',
    recipients: [] as string[]
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

  // Fetch reminder rules from API
  const { data: reminderRules = [], isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/reminder-rules'],
    enabled: isAuthenticated && ['ADMIN', 'OWNER'].includes(user?.role || '')
  });

  // Filter reminders based on search criteria
  const filteredReminders = (reminderRules as ReminderRule[]).filter((reminder: ReminderRule) => {
    const matchesSearch = !searchTerm || 
      reminder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTrigger = selectedTrigger === 'all' || reminder.triggerEvent === selectedTrigger;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && reminder.isActive) ||
      (selectedStatus === 'inactive' && !reminder.isActive);
    
    return matchesSearch && matchesTrigger && matchesStatus;
  });

  const getTriggerBadge = (trigger: string) => {
    if (trigger.includes('deadline')) {
      return <Badge variant="default" className="bg-red-500">Deadline</Badge>;
    }
    if (trigger.includes('document')) {
      return <Badge variant="default" className="bg-blue-500">Document</Badge>;
    }
    if (trigger.includes('status')) {
      return <Badge variant="default" className="bg-green-500">Status</Badge>;
    }
    return <Badge variant="outline">Event</Badge>;
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              {t('pages.reminders.title') || 'Reminder Rules'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('pages.reminders.description') || 'Configure automated reminders for deadlines and milestones'}
            </p>
          </div>
          
          {user?.role === 'ADMIN' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-create-reminder">
                  <Plus className="h-4 w-4" />
                  Add Reminder Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Reminder Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated reminders for important deadlines and events.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={newReminder.name}
                      onChange={(e) => setNewReminder({...newReminder, name: e.target.value})}
                      placeholder="e.g., Work Permit Deadline Reminder"
                      data-testid="input-reminder-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="triggerEvent">Trigger Event</Label>
                    <Select 
                      value={newReminder.triggerEvent} 
                      onValueChange={(value) => setNewReminder({...newReminder, triggerEvent: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document_deadline">Document Deadline</SelectItem>
                        <SelectItem value="work_permit_expiry">Work Permit Expiry</SelectItem>
                        <SelectItem value="visa_deadline">Visa Application Deadline</SelectItem>
                        <SelectItem value="status_change">Status Change</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="daysBefore">Days Before Event</Label>
                    <Input
                      id="daysBefore"
                      type="number"
                      value={newReminder.daysBefore}
                      onChange={(e) => setNewReminder({...newReminder, daysBefore: parseInt(e.target.value) || 7})}
                      placeholder="7"
                      data-testid="input-reminder-days"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => {/* Handle create */}}
                    data-testid="button-save-reminder"
                  >
                    Create Reminder Rule
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
                    placeholder="Search reminder rules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-reminders"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger Event</label>
                <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                  <SelectTrigger>
                    <SelectValue placeholder="All triggers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="document_deadline">Document Deadline</SelectItem>
                    <SelectItem value="work_permit_expiry">Work Permit Expiry</SelectItem>
                    <SelectItem value="visa_deadline">Visa Deadline</SelectItem>
                    <SelectItem value="status_change">Status Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminder Rules List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Reminder Rules ({filteredReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading reminder rules...</p>
              </div>
            ) : filteredReminders.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reminder rules found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedTrigger !== 'all' || selectedStatus !== 'all' 
                    ? 'Try adjusting your filters to see more results.' 
                    : 'No reminder rules have been created yet. Set up automated reminders to keep workflows on track.'}
                </p>
                {user?.role === 'ADMIN' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-reminder">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Reminder Rule
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReminders.map((reminder: ReminderRule) => (
                  <div 
                    key={reminder.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`reminder-card-${reminder.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{reminder.name}</h3>
                          {getTriggerBadge(reminder.triggerEvent)}
                          <Badge variant={reminder.isActive ? "default" : "secondary"}>
                            {reminder.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {reminder.description && (
                          <p className="text-gray-600 text-sm mb-2">{reminder.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {reminder.daysBefore} days before
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(reminder.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {user?.role === 'ADMIN' && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-edit-reminder-${reminder.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" data-testid={`button-delete-reminder-${reminder.id}`}>
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