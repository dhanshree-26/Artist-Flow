import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { ThemeToggle } from './components/ThemeToggle'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

const LandingPage = lazy(async () => ({
  default: (await import('./pages/LandingPage')).LandingPage,
}))
const LoginPage = lazy(async () => ({
  default: (await import('./pages/LoginPage')).LoginPage,
}))
const SignupPage = lazy(async () => ({
  default: (await import('./pages/SignupPage')).SignupPage,
}))
const VerifyEmailPage = lazy(async () => ({
  default: (await import('./pages/VerifyEmailPage')).VerifyEmailPage,
}))
const AppLayout = lazy(async () => ({
  default: (await import('./pages/AppLayout')).AppLayout,
}))
const OpportunitiesPage = lazy(async () => ({
  default: (await import('./pages/OpportunitiesPage')).OpportunitiesPage,
}))
const NewOpportunityPage = lazy(async () => ({
  default: (await import('./pages/NewOpportunityPage')).NewOpportunityPage,
}))
const EditOpportunityPage = lazy(async () => ({
  default: (await import('./pages/EditOpportunityPage')).EditOpportunityPage,
}))
const ChatsPage = lazy(async () => ({
  default: (await import('./pages/ChatsPage')).ChatsPage,
}))
const FeedbackPage = lazy(async () => ({
  default: (await import('./pages/FeedbackPage')).FeedbackPage,
}))
const ProfilePage = lazy(async () => ({
  default: (await import('./pages/ProfilePage')).ProfilePage,
}))

const RouteLoader = () => (
  <div className="loader-shell" role="status" aria-live="polite">
    <div className="loader-orb" />
    <p>Loading Artist Flow...</p>
  </div>
)

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ThemeToggle />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <SignupPage />
                  </PublicOnlyRoute>
                }
              />

              <Route path="/verify-email" element={<VerifyEmailPage />} />

              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OpportunitiesPage />} />
                <Route path="new" element={<NewOpportunityPage />} />
                <Route path="edit/:id" element={<EditOpportunityPage />} />
                <Route path="chats" element={<ChatsPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
