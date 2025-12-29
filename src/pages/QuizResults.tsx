import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Sparkles, Star, Palette, Calendar, Clock, RefreshCw, Share2, Check, Loader2 } from 'lucide-react';
import { getUserQuizResults, getUserPreferencesWithQuizData } from '@/services/QuizService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuizResultData {
  quizId: string;
  quizName: string;
  resultLabel: string;
  resultValue: any;
}

const RATE_LIMIT_KEY = 'olivia_summary_last_refresh';
const RATE_LIMIT_MS = 60000; // 1 minute between refreshes
const CACHE_KEY = 'olivia_style_summary';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const QuizResults = () => {
  const [quizResults, setQuizResults] = useState<QuizResultData[]>([]);
  const [userPrefs, setUserPrefs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [canRefresh, setCanRefresh] = useState(true);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fallbackSummary = `Based on your quiz responses, I've identified some amazing insights about your personal style! You have a wonderful blend of preferences that makes your style truly unique.

I'm now using these insights to personalize every outfit recommendation, wardrobe suggestion, and style tip I give you. The more I learn about you, the better I can help you look and feel amazing! ✨`;

  // Check rate limit
  const checkRateLimit = useCallback(() => {
    const lastRefresh = localStorage.getItem(RATE_LIMIT_KEY);
    if (!lastRefresh) return true;
    
    const timeSince = Date.now() - parseInt(lastRefresh, 10);
    if (timeSince < RATE_LIMIT_MS) {
      setRefreshCooldown(Math.ceil((RATE_LIMIT_MS - timeSince) / 1000));
      return false;
    }
    return true;
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(prev => prev - 1);
        if (refreshCooldown === 1) {
          setCanRefresh(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  // Load cached summary
  const loadCachedSummary = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { summary, timestamp, userId: cachedUserId } = JSON.parse(cached);
        if (user?.id === cachedUserId && Date.now() - timestamp < CACHE_DURATION_MS) {
          return summary;
        }
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  }, [user?.id]);

  // Save summary to cache
  const cacheSummary = useCallback((summary: string) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        summary,
        timestamp: Date.now(),
        userId: user?.id
      }));
    } catch {
      // Ignore cache errors
    }
  }, [user?.id]);

  // Generate AI summary
  const generateAISummary = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = loadCachedSummary();
      if (cached) {
        setAiSummary(cached);
        return;
      }
    }

    // Check rate limit for refresh
    if (forceRefresh && !checkRateLimit()) {
      toast.error(`Please wait ${refreshCooldown} seconds before refreshing`);
      return;
    }

    setIsGeneratingSummary(true);
    setCanRefresh(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-style-summary', {
        body: { userId: user.id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate summary');
      }

      if (data?.summary) {
        setAiSummary(data.summary);
        cacheSummary(data.summary);
        localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
        setRefreshCooldown(Math.ceil(RATE_LIMIT_MS / 1000));
        
        if (forceRefresh) {
          toast.success('Summary refreshed!');
        }
      } else if (data?.fallback) {
        setAiSummary(fallbackSummary);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      // Use fallback on error
      setAiSummary(fallbackSummary);
      if (forceRefresh) {
        toast.error('Unable to refresh summary. Using cached version.');
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [user?.id, checkRateLimit, refreshCooldown, loadCachedSummary, cacheSummary, fallbackSummary]);

  // Build shareable text
  const buildShareableText = useCallback(() => {
    let text = '✨ My Style DNA ✨\n\n';
    
    if (userPrefs) {
      if (userPrefs.quiz_derived_styles?.styleType) {
        text += `Style Type: ${userPrefs.quiz_derived_styles.styleType}\n`;
      }
      if (userPrefs.quiz_derived_lifestyle?.lifestyleType) {
        text += `Lifestyle: ${userPrefs.quiz_derived_lifestyle.lifestyleType}\n`;
      }
      if (userPrefs.quiz_derived_vibes?.vibeProfile) {
        text += `Vibe: ${userPrefs.quiz_derived_vibes.vibeProfile}\n`;
      }
      if (userPrefs.quiz_derived_eras?.styleHistory) {
        text += `Era Influence: ${userPrefs.quiz_derived_eras.styleHistory}\n`;
      }
    }

    if (quizResults.length > 0) {
      text += '\nQuiz Results:\n';
      quizResults.forEach(result => {
        text += `• ${result.quizName}: ${result.resultLabel}\n`;
      });
    }

    text += '\n— Discovered with Olivia Bloom 💫';
    return text;
  }, [userPrefs, quizResults]);

  // Share handler
  const handleShare = async () => {
    const shareText = buildShareableText();
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Style DNA copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    const loadResults = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const [results, prefs] = await Promise.all([
          getUserQuizResults(),
          getUserPreferencesWithQuizData()
        ]);
        
        setQuizResults(results);
        setUserPrefs(prefs);
      } catch (error) {
        console.error('Error loading quiz results:', error);
        toast.error('Failed to load quiz results');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
    
    // Check initial rate limit status
    setCanRefresh(checkRateLimit());
  }, [user, navigate, checkRateLimit]);

  // Generate summary after data loads
  useEffect(() => {
    if (!isLoading && user?.id && quizResults.length > 0) {
      generateAISummary(false);
    } else if (!isLoading && user?.id && quizResults.length === 0) {
      setAiSummary("Welcome! Take your first style quiz to unlock personalized insights. I'm excited to learn about your unique fashion preferences and help you discover looks that truly express who you are! ✨");
    }
  }, [isLoading, user?.id, quizResults.length, generateAISummary]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading your style insights...</p>
        </div>
      </div>
    );
  }

  const getQuizIcon = (quizId: string) => {
    switch (quizId) {
      case 'find-your-style': return <Palette className="h-5 w-5" />;
      case 'lifestyle-lens': return <Calendar className="h-5 w-5" />;
      case 'vibe-check': return <Sparkles className="h-5 w-5" />;
      case 'fashion-time-machine': return <Clock className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getQuizColor = (quizId: string) => {
    switch (quizId) {
      case 'find-your-style': return 'from-purple-500/30 to-indigo-500/30';
      case 'lifestyle-lens': return 'from-emerald-500/30 to-teal-500/30';
      case 'vibe-check': return 'from-amber-500/30 to-orange-500/30';
      case 'fashion-time-machine': return 'from-blue-500/30 to-cyan-500/30';
      default: return 'from-gray-500/30 to-gray-600/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/quizzes')}
            className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Go back to quizzes"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Quizzes
          </Button>
          
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-coral-400 via-purple-400 to-blue-400">
              Your Complete Style Profile
            </h1>
            <p className="text-white/80 text-lg">
              Here's what Olivia has learned about your unique style DNA across all your completed quizzes.
            </p>
          </div>
        </div>

        {/* Olivia's AI-Generated Summary */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/30 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="h-16 w-16 border-2 border-purple-400/50 flex-shrink-0">
                <AvatarImage src="/lovable-uploads/5be0da00-2b86-420e-b2b4-3cc8e5e4dc1a.png" alt="Olivia Bloom" />
                <AvatarFallback className="bg-purple-800">OB</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-coral-400" aria-hidden="true" />
                    Olivia's Style Summary
                  </h3>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAISummary(true)}
                      disabled={isGeneratingSummary || refreshCooldown > 0}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                      aria-label={refreshCooldown > 0 ? `Refresh available in ${refreshCooldown} seconds` : 'Refresh summary'}
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="ml-1 hidden sm:inline">
                        {refreshCooldown > 0 ? `${refreshCooldown}s` : 'Refresh'}
                      </span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                      aria-label="Share your Style DNA"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" aria-hidden="true" />
                      ) : (
                        <Share2 className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="ml-1 hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 text-white/80" role="region" aria-label="AI-generated style summary">
                  {isGeneratingSummary && !aiSummary ? (
                    <div className="flex items-center gap-2 text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Generating your personalized summary...</span>
                    </div>
                  ) : (
                    aiSummary.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" role="list" aria-label="Quiz results">
          {quizResults.map((result) => (
            <motion.div
              key={result.quizId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              role="listitem"
            >
              <Card className={`bg-gradient-to-br ${getQuizColor(result.quizId)} border-white/10 h-full`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-white/10" aria-hidden="true">
                      {getQuizIcon(result.quizId)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{result.quizName}</h3>
                      <p className="text-white/60 text-sm">Quiz Result</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-lg font-medium text-white">{result.resultLabel}</h4>
                    
                    {/* Display key insights from result value */}
                    {result.resultValue && (
                      <div className="space-y-2">
                        {result.resultValue.keyElements && (
                          <div>
                            <p className="text-white/70 text-sm mb-1">Key Elements:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.resultValue.keyElements.map((element: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-white/80 border-white/20 text-xs">
                                  {element}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {result.resultValue.preferredItems && (
                          <div>
                            <p className="text-white/70 text-sm mb-1">Preferred Items:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.resultValue.preferredItems.map((item: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-white/80 border-white/20 text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {result.resultValue.occasions && (
                          <div>
                            <p className="text-white/70 text-sm mb-1">Occasions:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.resultValue.occasions.map((occasion: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-white/80 border-white/20 text-xs">
                                  {occasion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Combined Insights */}
        {userPrefs && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                Your Style DNA Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {userPrefs.quiz_derived_styles && Object.keys(userPrefs.quiz_derived_styles).length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Style Type</h4>
                    <p className="text-coral-300 text-sm">
                      {userPrefs.quiz_derived_styles.styleType || 'Classic'}
                    </p>
                  </div>
                )}
                
                {userPrefs.quiz_derived_lifestyle && Object.keys(userPrefs.quiz_derived_lifestyle).length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Lifestyle</h4>
                    <p className="text-emerald-300 text-sm">
                      {userPrefs.quiz_derived_lifestyle.lifestyleType || 'Balanced'}
                    </p>
                  </div>
                )}
                
                {userPrefs.quiz_derived_vibes && Object.keys(userPrefs.quiz_derived_vibes).length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Vibe</h4>
                    <p className="text-amber-300 text-sm">
                      {userPrefs.quiz_derived_vibes.vibeProfile || 'Confident'}
                    </p>
                  </div>
                )}
                
                {userPrefs.quiz_derived_eras && Object.keys(userPrefs.quiz_derived_eras).length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Era Influence</h4>
                    <p className="text-blue-300 text-sm">
                      {userPrefs.quiz_derived_eras.styleHistory || 'Contemporary'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-white/70">
            Ready to see how Olivia uses these insights?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/my-wardrobe')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Explore My Wardrobe
            </Button>
            <Button 
              onClick={() => navigate('/mix-and-match')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Get Outfit Suggestions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
