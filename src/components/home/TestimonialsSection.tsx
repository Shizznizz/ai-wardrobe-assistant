
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ImageOff } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

interface TestimonialProps {
  text: string;
  name: string;
  role: string;
  rating?: number;
  index: number;
}

const TestimonialsSection = () => {
  const isMobile = useIsMobile();
  
  const testimonials = [
    {
      text: "Olivia has completely transformed how I dress. I save so much time and always look put together!",
      name: "Jessica T.",
      role: "Marketing Executive",
      rating: 5
    },
    {
      text: "The weather-based recommendations are spot on. I'm never caught unprepared anymore!",
      name: "Michelle K.",
      role: "Teacher",
      rating: 5
    },
    {
      text: "As someone who struggles with fashion choices, Olivia has been a lifesaver. I feel confident in my outfits now.",
      name: "Sarah L.",
      role: "Software Developer",
      rating: 5
    },
    {
      text: "The virtual try-on feature is incredible! I can see how new pieces look with my existing wardrobe before buying.",
      name: "Emma R.",
      role: "Graphic Designer",
      rating: 5
    },
    {
      text: "Olivia's style quizzes helped me discover my own fashion personality. I get compliments on my outfits every day now!",
      name: "Tina M.",
      role: "Healthcare Professional",
      rating: 5
    }
  ];

  return (
    <motion.section
      className="py-24 px-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.7 }}
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto max-w-6xl">
        <header className="mb-12 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6 text-coral-400" aria-hidden="true" />
            <h2 
              id="testimonials-heading"
              className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-coral-400 to-purple-400"
            >
              What Fashion Lovers Say
            </h2>
          </div>
          <p className="text-center text-white/70 mb-12 max-w-2xl mx-auto">
            Join thousands of women who have transformed their style experience with Olivia's AI fashion assistance.
          </p>
        </header>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem 
                key={index} 
                className={`${isMobile ? 'basis-full' : 'basis-1/3'} pl-4`}
              >
                <TestimonialCard testimonial={testimonial} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <div className="flex justify-center mt-8 gap-4">
            <CarouselPrevious className="relative inset-0 translate-y-0" />
            <CarouselNext className="relative inset-0 translate-y-0" />
          </div>
        </Carousel>
        
        {/* Olivia comment */}
        <OliviaComment />
      </div>
    </motion.section>
  );
};

// Olivia avatar with image fallback
const OliviaComment = () => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <motion.div 
      className="mt-12 flex justify-end max-w-xs ml-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <div className="relative">
        <div className="absolute -right-2 -top-10 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 speech-bubble-right">
          <p className="text-sm text-white/90 italic">Love hearing this! 💜</p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-coral-500/30">
          {imageError ? (
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-r from-coral-500/20 to-purple-500/20"
              role="img"
              aria-label="Olivia"
            >
              <span className="text-white font-bold text-lg">O</span>
            </div>
          ) : (
            <img 
              src="/lovable-uploads/5be0da00-2b86-420e-b2b4-3cc8e5e4dc1a.png" 
              alt="Olivia"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Testimonial Card component with avatar and star rating
const TestimonialCard = ({ testimonial, index }: { testimonial: any, index: number }) => {
  return (
    <motion.div 
      className="group glass-dark p-6 rounded-xl border border-white/10 hover:border-coral-500/30 transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
    >
      {/* Star Rating */}
      <div className="mb-4 flex">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <div key={i} className="text-coral-400 mr-1 group-hover:text-coral-300 transition-colors">
            ★
          </div>
        ))}
      </div>
      
      {/* Testimonial Text */}
      <p className="mb-6 text-white/80 italic">"{testimonial.text}"</p>
      
      {/* Profile */}
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-coral-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-lg mr-3">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="font-bold">{testimonial.name}</p>
          <p className="text-white/60 text-sm">{testimonial.role}</p>
        </div>
      </div>
      
      {/* Gradient border - visible on hover */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-coral-500/0 to-purple-500/0 group-hover:from-coral-500/20 group-hover:to-purple-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300"></div>
    </motion.div>
  );
};

export default TestimonialsSection;
