import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSubscription, useQuery, gql } from '@apollo/client';
import { useAuth } from './AuthContext';
import { GET_POSTPONED_COUNT } from '../graphql/queries/orderQueries';
import cashierSound from '../assets/cashier-quotka.mp3';

const SYNC_ORDERS_SUBSCRIPTION = gql`
  subscription OnSyncOrders($idCompany: ID!) {
    syncOrdersWithExternalStores(idCompany: $idCompany) {
      id
      fullName
      isAbandoned
    }
  }
`;

interface OrderNotificationContextType {
    hasConfirmationOrders: boolean;
    hasAbandonedOrders: boolean;
    markConfirmationAsRead: () => void;
    markAbandonedAsRead: () => void;
    duePostponedCount: number;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [hasConfirmationOrders, setHasConfirmationOrders] = useState(false);
    const [hasAbandonedOrders, setHasAbandonedOrders] = useState(false);

    // Use a ref for the audio to avoid recreating it
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Postponed Orders Query removed as it is now handled per-page
    // useQuery(GET_POSTPONED_COUNT, ...);

    useEffect(() => {
        // Initialize audio (Cashier Sound)
        audioRef.current = new Audio(cashierSound);

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

    const handleNewOrder = (isAbandoned: boolean) => {
        if (isAbandoned) {
            setHasAbandonedOrders(true);
        } else {
            setHasConfirmationOrders(true);
        }
        playNotificationSound();
    };

    useSubscription(SYNC_ORDERS_SUBSCRIPTION, {
        skip: !user?.company?.id,
        variables: { idCompany: user?.company?.id },
        onData: ({ data }) => {
            // console.log("Sync Orders Data:", data);

            if (data.data?.syncOrdersWithExternalStores) {
                const orders: any[] = data.data.syncOrdersWithExternalStores;

                if (Array.isArray(orders)) {
                    let hasAbandoned = false;
                    let hasNormal = false;

                    for (const order of orders) {
                        if (order.isAbandoned) {
                            hasAbandoned = true;
                        } else {
                            hasNormal = true;
                        }
                    }

                    if (hasAbandoned) setHasAbandonedOrders(true);
                    if (hasNormal) setHasConfirmationOrders(true);

                    if (hasAbandoned || hasNormal) playNotificationSound();
                }
            }
        },
        onError: (err) => {
            console.error("Subscription Error (syncOrders):", err);
        }
    });

    const markConfirmationAsRead = () => {
        setHasConfirmationOrders(false);
    };

    const markAbandonedAsRead = () => {
        setHasAbandonedOrders(false);
    };

    return (
        <OrderNotificationContext.Provider value={{
            hasConfirmationOrders,
            hasAbandonedOrders,
            markConfirmationAsRead,
            markAbandonedAsRead,
            duePostponedCount: 0
        }}>
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
