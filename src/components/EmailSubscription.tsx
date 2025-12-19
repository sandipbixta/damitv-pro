import React, { useState, useEffect } from 'react';
import { Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailSubscriptionProps {
  compact?: boolean;
}
const EmailSubscription: React.FC<EmailSubscriptionProps> = ({
  compact = false
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    supabase.auth.getUser().then(({
      data: {
        user
      }
    }) => {
      setUserId(user?.id || null);
    });
  }, []);
  const popularTeams = ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Paris Saint-Germain'];
  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('email_subscriptions').insert({
        email,
        user_id: userId,
        subscribed_teams: selectedTeams,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already subscribed',
            description: 'This email is already subscribed to match alerts.'
          });
        } else {
          throw error;
        }
      } else {
        // Send confirmation email
        try {
          await supabase.functions.invoke('send-subscription-confirmation', {
            body: {
              email,
              selectedTeams
            }
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the subscription if email fails
        }
        setSubscribed(true);
        toast({
          title: 'Successfully subscribed!',
          description: 'Check your email for confirmation.'
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: 'Failed to subscribe. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]);
  };
  if (subscribed) {
    return <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
          <p className="text-muted-foreground">
            Check your email for a confirmation link.
          </p>
        </CardContent>
      </Card>;
  }
  if (compact) {
    return <div className="flex gap-2">
        <Input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className="flex-1" />
        <Button onClick={handleSubscribe} disabled={loading} className="bg-primary hover:bg-primary/90">
          <Mail className="h-4 w-4 mr-2" />
          Subscribe
        </Button>
      </div>;
  }
  return;
};
export default EmailSubscription;