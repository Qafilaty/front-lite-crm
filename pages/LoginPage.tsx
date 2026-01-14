import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginView from '../components/LoginView';
import RegisterView from '../components/RegisterView';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [isRegister, setIsRegister] = React.useState(false);

  // إذا كان المستخدم مسجل دخول بالفعل، أعد توجيهه
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  if (isRegister) {
    return (
      <RegisterView
        onLoginRedirect={() => setIsRegister(false)}
        onRegisterSuccess={() => {
          setIsRegister(false);
          // بعد التسجيل الناجح، يمكن توجيه المستخدم لتسجيل الدخول
        }}
      />
    );
  }

  return (
    <LoginView
      onRegisterRedirect={() => setIsRegister(true)}
      onLoginSuccess={() => {
        // useEffect سيعيد التوجيه تلقائياً عند تغيير isAuthenticated
      }}
    />
  );
};

export default LoginPage;
