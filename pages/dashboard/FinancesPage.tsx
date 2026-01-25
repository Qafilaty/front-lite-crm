import React, { useState } from 'react';
import FinancesView from '../../components/FinancesView';
import FinancialStatsView from '../../components/FinancialStatsView';
import { Transaction } from '../../types';

const FinancesPage: React.FC = () => {
    // Dummy data state until API integration
    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: 'TRX-1001', type: 'income', category: 'مبيعات', amount: 50000, date: '2023-11-01', note: 'مبيعات يوم السبت', user: 'أحمد' },
        { id: 'TRX-1002', type: 'expense', category: 'شحن', amount: 3000, date: '2023-11-02', note: 'شحن بضاعة للمخزن', user: 'محمد' },
        { id: 'TRX-1003', type: 'income', category: 'مبيعات', amount: 75000, date: '2023-11-03', note: 'مبيعات يوم الإثنين', user: 'أحمد' },
        { id: 'TRX-1004', type: 'expense', category: 'رواتب', amount: 150000, date: '2023-11-04', note: 'رواتب موظفي المخزن', user: 'الإدارة' },
    ]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <main className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
                <FinancesView />
            </main>
        </div>
    );
};

export default FinancesPage;
