import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSubscription, useQuery, gql } from '@apollo/client';
import { useAuth } from './AuthContext';
import { GET_POSTPONED_COUNT } from '../graphql/queries/orderQueries';

const SYNC_ORDERS_SUBSCRIPTION = gql`
  subscription OnSyncOrders($idCompany: ID!) {
    syncOrdersWithExternalStores(idCompany: $idCompany) {
      id
      fullName
    }
  }
`;

interface OrderNotificationContextType {
    hasNewOrders: boolean;
    markAsRead: () => void;
    duePostponedCount: number;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [hasNewOrders, setHasNewOrders] = useState(false);
    const [duePostponedCount, setDuePostponedCount] = useState(0);

    // Use a ref for the audio to avoid recreating it
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Postponed Orders Query removed as it is now handled per-page
    // useQuery(GET_POSTPONED_COUNT, ...);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        // Browser Autoplay Policy: AudioContext must be resumed (or audio played) after user interaction
        const unlockAudio = () => {
            if (audioRef.current) {
                // Try to play and immediately pause to "unlock" the capability
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                }).catch(e => {
                    // Ignore error if it fails (e.g. if already playing or distinct policy)
                    console.log("Audio unlock attempt:", e);
                });
            }
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0; // Reset to start
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Automatic playback started!
                    })
                    .catch((error) => {
                        console.error("Notification sound failed to play:", error);
                    });
            }
        }
    };

    const handleNewOrder = () => {
        setHasNewOrders(true);
        playNotificationSound();
    };

    useSubscription(SYNC_ORDERS_SUBSCRIPTION, {
        skip: !user?.company?.id,
        variables: { idCompany: user?.company?.id },
        onData: ({ data }) => {
            // console.log("Sync Orders Data:", data);

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
        <OrderNotificationContext.Provider value={{ hasNewOrders, markAsRead, duePostponedCount: 0 }}>
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
