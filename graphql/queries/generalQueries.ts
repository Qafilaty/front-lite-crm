import { gql } from '@apollo/client';

export const GET_BASIC_STATISTICS = gql`
  query GetBasicStatistics {
    basicStatistics {
      totalUsers
      totalOrders
      lowStockItems
      totalRevenue
      confirmationRate
      deliveryRate
      confirmedCount
      deliveredCount
      salesGrowth {
        name
        total
      }
      statusDistribution {
        name
        orders
      }
      revenueGrowth
      ordersGrowth
      deliveryRateGrowth
      confirmationRateGrowth
    }
  }
`;
