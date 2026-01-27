import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { X, UserCheck, Loader2 } from 'lucide-react';
import { GET_ALL_USERS } from '../graphql/queries/userQueries';
import { gql } from '@apollo/client';
import toast from 'react-hot-toast';

const CHANGE_CONFIRMED_ORDERS = gql`
  mutation ChangeConfirmedOrders($id: [ID!]!, $idConfirmed: ID!) {
    changeConfirmedOrders(id: $id, idConfirmed: $idConfirmed) {
      status
    }
  }
`;

interface AssignConfirmerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: string[];
    onSuccess: () => void;
}

export const AssignConfirmerModal: React.FC<AssignConfirmerModalProps> = ({ isOpen, onClose, selectedIds, onSuccess }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const { data: usersData, loading: usersLoading } = useQuery(GET_ALL_USERS);
    const [assignOrders, { loading: assigning }] = useMutation(CHANGE_CONFIRMED_ORDERS);

    // Filter for confirmed users only
    const confirmedUsers = usersData?.allUser?.filter((u: any) => u.role === 'confirmed') || [];

    const handleAssign = async () => {
        if (!selectedUserId) return;

        try {
            const { data } = await assignOrders({
                variables: {
                    id: selectedIds,
                    idConfirmed: selectedUserId
                }
            });

            if (data?.changeConfirmedOrders?.status) {
                toast.success('تم إسناد الطلبات بنجاح');
                onSuccess();
                onClose();
                setSelectedUserId('');
            } else {
                toast.error('فشل إسناد الطلبات');
            }
        } catch (error) {
            console.error('Error assigning orders:', error);
            toast.error('حدث خطأ أثناء الإسناد');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-indigo-600" />
                        إسناد الطلبات ({selectedIds.length})
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">اختر الموظف (Confirmer)</label>
                        {usersLoading ? (
                            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {confirmedUsers.map((user: any) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`nav-item flex items-center justify-between p-3 rounded-xl border transition-all ${selectedUserId === user.id
                                            ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                            : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${selectedUserId === user.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`font-bold text-sm ${selectedUserId === user.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {user.name}
                                            </span>
                                        </div>
                                        {selectedUserId === user.id && <UserCheck className="w-4 h-4 text-indigo-600" />}
                                    </button>
                                ))}
                                {confirmedUsers.length === 0 && (
                                    <p className="text-center text-slate-400 py-4 text-sm font-medium">لا يوجد موظفين بصلاحية Confirmed</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-50 bg-slate-50/50 rounded-b-2xl flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedUserId || assigning}
                        className="flex-[2] py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {assigning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد الإسناد'}
                    </button>
                </div>
            </div>
        </div>
    );
};
