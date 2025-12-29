
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { adminService, UserStats } from '@/services/AdminService';
import { toast } from 'sonner';

const UserStatsSection = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadUserStats = async () => {
    try {
      setHasError(false);
      setIsLoading(true);
      const data = await adminService.getUserStats();
      if (data) {
        setUserStats(data);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setHasError(true);
      toast.error('Failed to load user stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserStats();
  }, []);

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">User Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-purple-500/30">
            <CardHeader>
              <Skeleton className="h-4 w-32 bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-700" />
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-purple-500/30">
            <CardHeader>
              <Skeleton className="h-4 w-32 bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full bg-slate-700" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">User Overview</h2>
        <Card className="bg-slate-900/50 border-red-500/30">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Failed to load user stats</h3>
            <p className="text-red-300 mb-4 text-center">Unable to retrieve user overview data.</p>
            <Button onClick={loadUserStats} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userStats) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-purple-300">User Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Users Registered</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.total_users}</div>
            <p className="text-xs text-white/60">All registered accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent User Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStats.recent_signups.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-white/80">Name</TableHead>
                    <TableHead className="text-white/80">Signup Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.recent_signups.slice(0, 5).map((signup, index) => (
                    <TableRow key={index} className="border-slate-700">
                      <TableCell className="text-white">
                        {signup.first_name}
                      </TableCell>
                      <TableCell className="text-white/60">
                        {new Date(signup.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-white/60 py-8">
                No recent signups available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserStatsSection;
