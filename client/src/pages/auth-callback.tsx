import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: error.message
          });
          setLocation('/');
          return;
        }

        if (data.session) {
          const response = await fetch('/api/auth/supabase-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: data.session.access_token
            }),
            credentials: 'include'
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create session');
          }

          toast({
            title: 'Success',
            description: 'You have been logged in successfully!'
          });
          
          window.location.href = '/dashboard';
        } else {
          setLocation('/');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'An error occurred during authentication'
        });
        setLocation('/');
      }
    };

    handleAuthCallback();
  }, [setLocation, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we verify your authentication.</p>
      </div>
    </div>
  );
}
