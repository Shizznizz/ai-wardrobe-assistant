
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/services/AdminService';
import { TrendingUp, Database, Download, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import UserStatsSection from '@/components/admin/UserStatsSection';
import QuizAnalyticsSection from '@/components/admin/QuizAnalyticsSection';
import OutfitStatsSection from '@/components/admin/OutfitStatsSection';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [adminToolsOpen, setAdminToolsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check admin status server-side on mount
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isAuthenticated) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        // Server-side admin check via user_roles table
        const adminStatus = await adminService.checkAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [isAuthenticated]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await adminService.exportAllUserData();
      toast.success('Analytics data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data. Admin access required.');
    } finally {
      setIsExporting(false);
    }
  };

  // Show loading while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin (based on server-side check)
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/80 mb-6">
            ⚠️ You are not authorized to view this page.
          </p>
          <p className="text-white/60 text-sm">
            This admin dashboard is restricted to authorized personnel only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-purple-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-white/70">AI Wardrobe Assistant Analytics - Secure Admin Zone</p>
            </div>
          </div>

          {/* User Overview Section */}
          <UserStatsSection />

          {/* Quiz Results Summary */}
          <QuizAnalyticsSection />

          {/* Outfit & Wardrobe Stats */}
          <OutfitStatsSection />

          {/* Admin Tools Section */}
          <Card className="bg-slate-900/50 border-red-500/30">
            <Collapsible open={adminToolsOpen} onOpenChange={setAdminToolsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-red-400" />
                      Admin Tools
                    </span>
                    {adminToolsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export Analytics (JSON)'}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-white/60 bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                    <strong className="text-red-400">Admin Zone:</strong> Access is validated server-side using the user_roles table. Only aggregated analytics data is exported.
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
