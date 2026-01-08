import React from 'react';
import { ShieldAlert, Chrome, Globe, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface AdBlockerWarningProps {
  isUnsupportedBrowser?: boolean;
}

export const AdBlockerWarning: React.FC<AdBlockerWarningProps> = ({ isUnsupportedBrowser = false }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  if (isUnsupportedBrowser) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4" id="adblock-wall">
        <div className="max-w-md w-full bg-card border-2 border-orange-500 rounded-2xl p-8 text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <AlertTriangle className="w-24 h-24 text-orange-500 animate-pulse" />
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-foreground">
            Unsupported Browser
          </h1>

          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            Please switch to a supported browser (Chrome, Safari, Edge, or Firefox) to continue viewing the streams.
          </p>

          <div className="bg-muted/50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 text-left">
              <Chrome className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground mb-1">Supported Browsers</p>
                <p className="text-sm text-muted-foreground">
                  Chrome, Safari, Microsoft Edge, or Firefox
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Thank you for your understanding! 🙏
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4" id="adblock-wall">
      <div className="max-w-md w-full bg-card border-2 border-destructive rounded-2xl p-8 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ShieldAlert className="w-24 h-24 text-destructive animate-pulse" />
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-foreground">
          Ad Blocker Detected
        </h1>

        <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
          Please disable your Ad Blocker or switch to a supported browser (Chrome, Safari) to continue viewing the streams.
        </p>

        <div className="bg-muted/50 rounded-xl p-6 mb-6 space-y-4">
          <div className="flex items-start gap-3 text-left">
            <Chrome className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground mb-1">Option 1: Disable Ad Blocker</p>
              <p className="text-sm text-muted-foreground">
                Click on your ad blocker extension and disable it for this site
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-start gap-3 text-left">
              <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground mb-1">Option 2: Use Another Browser</p>
                <p className="text-sm text-muted-foreground">
                  Try accessing our site from a browser without ad blocker installed
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleRefresh} 
          size="lg" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          I've Disabled Ad Blocker - Refresh
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Thank you for supporting our free service! 🙏
        </p>
      </div>
    </div>
  );
};
