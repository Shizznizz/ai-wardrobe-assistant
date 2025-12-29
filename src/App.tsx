
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from '@/pages/Home';
import MyWardrobe from '@/pages/MyWardrobe';
import MixAndMatch from '@/pages/MixAndMatch';
import StylePlanner from '@/pages/StylePlanner';
import FittingRoom from '@/pages/FittingRoom';
import ShopAndTry from '@/pages/ShopAndTry';
import Profile from '@/pages/Profile';
import Premium from '@/pages/Premium';
// Additional pages
import Auth from '@/pages/Auth';
import Quizzes from '@/pages/Quizzes';
import StyleQuizPage from '@/pages/StyleQuiz';
import QuizResults from '@/pages/QuizResults';
import AdminDashboard from '@/pages/AdminDashboard';
import Pitch from '@/pages/Pitch';

// Providers and Components
import { Toaster } from 'sonner';
import { OutfitProvider } from '@/hooks/useOutfitContext';
import { LocationProvider } from '@/hooks/useLocationStorage';
import { AuthProvider } from '@/hooks/useAuth';
import { UserDataProvider } from '@/hooks/useUserData';
import PageLayout from '@/components/shared/PageLayout';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ConfigErrorBanner from '@/components/shared/ConfigErrorBanner';

function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <LocationProvider>
          <OutfitProvider>
            <Router>
              <ConfigErrorBanner />
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<PageLayout><Home /></PageLayout>} />
                <Route path="/auth" element={<PageLayout><Auth /></PageLayout>} />
                <Route path="/pitch" element={<PageLayout><Pitch /></PageLayout>} />
                
                {/* Protected routes - require authentication */}
                <Route path="/my-wardrobe" element={
                  <ProtectedRoute>
                    <PageLayout><MyWardrobe /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/mix-and-match" element={
                  <ProtectedRoute>
                    <PageLayout><MixAndMatch /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/style-planner" element={
                  <ProtectedRoute>
                    <PageLayout><StylePlanner /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/fitting-room" element={
                  <ProtectedRoute>
                    <PageLayout><FittingRoom /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/shop-and-try" element={
                  <ProtectedRoute>
                    <PageLayout><ShopAndTry /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <PageLayout><Profile /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/premium" element={
                  <ProtectedRoute>
                    <PageLayout><Premium /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/quizzes" element={
                  <ProtectedRoute>
                    <PageLayout><Quizzes /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/quiz-results" element={
                  <ProtectedRoute>
                    <PageLayout><QuizResults /></PageLayout>
                  </ProtectedRoute>
                } />
                <Route path="/find-your-style" element={
                  <ProtectedRoute>
                    <PageLayout><StyleQuizPage /></PageLayout>
                  </ProtectedRoute>
                } />
                
                {/* Admin Dashboard - secure route */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
            <Toaster position="top-center" richColors closeButton />
          </OutfitProvider>
        </LocationProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}

export default App;
