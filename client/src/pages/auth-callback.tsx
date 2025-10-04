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
          toast({
            title: 'Success',
            description: 'You have been logged in successfully!'
          });
          setLocation('/dashboard');
        } else {
          setLocation('/');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An error occurred during authentication'
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
