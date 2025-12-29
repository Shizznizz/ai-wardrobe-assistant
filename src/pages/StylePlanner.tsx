
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import EnhancedHeroSection from '@/components/shared/EnhancedHeroSection';
import OutfitCalendar from '@/components/outfits/OutfitCalendar';
import WeeklyOutfitPlanner from '@/components/style-planner/WeeklyOutfitPlanner';
import { useOutfitContext } from '@/hooks/useOutfitContext';
import { useLocationStorage } from '@/hooks/useLocationStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CalendarIcon, CalendarDays, Clock, Users, Sparkles, Activity, PieChart, MessageCircle } from 'lucide-react';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import CollapsibleOliviaSection from '@/components/outfits/CollapsibleOliviaSection';
import MissedOpportunitiesSection from '@/components/outfits/calendar/MissedOpportunitiesSection';
import SmartRemindersPanel from '@/components/olivia/SmartRemindersPanel';
import OliviaChatPanel from '@/components/olivia/OliviaChatPanel';
import { Button } from '@/components/ui/button';

const StylePlanner = () => {
  const { outfits, clothingItems, outfitLogs, addOutfitLog, loading } = useOutfitContext();
  const { savedLocation } = useLocationStorage();
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showOliviaChat, setShowOliviaChat] = useState(false);
  const isMobile = useIsMobile();

  const handleShowTimeline = () => {
    setShowTimeline(true);
    const timelineSection = document.getElementById('style-timeline');
    if (timelineSection) {
      timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleChatClick = () => {
    setShowOliviaChat(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white pb-20">
      <EnhancedHeroSection
        title="Plan, Track & Analyze Your Style"
        subtitle="Visualize your fashion journey, review insights, and plan outfits with Olivia's help."
        image={{
          src: "/lovable-uploads/56943e49-b4d1-47fe-adf7-ee221134ef60.png",
          alt: "Woman in light beige pantsuit with gold belt and sunglasses",
          variant: "standing"
        }}
        buttons={[
          {
            label: "Show Me My Style Timeline",
            onClick: handleShowTimeline,
            variant: "lavender"
          }
        ]}
      />

      {/* Weekly Outfit Planner Section */}
      <section className="container mx-auto px-4 pt-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <WeeklyOutfitPlanner
            outfits={outfits}
            clothingItems={clothingItems}
            outfitLogs={outfitLogs}
            onAddLog={addOutfitLog}
            loading={loading}
          />
        </motion.div>
      </section>
      
      {/* My Style Calendar Section */}
      <section className="container mx-auto px-4 pt-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-purple-200">My Style Calendar</h2>
            <p className="text-purple-200/80">Track, plan and analyze your outfits over time</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-purple-500/20 shadow-lg">
            <OutfitCalendar 
              outfits={outfits} 
              clothingItems={clothingItems}
              onAddLog={addOutfitLog}
              location={savedLocation}
            />
          </div>
        </motion.div>
      </section>
      
      {/* Smart Reminders */}
      <section className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <SmartRemindersPanel />
        </motion.div>
      </section>

      {/* Enhanced Olivia Chat Section */}
      <section className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <CollapsibleOliviaSection 
            onChatClick={handleChatClick} 
            selectedDate={selectedDate}
          />
        </motion.div>
      </section>
      
      {/* Missed Opportunities Section */}
      <section className="container mx-auto px-4 py-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-purple-200">Missed Opportunities</h2>
            <p className="text-purple-200/80">Days where you had activities but didn't record an outfit</p>
          </div>

          <MissedOpportunitiesSection 
            outfits={outfits} 
            outfitLogs={outfitLogs} 
            clothingItems={clothingItems}
          />
        </motion.div>
      </section>

      {/* Olivia Chat Panel */}
      <OliviaChatPanel
        isOpen={showOliviaChat}
        onClose={() => setShowOliviaChat(false)}
        wardrobeCount={clothingItems?.length || null}
      />
    </div>
  );
};

export default StylePlanner;
