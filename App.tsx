import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apolloClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { View } from './types';
import { RequirePermission } from './components/RequirePermission';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/dashboard/UsersPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import OrderDetailsPage from './pages/dashboard/OrderDetailsPage';
import AbandonedOrdersPage from './pages/dashboard/AbandonedOrdersPage';
import OrderTrackingPage from './pages/dashboard/OrderTrackingPage';
import InventoryPage from './pages/dashboard/InventoryPage';
import ShippingCarriersPage from './pages/dashboard/ShippingCarriersPage';
import ShippingPricingPage from './pages/dashboard/ShippingPricingPage';
import StoreLinkingPage from './pages/dashboard/StoreLinkingPage';
import ApiDocsPage from './pages/dashboard/ApiDocsPage';
import SubscriptionsPage from './pages/dashboard/SubscriptionsPage';
import WooCommerceSuccess from './pages/WooCommerceSuccess';
import FinancesPage from './pages/dashboard/FinancesPage';
import FinancialStatsPage from './pages/dashboard/FinancialStatsPage';
import SalariesPage from './pages/dashboard/SalariesPage';
import IntegrationSettingsPage from './pages/dashboard/IntegrationSettingsPage';
import GoogleSheetsSuccessPage from './pages/GoogleSheetsSuccessPage';
import GoogleSheetsFailedPage from './pages/GoogleSheetsFailedPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/woocommerce/success" element={<WooCommerceSuccess />} />
      <Route path="/google-sheets/success" element={<GoogleSheetsSuccessPage />} />
      <Route path="/google-sheets/failed" element={<GoogleSheetsFailedPage />} />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes - All under /dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RequirePermission allowedView={View.DASHBOARD}><DashboardPage /></RequirePermission>} />
        <Route path="users" element={<RequirePermission allowedView={View.USERS}><UsersPage /></RequirePermission>} />
        <Route path="orders" element={<RequirePermission allowedView={View.ORDER_CONFIRMATION}><OrdersPage /></RequirePermission>} />
        <Route path="abandoned" element={<RequirePermission allowedView={View.ORDER_ABANDONED}><AbandonedOrdersPage /></RequirePermission>} />
        <Route path="orders/:id" element={<RequirePermission allowedView={View.ORDER_CONFIRMATION}><OrderDetailsPage /></RequirePermission>} />
        <Route path="tracking" element={<RequirePermission allowedView={View.ORDER_TRACKING}><OrderTrackingPage /></RequirePermission>} />
        <Route path="tracking/:id" element={<RequirePermission allowedView={View.ORDER_TRACKING}><OrderDetailsPage trackingMode={true} /></RequirePermission>} />
        <Route path="inventory" element={<RequirePermission allowedView={View.INVENTORY}><InventoryPage /></RequirePermission>} />
        <Route path="carriers" element={<RequirePermission allowedView={View.SHIPPING_CARRIERS}><ShippingCarriersPage /></RequirePermission>} />
        <Route path="pricing" element={<RequirePermission allowedView={View.SHIPPING_PRICING}><ShippingPricingPage /></RequirePermission>} />
        <Route path="stores" element={<RequirePermission allowedView={View.STORE_LINKING}><StoreLinkingPage /></RequirePermission>} />
        <Route path="api-docs" element={<RequirePermission allowedView={View.API_DOCS}><ApiDocsPage /></RequirePermission>} />
        <Route path="subscriptions" element={<RequirePermission allowedView={View.SUBSCRIPTIONS}><SubscriptionsPage /></RequirePermission>} />
        <Route path="finances" element={<RequirePermission allowedView={View.FINANCES}><FinancesPage /></RequirePermission>} />
        <Route path="financial-stats" element={<RequirePermission allowedView={View.FINANCIAL_STATS}><FinancialStatsPage /></RequirePermission>} />
        <Route path="salaries" element={<RequirePermission allowedView={View.SALARIES}><SalariesPage /></RequirePermission>} />
        <Route path="integration-settings" element={<RequirePermission allowedView={View.INTEGRATION_SETTINGS}><IntegrationSettingsPage /></RequirePermission>} />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

import { GlobalErrorProvider, useGlobalError } from './contexts/GlobalErrorContext';
import NetworkErrorScreen from './components/common/NetworkErrorScreen';

const App: React.FC = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <GlobalErrorProvider>
        <AuthProvider>
          <OrderNotificationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </OrderNotificationProvider>
        </AuthProvider>
      </GlobalErrorProvider>
    </ApolloProvider>
  );
};

export default App;
