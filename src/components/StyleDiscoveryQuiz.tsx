import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Sparkles, Umbrella, Sunset, Moon, Check, ArrowRight, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QuizQuestion from './QuizQuestion';
import OutfitSuggestion from './OutfitSuggestion';
import { Confetti } from '@/components/ui/confetti';
import QuizIntroMessage from './QuizIntroMessage';

interface StyleDiscoveryQuizProps {
  onClose?: () => void;
  onComplete?: () => void;
}

const StyleDiscoveryQuiz = ({ onClose, onComplete }: StyleDiscoveryQuizProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const questions = [
    {
      id: 'mood',
      question: "How are you feeling today?",
      options: [
        { value: 'energetic', label: 'Energetic 🌟', icon: Sparkles },
        { value: 'relaxed', label: 'Relaxed 😌', icon: Sunset },
        { value: 'focused', label: 'Focused 🧠', icon: Coffee },
        { value: 'playful', label: 'Playful 🎉', icon: Sparkles },
      ],
    },
    {
      id: 'weather',
      question: "What's the weather like?",
      options: [
        { value: 'sunny', label: 'Sunny 🌞', icon: Sunset },
        { value: 'rainy', label: 'Rainy ☔', icon: Umbrella },
        { value: 'cloudy', label: 'Cloudy ☁️', icon: Moon },
        { value: 'mixed', label: 'Mixed 🌈', icon: Coffee },
      ],
    },
    {
      id: 'occasion',
      question: "What's your main activity today?",
      options: [
        { value: 'work', label: 'Work 💼', icon: Coffee },
        { value: 'casual', label: 'Casual Hangout 🛋️', icon: Sunset },
        { value: 'date', label: 'Date Night 💖', icon: Moon },
        { value: 'party', label: 'Party 🎊', icon: Sparkles },
      ],
    },
  ];
  
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
    setCurrentStep(currentStep + 1);
    
    if (currentStep === questions.length - 1) {
      setShowConfetti(true);
      if (onComplete) onComplete();
    }
  };
  
  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
  };
  
  const toggleQuiz = () => {
    setShowQuiz(!showQuiz);
    setCurrentStep(0);
    setAnswers({});
  };
  
  const getOutfitSuggestion = () => {
    const moodOutfits: Record<string, string> = {
      'energetic': 'vibrant and bold',
      'relaxed': 'comfortable and flowy',
      'focused': 'structured and clean',
      'playful': 'fun and colorful'
    };
    
    const weatherOutfits: Record<string, string> = {
      'sunny': 'light and airy',
      'rainy': 'waterproof and practical',
      'cloudy': 'layered and versatile',
      'mixed': 'adaptable with accessories'
    };
    
    const occasionOutfits: Record<string, string> = {
      'work': 'professional yet stylish',
      'casual': 'effortless and comfortable',
      'date': 'romantic and flattering',
      'party': 'statement-making and festive'
    };
    
    const mood = answers.mood || 'relaxed';
    const weather = answers.weather || 'sunny';
    const occasion = answers.occasion || 'casual';
    
    return {
      title: `Your ${moodOutfits[mood]} mood outfit`,
      description: `Based on your ${mood} mood and the ${weather} weather, here's a ${moodOutfits[mood]} outfit that's perfect for your ${occasion} plans! Add some fun accessories to really make it pop!`,
      image: `/lovable-uploads/c26c0c8c-7ff3-432a-b79b-1d22494daba6.png`,
      items: [
        'A confidence-boosting top in a color that makes you smile',
        'Bottoms that match your activity level for today',
        'Shoes that keep you comfortable while looking great',
        'One statement accessory to express your current mood',
        'Optional layer for weather changes throughout the day'
      ]
    };
  };
  
  const isCompleted = currentStep >= questions.length;
  
  return (
    <div className="relative w-full my-12">
      {showConfetti && (
        <Confetti 
          duration={2000}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      
      {!showQuiz ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-xl overflow-hidden shadow-lg border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-purple-900/40 backdrop-blur-md p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-pink-400 shadow-md hover:scale-105 transition-transform duration-300">
              <AvatarImage src="/lovable-uploads/5be0da00-2b86-420e-b2b4-3cc8e5e4dc1a.png" alt="Olivia Bloom" />
              <AvatarFallback className="bg-purple-800">OB</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                What's Your Mood Today?
              </h3>
              <p className="text-sm md:text-base text-blue-100 mb-5">
                Let Olivia guide you to your perfect mood-based outfit! Ready for some fun? 🎉
              </p>
              
              <Button 
                onClick={toggleQuiz}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-pink-500/20 min-h-[44px] transform hover:scale-[1.02] transition-all duration-200 active:scale-95 text-lg font-medium"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Let's Get Stylin'!
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-xl overflow-hidden shadow-lg border border-purple-500/20 bg-gradient-to-br from-slate-900/80 to-purple-900/40 backdrop-blur-md"
        >
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-pink-400/50">
                <AvatarImage src="/lovable-uploads/5be0da00-2b86-420e-b2b4-3cc8e5e4dc1a.png" alt="Olivia Bloom" />
                <AvatarFallback className="bg-purple-800">OB</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-medium text-white">What's Your Mood Today?</h3>
                <div className="flex items-center gap-1">
                  {questions.map((_, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full w-6 transition-all duration-300 transform",
                        index < currentStep ? "bg-pink-500 scale-100" : "bg-white/20 scale-90"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleQuiz}
              className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-5 md:p-6">
            {!isCompleted && <QuizIntroMessage />}
            <AnimatePresence mode="wait">
              {!isCompleted ? (
                <QuizQuestion 
                  key={currentStep}
                  question={questions[currentStep]}
                  onAnswer={(answer) => handleAnswer(questions[currentStep].id, answer)}
                />
              ) : (
                <OutfitSuggestion 
                  key="result"
                  suggestion={getOutfitSuggestion()}
                  onReset={handleReset}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StyleDiscoveryQuiz;
