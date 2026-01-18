import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'Marcus J.',
    location: 'London, UK',
    rating: 5,
    text: "Best streaming site I've found! Watched the entire Premier League season without missing a single match. Quality is always excellent.",
    avatar: '🇬🇧',
  },
  {
    name: 'Carlos R.',
    location: 'Madrid, Spain',
    rating: 5,
    text: 'Finally a reliable site for La Liga matches. No buffering, no ads popup hell. Just clean streams. Highly recommend!',
    avatar: '🇪🇸',
  },
  {
    name: 'Ahmed K.',
    location: 'Dubai, UAE',
    rating: 5,
    text: 'I watch UFC and NBA here every week. Multiple stream options mean I always find a working link. Amazing service!',
    avatar: '🇦🇪',
  },
  {
    name: 'Lisa M.',
    location: 'Sydney, Australia',
    rating: 5,
    text: "As someone who works odd hours, being able to catch live matches anytime is a game changer. This site is a lifesaver!",
    avatar: '🇦🇺',
  },
  {
    name: 'David P.',
    location: 'Toronto, Canada',
    rating: 5,
    text: 'The interface is so clean and easy to use. Found my NHL game in seconds. Great work on the mobile experience too!',
    avatar: '🇨🇦',
  },
];

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          What Our <span className="text-primary">Viewers</span> Say
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          Join thousands of happy sports fans streaming every day
        </p>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote icon */}
          <Quote className="absolute -top-4 left-8 h-16 w-16 text-primary/10 -rotate-12" />
          
          {/* Testimonial card */}
          <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 overflow-hidden">
            <div className="relative z-10">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-lg md:text-xl text-foreground mb-8 leading-relaxed">
                "{testimonials[currentIndex].text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonials[currentIndex].name}</p>
                  <p className="text-sm text-muted-foreground">{testimonials[currentIndex].location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              className="rounded-full border-primary/30 hover:bg-primary/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-6 bg-primary'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full border-primary/30 hover:bg-primary/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
