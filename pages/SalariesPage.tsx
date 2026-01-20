import React, { useState } from 'react';
import SalariesView from '../components/SalariesView';

const SalariesPage: React.FC = () => {


    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar bg-slate-50/50">
                <SalariesView />
            </main>
        </div>
    );
};

export default SalariesPage;
