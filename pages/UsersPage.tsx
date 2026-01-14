import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/apiService';
import UsersView from '../components/UsersView';
import type { User } from '../types';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const result = await userService.getAllUsers();
        if (result.success && result.users) {
          // تحويل البيانات من Backend إلى نوع User
          const transformedUsers = result.users.map((u: any) => ({
            id: u.id,
            name: u.name || '',
            email: u.email || '',
            phone: u.phone,
            role: u.role === 'admin' || u.role === 'owner' || u.role === 'superAdmin' ? 'admin' : 'confirmed_orders',
            joinedDate: u.createdAt || new Date().toISOString(),
            ordersLocked: u.role === 'confirmed_orders' ? false : undefined,
          }));
          setUsers(transformedUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleSetUsers = async (newUsers: User[]) => {
    setUsers(newUsers);
    // يمكن إضافة منطق لحفظ التغييرات في Backend هنا
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 font-bold">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return <UsersView users={users} setUsers={handleSetUsers} />;
};

export default UsersPage;
