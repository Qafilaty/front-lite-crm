import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginView from '../components/LoginView';


const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // إذا كان المستخدم مسجل دخول بالفعل، أعد توجيهه
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <LoginView
      onRegisterRedirect={() => navigate('/signup')}
      onLoginSuccess={() => {
        // useEffect سيعيد التوجيه تلقائياً عند تغيير isAuthenticated
      }}
    />
  );
};

export default LoginPage;
