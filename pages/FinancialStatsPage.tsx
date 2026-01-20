import React, { useMemo } from 'react';
import OrderStatsView from '../components/OrderStatsView';
import { useQuery } from '@apollo/client';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import { GET_ALL_USERS } from '../graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FinancialStatsPage: React.FC = () => {
    const { user } = useAuth();
    const companyId = user?.company?.id;

    // 1. Fetch Users
    const { data: usersData, loading: usersLoading } = useQuery(GET_ALL_USERS, {
        variables: { idCompany: companyId },
        skip: !companyId
    });

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <main className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
                <OrderStatsView
                    currentUser={user as any}
                    allUsers={usersData?.allUser || []}
                />
            </main>
        </div>
    );
};

export default FinancialStatsPage;
