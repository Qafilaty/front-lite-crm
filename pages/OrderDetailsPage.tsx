import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ORDER } from '../graphql/queries/orderQueries';
import { UPDATE_ORDER, DELETE_ORDER } from '../graphql/mutations/orderMutations';
import OrderDetailsView from '../components/OrderDetailsView';
import { Order, OrderLog } from '../types';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderDetailsPageProps {
    trackingMode?: boolean;
}

const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ trackingMode = false }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);

    const { data, loading, error, refetch } = useQuery(GET_ORDER, {
        variables: { id },
        skip: !id,
        fetchPolicy: 'network-only'
    });

    const [deleteOrder] = useMutation(DELETE_ORDER);

    useEffect(() => {
        if (data?.order) {
            // Map timeLine to history format
            const mappedOrder: Order = {
                ...data.order,
                // Map timeLine to history if available
                history: [],
                confirmationTimeLine: data.order.confirmationTimeLine?.map((t: any) => ({
                    status: t.oreginalStatus || t.status,
                    date: new Date(t.createdAt).toLocaleString('en-GB'),
                    note: t.note,
                    user: t.user?.name || 'System'
                })) || [],
                deliveryTimeLine: data.order.deliveryTimeLine?.map((t: any) => ({
                    status: t.oreginalStatus || t.status,
                    date: new Date(t.createdAt).toLocaleString('en-GB'),
                    note: t.note,
                    user: t.user?.name || 'System'
                })) || []
            };
            setOrder(mappedOrder);
        }
    }, [data]);

    const handleUpdate = (updatedOrder: Order) => {
        setOrder(updatedOrder);
        refetch(); // Refresh data to ensure server sync
    };

    const handleDelete = async (orderId: string): Promise<boolean> => {
        try {
            await deleteOrder({ variables: { id: orderId } });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-sm font-bold text-slate-400">جاري تحميل تفاصيل الطلب...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">لم يتم العثور على الطلب</h2>
                    <p className="text-slate-400 font-medium">ربما تم حذف الطلب أو أن الرابط غير صحيح</p>
                    <button
                        onClick={() => navigate('/orders')}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 mx-auto"
                    >
                        <ArrowRight className="w-4 h-4" /> العودة للطلبات
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <OrderDetailsView
                order={order}
                onBack={() => navigate(-1)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                trackingMode={trackingMode}
            />
        </div>
    );
};

export default OrderDetailsPage;
