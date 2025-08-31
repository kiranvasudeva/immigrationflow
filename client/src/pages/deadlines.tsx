import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/contexts/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DeadlinesPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

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

  // Fetch user-specific deadlines from API
  const { data: deadlines = [], isLoading: deadlinesLoading, error: deadlinesError } = useQuery({
    queryKey: ['/api/user/deadlines'],
    enabled: isAuthenticated,
  });

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
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('status.completed') || 'Completed'}</Badge>;
      case 'urgent':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{t('status.urgent') || 'Urgent'}</Badge>;
      case 'upcoming':
        return daysUntil <= 7 ? 
          <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />{t('status.dueSoon') || 'Due Soon'}</Badge> :
          <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t('status.upcoming') || 'Upcoming'}</Badge>;
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-500"><Calendar className="h-3 w-3 mr-1" />{t('status.scheduled') || 'Scheduled'}</Badge>;
      default:
        return <Badge variant="outline">{t('status.unknown') || 'Unknown'}</Badge>;
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

  const sortedDeadlines = (deadlines as any[]).sort((a: any, b: any) => {
    const aDays = getDaysUntilDue(a.dueDate);
    const bDays = getDaysUntilDue(b.dueDate);
    if (a.status === 'completed') return 1;
    if (b.status === 'completed') return -1;
    return aDays - bDays;
  });

  return (
    <>
      <div className="flex flex-col">
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('pages.deadlines.title') || 'Deadlines'}</h1>
              <p className="text-gray-600 mt-2">
                {t('pages.deadlines.description') || 'Track important deadlines for your immigration process'}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {sortedDeadlines.map((deadline: any) => {
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
                          {t('actions.takeAction') || 'Take Action'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(deadlines as any[]).length === 0 && !deadlinesLoading && (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('pages.deadlines.noDeadlines') || 'No Deadlines'}</h3>
                <p className="text-gray-600">
                  {t('pages.deadlines.noDeadlinesDescription') || 'No upcoming deadlines at this time.'}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
}