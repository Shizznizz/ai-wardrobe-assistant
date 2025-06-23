
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

function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <LocationProvider>
          <OutfitProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Apply PageLayout to Home page as well */}
                <Route path="/" element={<PageLayout><Home /></PageLayout>} />
                {/* Use PageLayout for authenticated pages to ensure Footer appears on all pages */}
                <Route path="/my-wardrobe" element={<PageLayout><MyWardrobe /></PageLayout>} />
                <Route path="/mix-and-match" element={<PageLayout><MixAndMatch /></PageLayout>} />
                <Route path="/style-planner" element={<PageLayout><StylePlanner /></PageLayout>} />
                <Route path="/fitting-room" element={<PageLayout><FittingRoom /></PageLayout>} />
                <Route path="/shop-and-try" element={<PageLayout><ShopAndTry /></PageLayout>} />
                <Route path="/profile" element={<PageLayout><Profile /></PageLayout>} />
                <Route path="/premium" element={<PageLayout><Premium /></PageLayout>} />
                {/* Add the Quizzes routes */}
                <Route path="/quizzes" element={<PageLayout><Quizzes /></PageLayout>} />
                <Route path="/quiz-results" element={<PageLayout><QuizResults /></PageLayout>} />
                <Route path="/find-your-style" element={<PageLayout><StyleQuizPage /></PageLayout>} />
                {/* Add PageLayout to Auth page as well to ensure footer appears there too */}
                <Route path="/auth" element={<PageLayout><Auth /></PageLayout>} />
                {/* Pitch page */}
                <Route path="/pitch" element={<PageLayout><Pitch /></PageLayout>} />
                {/* Admin Dashboard - secure route */}
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
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
