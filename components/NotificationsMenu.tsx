import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useSubscription, gql } from '@apollo/client';
import { Bell, Loader2, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { GET_ALL_NOTIFICATIONS } from '../graphql/queries';
import toast from 'react-hot-toast';

interface Notification {
    id: string;
    title: string;
    msg: string;
    icon: string; // URL icon or specific string identifier
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: string;
}


const NEW_NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription NewNotifications {
    newNotifications {
      id
      title
      msg
      icon
      type
      createdAt
    }
  }
`;

const NotificationsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { data, loading, error, refetch } = useQuery(GET_ALL_NOTIFICATIONS, {
        variables: {
            pagination: { page: 1, limit: 10 }
        },
        fetchPolicy: 'cache-and-network'
    });

    // Real-time notifications
    useSubscription(NEW_NOTIFICATIONS_SUBSCRIPTION, {
        onData: ({ data: { data } }) => {
            if (data?.newNotifications) {
                const notif = data.newNotifications;
                // playNotificationSound(); // Removed as per user request
                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <Bell className="h-10 w-10 text-indigo-500 bg-indigo-50 rounded-full p-2" />
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-black text-slate-800">{notif.title}</p>
                                    <p className="mt-1 text-xs text-slate-500">{notif.msg}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 5000 });
                refetch();
            }
        }
    });

    const notifications: Notification[] = data?.allNotifications || [];

    // Read Status Logic
    const [lastOpened, setLastOpened] = useState<string | null>(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('notifications_last_opened') : null;
    });

    const handleOpenMenu = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            const now = new Date().toISOString();
            setLastOpened(now);
            localStorage.setItem('notifications_last_opened', now);
        }
    };

    // Calculate unread: Created AFTER lastOpened AND Created WITHIN last 24 hours
    const hasUnread = notifications.some(n => {
        const isNew = !lastOpened || new Date(n.createdAt) > new Date(lastOpened);
        const isRecent = (new Date().getTime() - new Date(n.createdAt).getTime()) < (24 * 60 * 60 * 1000); // 24 hours
        return isNew && isRecent;
    });

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-indigo-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        return date.toLocaleDateString('ar');
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleOpenMenu}
                className={`relative p-2 rounded-lg transition-all ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
            >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">الإشعارات</h3>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{notifications.length} جديد</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-100" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-slate-300" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">لا توجد إشعارات جديدة</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 text-right group">
                                        <div className="shrink-0 mt-1">
                                            {notif.icon && notif.icon.startsWith('http') ? (
                                                <img src={notif.icon} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    {getIcon(notif.type)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-[11px] font-black text-slate-700 group-hover:text-indigo-700 transition-colors leading-tight">
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[9px] font-bold text-slate-300 shrink-0 mr-2">
                                                    {formatTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                                                {notif.msg}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 transition-colors w-full py-1">
                                عرض كل الإشعارات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsMenu;
