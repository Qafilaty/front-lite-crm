import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/apiService';
import UsersView from '../../components/UsersView';
import type { User } from '../../types';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
          role: u.role === 'admin' || u.role === 'owner' || u.role === 'superAdmin' ? 'admin' : 'confirmed',
          joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA'),
          ordersLocked: u.role === 'confirmed' ? false : undefined,
          activation: u.activation,
          numberDeliveredOrder: u.numberDeliveredOrder || 0,
          orderPrice: u.orderPrice || 0
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (userData: any) => {
    try {
      const result = await userService.createUser({
        ...userData,
      });

      if (result.success) {
        await loadUsers(); // Reload users
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  };

  const handleUpdateUser = async (id: string, userData: any) => {
    try {
      const result = await userService.updateUser(id, userData);

      if (result.success) {
        await loadUsers(); // Reload users
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const result = await userService.deleteUser(id);

      if (result.success) {
        await loadUsers(); // Reload users
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const handleToggleActivation = async (id: string, activation: boolean) => {
    try {
      const result = await userService.activeUser(id, activation);

      if (result.success) {
        await loadUsers(); // Reload users
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling user activation:', error);
      return false;
    }
  };

  return (
    <UsersView
      users={users}
      setUsers={setUsers}
      onAdd={handleAddUser}
      onUpdate={handleUpdateUser}
      onDelete={handleDeleteUser}
      onToggleActivation={handleToggleActivation}
      isLoading={loading}
    />
  );
};

export default UsersPage;
