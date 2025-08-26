import { useState, useEffect } from 'react';
import { AlertBanner } from '@/components/ui/alert-banner';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function DummyDataAlert() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Set CSS variable for alert height
  useEffect(() => {
    if (isVisible) {
      document.documentElement.style.setProperty('--alert-height', '64px');
    } else {
      document.documentElement.style.setProperty('--alert-height', '0px');
    }
    
    return () => {
      document.documentElement.style.setProperty('--alert-height', '0px');
    };
  }, [isVisible]);

  // Check if dummy data alert should be shown
  useEffect(() => {
    const alertDismissed = localStorage.getItem('dummyDataAlertDismissed');
    if (alertDismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('dummyDataAlertDismissed', 'true');
    setIsVisible(false);
  };

  const handleDeleteDummyData = async () => {
    setIsDeleting(true);
    try {
      await apiRequest('DELETE', '/api/dummy-data');
      toast({
        title: "Success",
        description: "Dummy data has been deleted successfully",
      });
      handleDismiss();
    } catch (error) {
      console.error('Error deleting dummy data:', error);
      toast({
        title: "Error",
        description: "Failed to delete dummy data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60]">
      <AlertBanner
        message="📋 Demo Mode: This system contains test data prefixed with 'Test' to demonstrate functionality. You can use this sample data to explore features, then delete it when ready to add your own data."
        type="info"
        dismissible={true}
        onDismiss={handleDismiss}
        className="border-0 border-b-2"
      />
    </div>
  );
}