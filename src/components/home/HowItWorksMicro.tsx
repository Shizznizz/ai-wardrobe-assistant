import { motion } from 'framer-motion';
import { Sparkles, Shirt, CheckCircle } from 'lucide-react';

export default function HowItWorksMicro() {
  const steps = [
    {
      icon: Sparkles,
      title: 'Pick Your Vibe',
      description: 'Choose your style, occasion, and weather',
    },
    {
      icon: Shirt,
      title: 'Get 3 AI Outfits',
      description: 'Olivia creates personalized looks in seconds',
    },
    {
      icon: CheckCircle,
      title: 'Save & Wear',
      description: 'Save favorites and step out in style',
    },
  ];

  return (
    <section 
      className="py-12 px-4 bg-gradient-to-b from-[#12002f]/50 to-[#1b013c]/50"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-4xl mx-auto">
        <h2 
          id="how-it-works-heading"
          className="sr-only"
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-coral-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-coral-400" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-coral-400 mb-1">
                Step {index + 1}
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-white/70">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
