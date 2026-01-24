import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSubscription, gql } from '@apollo/client';
import { useAuth } from './AuthContext';

// Defining the subscription query
const ORDER_CREATED_SUBSCRIPTION = gql`
  subscription OnOrderCreated {
    createdOrder {
      _id
      fullName
      totalPrice
      idCompany
    }
  }
`;

const SYNC_ORDERS_SUBSCRIPTION = gql`
  subscription OnSyncOrders {
    syncOrdersWithExternalStores {
      _id
      fullName
    }
  }
`;

interface OrderNotificationContextType {
    hasNewOrders: boolean;
    markAsRead: () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [hasNewOrders, setHasNewOrders] = useState(false);

    // Use a ref for the audio to avoid recreating it
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('/assets/notification.mp3');
        // Fallback if local asset is missing, or use a base64 string or CDN
        // Using a simple beep sound or ensuring the file exists is key.
        // For now, assuming /assets/notification.mp3 or similar exists. 
        // If not, we can use a standard notification sound URL.
        audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Example valid URL for testing
        // Or prompt user to add file? I'll use a reliable CDN link for "bell" sound to ensure it works.
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed):", e));
        }
    };

    const handleNewOrder = () => {
        setHasNewOrders(true);
        playNotificationSound();
    };

    useSubscription(ORDER_CREATED_SUBSCRIPTION, {
        skip: !user,
        onData: ({ data }) => {
            if (data.data?.createdOrder) {
                handleNewOrder();
            }
        },
        onError: (err) => {
            console.error("Subscription Error (createdOrder):", err);
        }
    });

    useSubscription(SYNC_ORDERS_SUBSCRIPTION, {
        skip: !user,
        onData: ({ data }) => {
            if (data.data?.syncOrdersWithExternalStores) {
                handleNewOrder();
            }
        },
        onError: (err) => {
            console.error("Subscription Error (syncOrders):", err);
        }
    });

    const markAsRead = () => {
        setHasNewOrders(false);
    };

    return (
        <OrderNotificationContext.Provider value={{ hasNewOrders, markAsRead }}>
            {children}
        </OrderNotificationContext.Provider>
    );
};

export const useOrderNotification = () => {
    const context = useContext(OrderNotificationContext);
    if (context === undefined) {
        throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
    }
    return context;
};
