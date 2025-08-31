import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StageProgress from "@/components/progress/stage-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "@/contexts/I18nProvider";
import WorkflowProgressTracker from "@/components/WorkflowProgressTracker";

export default function WorkerDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized') || "Unauthorized",
        description: t('auth.loggedOut') || "You are logged out. Logging in again...",
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

  // Debug: Allow viewing for all roles for now
  if (user?.role !== 'WORKER' && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p>Worker dashboard is only accessible to workers. Your role: {user?.role || 'Unknown'}</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {user?.id}</p>
        </div>
      </div>
    );
  }

  // All workflow data is now managed directly by the WorkflowProgressTracker component

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="WORKER" />
      
      <div className="ml-64">
        <Header 
          title={t('dashboard.worker.title') || "My Immigration Progress"}
          subtitle={t('dashboard.worker.subtitle') || "Track your Romanian work permit and residence application"}
        />

        <div className="p-8">
          {/* Admin Demo Notice */}
          {user?.role === 'ADMIN' && user?.id === 'dev-admin-1' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔍 <strong>Admin Preview:</strong> This shows how the worker dashboard displays workflow data from Settings. This is demo data for demonstration.
              </p>
            </div>
          )}

          {/* Main Content */}
          {user?.id ? (
            <WorkflowProgressTracker 
              workerId={user.id}
              userRole={user.role || 'WORKER'}
              showUploadPane={true}
              showVerificationToggles={false}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <p>{t('workflow.noUser') || 'Unable to load user information'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All workflow data now handled by WorkflowProgressTracker component */}
        </div>
      </div>
    </div>
  );
}
