import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Users, Share2, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CDNEvent, fetchCDNEvents } from '@/services/cdnEventsApi';
import { triggerPopunderAd } from '@/utils/popunderAd';
import PageLayout from '@/components/PageLayout';

const CDNEventPlayer: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<CDNEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTriggeredAd, setHasTriggeredAd] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const events = await fetchCDNEvents();
        const found = events.find(e => e.id === eventId);
        setEvent(found || null);
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  // Trigger popunder ad on first interaction
  const handlePlayerInteraction = () => {
    if (!hasTriggeredAd && event) {
      triggerPopunderAd(event.id, 'cdn_event_play');
      setHasTriggeredAd(true);
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!event) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-muted-foreground mb-6">The event you're looking for is not available.</p>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {event.isLive && (
              <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleFullscreen}>
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Event Title */}
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="capitalize">{event.sport}</span>
            {event.league && (
              <>
                <span>•</span>
                <span>{event.league}</span>
              </>
            )}
            <span>•</span>
            <span>{event.time}</span>
          </div>
        </div>

        {/* Video Player */}
        <div 
          className="relative w-full bg-black rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/9' }}
          onClick={handlePlayerInteraction}
        >
          {event.embedUrl ? (
            <iframe
              ref={iframeRef}
              src={event.embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg">Stream not available</p>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="mt-6 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-semibold mb-3">Event Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Sport</span>
              <p className="font-medium capitalize">{event.sport}</p>
            </div>
            {event.league && (
              <div>
                <span className="text-muted-foreground">League</span>
                <p className="font-medium">{event.league}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium">{event.isLive ? 'Live Now' : 'Upcoming'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Time</span>
              <p className="font-medium">{event.time}</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CDNEventPlayer;
