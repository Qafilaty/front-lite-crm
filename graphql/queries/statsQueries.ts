import { gql } from '@apollo/client';

export const GET_ORDER_STATS = gql`
  query OrderStats($period: String, $idEmployee: ID, $idProduct: ID) {
    orderStats(period: $period, idEmployee: $idEmployee, idProduct: $idProduct) {
      kpis {
        total
        confirmedCount
        confirmationRate
        shippedCount
        deliveredCount
        deliveryRate
      }
      topPerformers {
        bestStates {
          name
          total
          rate
        }
        bestConfirmers {
          name
          count
        }
        bestProducts {
          name
          qty
        }
      }
      confirmationDistribution {
        name
        value
        color
      }
      logisticsDistribution {
        name
        value
        color
      }
    }
  }
`;
