import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorState {
    title: string;
    message: string;
    details?: string;
}

interface GlobalErrorContextType {
    error: ErrorState | null;
    setError: (error: ErrorState) => void;
    clearError: () => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const GlobalErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [error, setError] = useState<ErrorState | null>(null);
    const { t } = useTranslation();

    const clearError = () => setError(null);

    // Listen for custom network error events
    useEffect(() => {
        const handleNetworkError = (event: CustomEvent<any>) => {
            console.log('Network Error Captured:', event.detail);

            const { message, originalError } = event.detail || {};

            // Determine error type
            let title = t('common.network_error.connection_issue');
            let errorMsg = t('common.network_error.connection_issue_msg');
            let details = originalError?.message || message;

            if (message && message.includes('Failed to fetch')) {
                title = t('common.network_error.server_down');
                errorMsg = t('common.network_error.server_down_msg');
            } else if (message && message.includes('Network request failed')) {
                title = t('common.network_error.network_failed');
                errorMsg = t('common.network_error.network_failed_msg');
            }

            setError({
                title,
                message: errorMsg,
                details: import.meta.env.DEV ? details : undefined // Show details only in dev
            });
        };

        window.addEventListener('feature:network-error' as any, handleNetworkError);

        return () => {
            window.removeEventListener('feature:network-error' as any, handleNetworkError);
        };
    }, [t]);

    return (
        <GlobalErrorContext.Provider value={{ error, setError, clearError }}>
            {children}
        </GlobalErrorContext.Provider>
    );
};

export const useGlobalError = () => {
    const context = useContext(GlobalErrorContext);
    if (context === undefined) {
        throw new Error('useGlobalError must be used within a GlobalErrorProvider');
    }
    return context;
};
