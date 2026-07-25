import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Loader from './components/Loader';
import AIChatbot from './components/AIChatbot';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import InterviewSelectionPage from './pages/InterviewSelectionPage';
import RoleSearchPage from './pages/RoleSearchPage';
import InterviewConfigPage from './pages/InterviewConfigPage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import InterviewReportPage from './pages/InterviewReportPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';
import InterviewCoachingPage from './pages/InterviewCoachingPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AptitudeRound from './pages/AptitudeRound';
import CommunicationRound from './pages/CommunicationRound';
import CodingRound from './pages/CodingRound';
import AdvancedCodingRound from './pages/AdvancedCodingRound';
import RoundTransitionScreen from './pages/RoundTransitionScreen';
import FinalReport from './pages/FinalReport';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import SkillGapPage from './pages/SkillGapPage';
import SchedulerPage from './pages/SchedulerPage';
import PlacementReadinessPage from './pages/PlacementReadinessPage';
import StudyNotesPage from './pages/StudyNotesPage';
import QuestionsCatalogPage from './pages/QuestionsCatalogPage';
import STARBuilderPage from './pages/STARBuilderPage';
import FlashcardsPage from './pages/FlashcardsPage';
import CodingRoundScreen from './pages/CodingRoundScreen';
import ReviewSession from './pages/ReviewSession';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-darkBg flex items-center justify-center"><Loader text="Authenticating..." /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-darkBg flex items-center justify-center"><Loader text="Authenticating..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-darkBg flex items-center justify-center"><Loader text="Authenticating..." /></div>;
  if (isAuthenticated) {
    return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
  }
  return children;
};

const SelectGate = () => {
  const [searchParams] = useSearchParams();
  const flow = searchParams.get('flow') || 'classic';
  if (flow === 'multi-round') {
    return <InterviewSelectionPage />;
  }
  return <RoleSearchPage />;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Candidate Protected Pages */}
          <Route
            path="/resume-builder"
            element={
              <ProtectedRoute>
                <ResumeBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analyzer"
            element={
              <ProtectedRoute>
                <ResumeAnalyzerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select"
            element={
              <ProtectedRoute>
                <SelectGate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              <ProtectedRoute>
                <InterviewConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:id"
            element={
              <ProtectedRoute>
                <InterviewSessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/round/aptitude"
            element={
              <ProtectedRoute>
                <AptitudeRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/round/communication"
            element={
              <ProtectedRoute>
                <CommunicationRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/round/coding"
            element={
              <ProtectedRoute>
                <CodingRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coding/session/:sessionId"
            element={
              <ProtectedRoute>
                <CodingRoundScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/round/advanced"
            element={
              <ProtectedRoute>
                <AdvancedCodingRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/transition"
            element={
              <ProtectedRoute>
                <RoundTransitionScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId/report"
            element={
              <ProtectedRoute>
                <FinalReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:id"
            element={
              <ProtectedRoute>
                <InterviewReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coaching/:id"
            element={
              <ProtectedRoute>
                <InterviewCoachingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <InterviewHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ── NEW FEATURE ROUTES ── */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-gap/:interviewId"
            element={
              <ProtectedRoute>
                <SkillGapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduler"
            element={
              <ProtectedRoute>
                <SchedulerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/readiness/:interviewId"
            element={
              <ProtectedRoute>
                <PlacementReadinessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <StudyNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute>
                <QuestionsCatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/star-builder"
            element={
              <ProtectedRoute>
                <STARBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <FlashcardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards/review"
            element={
              <ProtectedRoute>
                <ReviewSession />
              </ProtectedRoute>
            }
          />
          {/* Admin Protected Pages */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global AI Chatbot - visible on all pages when authenticated */}
        <AIChatbot />
      </AuthProvider>
    </Router>
  );
}

