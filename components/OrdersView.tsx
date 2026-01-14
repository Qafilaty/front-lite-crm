
import React from 'react';
import { Order } from '../types';
import { Package, CheckCircle, Clock, XCircle, Search, Filter, Download } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrdersView: React.FC<OrdersViewProps> = ({ orders }) => {
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'تم التوصيل';
      case 'shipped': return 'تم الشحن';
      case 'pending': return 'جاري المعالجة';
      case 'cancelled': return 'تم الإلغاء';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">قائمة الطلبات</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">متابعة دقيقة لطلبات العملاء وحالات الشحن</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-[10px] font-black uppercase">
            <Filter className="w-3.5 h-3.5" /> تصفية
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-[10px] font-black uppercase">
            <Download className="w-3.5 h-3.5" /> تصدير
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعرف</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">العميل</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">المنتج</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">القيمة</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4 font-black text-indigo-600 text-[11px] tracking-widest uppercase">#{order.id}</td>
                  <td className="px-6 py-4 text-[12px] text-slate-800 font-black">{order.customer}</td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{order.product}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-800">{order.amount} ر.س</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-tighter ${getStatusStyle(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersView;
