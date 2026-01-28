import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

    const clearError = () => setError(null);

    // Listen for custom network error events
    useEffect(() => {
        const handleNetworkError = (event: CustomEvent<any>) => {
            console.log('Network Error Captured:', event.detail);

            const { message, originalError } = event.detail || {};

            // Determine error type
            let title = "مشكلة في الاتصال";
            let errorMsg = "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.";
            let details = originalError?.message || message;

            if (message && message.includes('Failed to fetch')) {
                title = "الخادم غير مستجيب";
                errorMsg = "يبدو أن الخادم متوقف أو هناك مشكلة في الشبكة.";
            } else if (message && message.includes('Network request failed')) {
                title = "فشل طلب الشبكة";
                errorMsg = "يرجى التحقق من اتصال الإنترنت.";
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
    }, []);

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
