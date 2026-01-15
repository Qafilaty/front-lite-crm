import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastNotifications: React.FC = () => {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 4000,
                className: 'font-bold text-xs',
                style: {
                    background: '#fff',
                    color: '#1e293b',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    padding: '12px 16px',
                    border: '1px solid #f1f5f9',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                    style: {
                        borderLeft: '4px solid #10b981',
                    }
                },
                error: {
                    iconTheme: {
                        primary: '#f43f5e',
                        secondary: '#fff',
                    },
                    style: {
                        borderLeft: '4px solid #f43f5e',
                    }
                },
                loading: {
                    style: {
                        borderLeft: '4px solid #6366f1',
                    }
                }
            }}
        />
    );
};

export default ToastNotifications;
