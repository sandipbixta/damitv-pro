import { Zap, Shield, Globe, Smartphone, Clock, Heart } from 'lucide-react';

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Lightning Fast',
    description: 'HD streams that start instantly with minimal buffering. No waiting around.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Safe & Secure',
    description: 'Clean streams without intrusive popups or malware. Your safety matters.',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Global Coverage',
    description: 'Access sports from every corner of the world. No geo-restrictions.',
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: 'Works Everywhere',
    description: 'Stream on any device - phone, tablet, laptop, or smart TV.',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: '24/7 Availability',
    description: "There's always something live. Football, basketball, tennis & more.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: '100% Free',
    description: 'No subscriptions, no hidden fees. Just free sports streaming.',
  },
];

const FeaturesGrid = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Why Choose <span className="text-primary">DamiTV</span>?
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Everything you need for the ultimate sports streaming experience
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
