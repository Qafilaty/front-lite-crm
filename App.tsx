import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apolloClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import InventoryPage from './pages/InventoryPage';
import ShippingCarriersPage from './pages/ShippingCarriersPage';
import ShippingPricingPage from './pages/ShippingPricingPage';
import StoreLinkingPage from './pages/StoreLinkingPage';
import ApiDocsPage from './pages/ApiDocsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="tracking" element={<OrderTrackingPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="carriers" element={<ShippingCarriersPage />} />
        <Route path="pricing" element={<ShippingPricingPage />} />
        <Route path="stores" element={<StoreLinkingPage />} />
        <Route path="api-docs" element={<ApiDocsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  );
};

export default App;
