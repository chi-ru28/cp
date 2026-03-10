import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import ShopkeeperPage from './pages/ShopkeeperPage';

// Role-based protected route
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'shopkeeper' ? '/shopkeeper' : '/chat'} replace />;
  }
  return children;
};

// Auto-redirect after login based on role
const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'shopkeeper' ? '/shopkeeper' : '/chat'} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen font-sans bg-slate-50">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={
              <ProtectedRoute requiredRole="farmer">
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/shopkeeper" element={
              <ProtectedRoute requiredRole="shopkeeper">
                <ShopkeeperPage />
              </ProtectedRoute>
            } />
            <Route path="/home" element={<RoleRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
