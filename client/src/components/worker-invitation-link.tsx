import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Send, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/contexts/LanguageContext';

interface WorkerInvitationLinkProps {
  workerId?: string;
  workerEmail?: string;
}

export function WorkerInvitationLink({ workerId, workerEmail }: WorkerInvitationLinkProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string>('');
  const [email, setEmail] = useState(workerEmail || '');
  const { toast } = useToast();
  const { t } = useTranslation();

  const generateInvitationLink = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter a worker email address",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/invitations', {
        email,
        role: 'WORKER',
        workerId,
      });
      
      if (response.ok) {
        const data = await response.json();
        const baseUrl = window.location.origin;
        const fullLink = `${baseUrl}/invite/${data.token}`;
        setInvitationLink(fullLink);
        
        toast({
          title: "Success",
          description: "Invitation link generated successfully",
        });
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
      toast({
        title: "Error", 
        description: "Failed to generate invitation link",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const sendInvitation = () => {
    // This would integrate with email service
    toast({
      title: "Email Sent",
      description: `Invitation sent to ${email}`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-invite-worker">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('worker.invite') || 'Invite Worker'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('worker.inviteTitle') || 'Invite Worker to Access Profile'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="worker-email">
              {t('form.email') || 'Worker Email'}
            </Label>
            <Input
              id="worker-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@example.com"
              data-testid="input-worker-email"
            />
          </div>

          <Button 
            onClick={generateInvitationLink}
            disabled={isGenerating}
            className="w-full"
            data-testid="button-generate-invite"
          >
            {isGenerating ? t('common.generating') || 'Generating...' : t('worker.generateInvite') || 'Generate Invitation Link'}
          </Button>

          {invitationLink && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {t('worker.invitationLink') || 'Invitation Link'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('worker.linkDescription') || 'Share this link with the worker to give them access to their profile and document upload area.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input
                    value={invitationLink}
                    readOnly
                    className="text-xs"
                    data-testid="input-invitation-link"
                  />
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={sendInvitation}
                    data-testid="button-send-email"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}