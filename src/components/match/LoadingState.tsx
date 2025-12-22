
const LoadingState = () => {
  return (
    <div className="min-h-screen bg-sports-dark text-sports-light">
      <div className="animate-pulse">
        <div className="h-96 bg-sports-card"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 bg-sports-card w-1/3 rounded mb-4"></div>
          <div className="h-64 bg-sports-card rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
