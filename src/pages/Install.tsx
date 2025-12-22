import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageLayout from '@/components/PageLayout';
import SEOMetaTags from '@/components/SEOMetaTags';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [downloadStats, setDownloadStats] = useState<{ android: number; ios: number }>({ android: 0, ios: 0 });
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fetch download stats
    fetchDownloadStats();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const fetchDownloadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_download_stats');
      if (!error && data) {
        const stats = { android: 0, ios: 0 };
        data.forEach((item: { platform: string; total_downloads: number }) => {
          if (item.platform === 'android') stats.android = item.total_downloads;
          if (item.platform === 'ios') stats.ios = item.total_downloads;
        });
        setDownloadStats(stats);
      }
    } catch (error) {
      console.error('Error fetching download stats:', error);
    }
  };

  const trackDownload = async (platform: 'android' | 'ios') => {
    try {
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);

      await supabase.from('app_downloads').insert({
        platform,
        session_id: sessionId,
        user_agent: navigator.userAgent,
      });

      // Update local stats
      setDownloadStats(prev => ({
        ...prev,
        [platform]: prev[platform] + 1
      }));

      toast({
        title: "Download started",
        description: `Thank you for downloading DamiTV for ${platform === 'android' ? 'Android' : 'iOS'}!`,
      });
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <PageLayout>
      <SEOMetaTags
        title="Install DamiTV App - Free Sports Streaming App"
        description="Install DamiTV progressive web app for the best sports streaming experience. Watch live football, basketball, and more on any device offline."
        keywords="install damitv app, sports streaming app, pwa install, offline sports streaming"
        canonicalUrl="https://damitv.pro/install"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Install DamiTV App</h1>
            <p className="text-xl text-muted-foreground">
              Get the best sports streaming experience with our installable app
            </p>
          </div>

          {/* Ad Information Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mb-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">📱 Ad-Free Experience After Installation</h3>
              <p className="text-muted-foreground">
                You may see 1-2 ads during installation, but after that, <strong>enjoy unlimited matches without any restrictions or interruptions!</strong>
              </p>
            </CardContent>
          </Card>

          {isInstalled ? (
            <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-8 text-center">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">App Already Installed!</h2>
                <p className="text-muted-foreground mb-6">
                  You're all set to enjoy DamiTV. Open the app from your home screen.
                </p>
                <Button asChild>
                  <a href="/">Go to Homepage</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Horizontal Layout for Android and iOS */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Android Installation Section */}
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Download className="h-8 w-8 text-green-500" />
                        <span className="text-xl font-bold">Android</span>
                      </div>
                      <h2 className="text-lg font-bold mb-2">Install DamiTV App</h2>
                      <p className="text-xs text-muted-foreground mb-4">
                        For Android phones: Add DamiTV to your home screen
                      </p>
                      
                      <Button 
                        onClick={() => {
                          trackDownload('android');
                          window.open('https://damitv-pro.netlify.app', '_blank');
                        }}
                        size="default"
                        className="bg-green-600 hover:bg-green-700 text-white w-full mb-2"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download App
                      </Button>
                      <p className="text-xs text-green-600 font-semibold mb-3">
                        {downloadStats.android.toLocaleString()} downloads
                      </p>
                      
                      <div className="bg-background/50 p-3 rounded-lg border text-left">
                        <p className="text-xs font-semibold mb-1">Quick Steps:</p>
                        <ol className="space-y-0.5 text-xs text-muted-foreground">
                          <li>1. Open Chrome browser</li>
                          <li>2. Tap Menu (⋮)</li>
                          <li>3. Tap "Install app" or "Add to Home Screen"</li>
                          <li>4. ✅ App icon on home screen</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* iOS Installation Section */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Smartphone className="h-8 w-8 text-blue-500" />
                        <span className="text-xl font-bold">iOS</span>
                      </div>
                      <h2 className="text-lg font-bold mb-2">Install DamiTV App</h2>
                      <p className="text-xs text-muted-foreground mb-4">
                        For iPhone/iPad: Add DamiTV to your home screen
                      </p>
                      
                      <Button 
                        onClick={() => {
                          trackDownload('ios');
                          window.open('https://damitv-pro.netlify.app', '_blank');
                        }}
                        size="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full mb-2"
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        Download App
                      </Button>
                      
                      <p className="text-xs text-blue-600 font-semibold mb-3">
                        {downloadStats.ios.toLocaleString()} installations
                      </p>
                      
                      <div className="bg-background/50 p-3 rounded-lg border text-left">
                        <p className="text-xs font-semibold mb-1">Quick Steps:</p>
                        <ol className="space-y-0.5 text-xs text-muted-foreground">
                          <li>1. Open Safari browser</li>
                          <li>2. Tap Share (↗️)</li>
                          <li>3. Tap "Add to Home Screen"</li>
                          <li>4. ✅ App icon on home screen</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">✨ Benefits of Installing</h3>
                  <ul className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Works offline - access content without internet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Faster loading times with caching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Full-screen experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Push notifications for live matches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Easy access from home screen or apps menu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Less data usage with smart caching</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Install;
