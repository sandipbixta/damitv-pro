import { useEffect, useState, useRef } from 'react';
import { Globe, Users, Trophy, Tv } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}

const StatItem = ({ icon, value, label, suffix = '' }: StatItemProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
};

const StatsCounter = () => {
  const stats = [
    { icon: <Users className="h-7 w-7" />, value: 150000, label: 'Active Users', suffix: '+' },
    { icon: <Trophy className="h-7 w-7" />, value: 50, label: 'Sports Covered', suffix: '+' },
    { icon: <Tv className="h-7 w-7" />, value: 500, label: 'Live Channels', suffix: '+' },
    { icon: <Globe className="h-7 w-7" />, value: 180, label: 'Countries', suffix: '+' },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Trusted by Sports Fans <span className="text-primary">Worldwide</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Join millions of viewers streaming their favorite sports every day
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
