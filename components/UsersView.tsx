
import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Shield, Lock, Unlock, Mail, Clock, Trash2, Edit2, Check, X, UserCog, Search, ChevronRight, ChevronLeft } from 'lucide-react';

interface UsersViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UsersView: React.FC<UsersViewProps> = ({ users, setUsers }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: 'admin' | 'confirmed_orders' }>({ 
    name: '', 
    email: '', 
    role: 'confirmed_orders' 
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      joinedDate: new Date().toLocaleDateString('ar-SA'),
      ordersLocked: newUser.role === 'confirmed_orders' ? false : undefined
    };
    setUsers([user, ...users]);
    setShowModal(false);
    setNewUser({ name: '', email: '', role: 'confirmed_orders' });
  };

  const deleteUser = (userId: string) => {
    if (window.confirm('هل أنت متأكد؟')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const toggleOrderLock = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, ordersLocked: !u.ordersLocked } : u
    ));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">إدارة المستخدمين</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">التحكم في أعضاء الفريق والصلاحيات</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md text-[11px] font-black uppercase whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            إضافة عضو
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">العضو</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">الصلاحية</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الطلبات</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shadow-sm ${
                        user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[12px] font-black text-slate-800">{user.name}</p>
                        <p className="text-[10px] font-medium text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {user.role === 'admin' ? 'مدير' : 'مؤكد'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {user.role === 'confirmed_orders' ? (
                      <button 
                        onClick={() => toggleOrderLock(user.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border transition-all ${
                          user.ordersLocked ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        {user.ordersLocked ? 'مغلقة' : 'مفتوحة'}
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-300 font-bold uppercase">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[10px] text-slate-500 font-bold">
                    {user.joinedDate}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteUser(user.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center">
           <div className="flex items-center gap-2">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
             <div className="flex items-center gap-1 mx-3">
               {[...Array(totalPages)].map((_, i) => (
                 <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>{i + 1}</button>
               ))}
             </div>
             <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
           </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">إضافة مستخدم</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم</label>
                <input required value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" placeholder="أحمد..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">البريد</label>
                <input required type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" placeholder="email@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">النوع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setNewUser({...newUser, role: 'confirmed_orders'})} className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${newUser.role === 'confirmed_orders' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>مؤكد</button>
                  <button type="button" onClick={() => setNewUser({...newUser, role: 'admin'})} className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${newUser.role === 'admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>أدمن</button>
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase shadow-md">إنشاء الحساب</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;
