import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { generalService, userService } from '../../services/apiService';
import DashboardView from '../../components/DashboardView';
import { SubscriptionTier, type Order, type Product, type User } from '../../types';
import FinancialStatsPage from './FinancialStatsPage';

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
  const [dateRange, setDateRange] = useState<any>({ startDate: null, endDate: null, key: 'all' });
  const [idConfirmer, setIdConfirmer] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  useEffect(() => {
    const loadTeam = async () => {
      if (!user) return;
      
      const result = await userService.getAllUsers();
      if (result.success) {
        if (user.role === 'supervisor') {
          // Use the team field if populated, or filter from all users using teamIds
          const myTeam = user.team || result.users.filter((u: User) => user.teamIds?.includes(u.id));
          setTeamMembers(myTeam);
        } else if (user.role === 'admin') {
          // For admins, show all confirmers
          const confirmers = result.users.filter((u: User) => u.role === 'confirmed');
          setTeamMembers(confirmers);
        }
      }
    };
    loadTeam();
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.company?.id || (user?.role !== 'admin' && user?.role !== 'owner' && user?.role !== 'supervisor')) return;

      try {
        setLoading(true);

        // Fetch aggregated statistics from backend
        const statsResult = await generalService.getBasicStatistics(dateRange.startDate, dateRange.endDate, idConfirmer);
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
  }, [user, dateRange, idConfirmer]);

  // Map backend stats to the format DashboardView expects, or pass new prop
  const stats = {
    totalUsers: backendStats?.totalUsers || 0,
    totalOrders: backendStats?.totalOrders || 0,
    revenue: backendStats?.totalRevenue || 0,
    lowStockItems: backendStats?.lowStockItems || 0,
  };

  if (user?.role === 'confirmed' || user?.role === 'supervisor') {
    return <FinancialStatsPage />;
  }

  return (
    <DashboardView
      stats={stats}
      orders={orders}
      inventory={inventory}
      subscriptionTier={subscriptionTier}
      backendStats={backendStats}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      idConfirmer={idConfirmer}
      onIdConfirmerChange={setIdConfirmer}
      teamMembers={teamMembers}
      onUpgrade={() => {
        console.log('Upgrade clicked');
      }}
      isLoading={loading}
    />
  );
};

export default DashboardPage;
