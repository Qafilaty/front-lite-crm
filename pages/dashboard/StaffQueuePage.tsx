import React from 'react';
import StaffQueueManager from '../../components/StaffQueueManager';

const StaffQueuePage: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StaffQueueManager />
    </div>
  );
};

export default StaffQueuePage;
