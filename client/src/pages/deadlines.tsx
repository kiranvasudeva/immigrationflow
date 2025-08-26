import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DeadlinesPage() {
  const { toast } = useToast();
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

  // Mock data - would come from API based on user's assignments
  const mockDeadlines = [
    {
      id: "1",
      title: "Upload Work Contract",
      description: "Required for IGI work permit application",
      dueDate: "2024-02-15",
      status: "urgent",
      stage: "IGI Work Permit",
      priority: "high"
    },
    {
      id: "2",
      title: "Submit Medical Certificate",
      description: "Medical examination results needed",
      dueDate: "2024-02-20",
      status: "upcoming",
      stage: "Medical Requirements",
      priority: "medium"
    },
    {
      id: "3",
      title: "Criminal Background Check",
      description: "FBI background check with apostille",
      dueDate: "2024-02-10",
      status: "completed",
      stage: "Document Preparation",
      priority: "high"
    },
    {
      id: "4",
      title: "Consulate Appointment",
      description: "Visa interview at Romanian consulate",
      dueDate: "2024-03-01",
      status: "scheduled",
      stage: "Consulate Process",
      priority: "high"
    }
  ];

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, daysUntil: number) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'urgent':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Urgent</Badge>;
      case 'upcoming':
        return daysUntil <= 7 ? 
          <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge> :
          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-500"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const sortedDeadlines = mockDeadlines.sort((a, b) => {
    const aDays = getDaysUntilDue(a.dueDate);
    const bDays = getDaysUntilDue(b.dueDate);
    if (a.status === 'completed') return 1;
    if (b.status === 'completed') return -1;
    return aDays - bDays;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user?.role || 'VIEWER'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Deadlines</h1>
              <p className="text-gray-600 mt-2">
                Track important deadlines for your immigration process
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {sortedDeadlines.map((deadline) => {
              const daysUntil = getDaysUntilDue(deadline.dueDate);
              
              return (
                <Card 
                  key={deadline.id} 
                  className={`border-l-4 ${getPriorityColor(deadline.priority)} ${
                    deadline.status === 'urgent' || daysUntil <= 3 ? 'shadow-lg' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{deadline.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{deadline.description}</p>
                        <p className="text-sm text-blue-600 mt-1 font-medium">{deadline.stage}</p>
                      </div>
                      {getStatusBadge(deadline.status, daysUntil)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {new Date(deadline.dueDate).toLocaleDateString()}
                        {deadline.status !== 'completed' && (
                          <span className="ml-2">
                            ({daysUntil > 0 ? `${daysUntil} days left` : 
                             daysUntil === 0 ? 'Due today' : `${Math.abs(daysUntil)} days overdue`})
                          </span>
                        )}
                      </div>
                      
                      {deadline.status !== 'completed' && (
                        <Button size="sm" data-testid={`button-action-${deadline.id}`}>
                          Take Action
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {mockDeadlines.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Deadlines</h3>
                <p className="text-gray-600">
                  No upcoming deadlines at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}