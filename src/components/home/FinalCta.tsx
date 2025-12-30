
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FinalCtaProps {
  onGetStarted: () => void;
}

const FinalCta: React.FC<FinalCtaProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();

  return (
    <motion.section
      className="py-20 px-4 bg-gradient-to-r from-coral-500/20 to-purple-500/20 backdrop-blur-sm relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.7 }}
    >
      <div className="container mx-auto max-w-5xl relative">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-2/3 text-center md:text-left md:pr-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
              Ready to Transform Your Style Experience?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto md:mx-0">
              Join Olivia today and discover the perfect outfits that match your style, body type, and lifestyle.
            </p>
            <Button 
              className="bg-gradient-to-r from-[#ff4ecb] to-[#a97eff] text-white hover:scale-[1.03] transition-transform font-bold py-6 px-10 rounded-xl shadow-lg shadow-purple-900/20 h-auto text-lg flex items-center gap-2 mx-auto md:mx-0"
              onClick={() => navigate('/my-wardrobe')}
            >
              <Sparkles className="h-5 w-5" />
              Get Started For Free
            </Button>
            <p className="text-white/60 mt-4">No credit card required. Join 10,000+ happy users.</p>
          </div>
          
          {/* New Olivia image implementation */}
          <motion.div 
            className="w-full md:w-1/3 mt-8 md:mt-0 flex justify-center md:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="relative h-full">
              {/* Subtle glow effect behind Olivia */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-xl -z-10"></div>
              
              {/* Olivia image with shadow */}
              <div className="relative z-10 h-auto max-h-[400px]">
                <img 
                  src="/lovable-uploads/1edb18e4-ac7b-451e-9d08-56330d47a937.png" 
                  alt="Olivia"
                  width={768}
                  height={1152}
                  className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default FinalCta;
