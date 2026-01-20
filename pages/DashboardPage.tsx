import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generalService } from '../services/apiService';
import DashboardView from '../components/DashboardView';
import { SubscriptionTier, type Order, type Product } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  // We can keep these for compatibility if DashboardView still needs them, 
  // or pass an empty array/dummy data if we refactor DashboardView to use 'backendStats'
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.PAY_AS_YOU_GO);
  const [loading, setLoading] = useState(true);

  // New State for Backend Statistics
  const [backendStats, setBackendStats] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.company?.id) return;

      try {
        setLoading(true);

        // Fetch aggregated statistics from backend
        const statsResult = await generalService.getBasicStatistics();
        if (statsResult.success) {
          setBackendStats(statsResult.stats);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Map backend stats to the format DashboardView expects, or pass new prop
  const stats = {
    totalUsers: backendStats?.totalUsers || 0,
    totalOrders: backendStats?.totalOrders || 0,
    revenue: backendStats?.totalRevenue || 0,
    lowStockItems: backendStats?.lowStockItems || 0,
  };

  return (
    <DashboardView
      stats={stats}
      orders={orders} // Empty now, need to update DashboardView to not rely on this for charts
      inventory={inventory}
      subscriptionTier={subscriptionTier}
      backendStats={backendStats} // Pass full backend stats including charts
      onUpgrade={() => {
        console.log('Upgrade clicked');
      }}
      isLoading={loading}
    />
  );
};

export default DashboardPage;
