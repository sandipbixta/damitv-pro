import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-foreground font-medium">Loading match...</p>
        <p className="text-muted-foreground text-sm mt-1">DAMITV</p>
      </div>
    </div>
  );
};

export default LoadingState;