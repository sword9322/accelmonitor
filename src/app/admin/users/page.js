'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import RequireAdmin from '../../components/RequireAdmin';
import adminService from '../../services/adminService';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { user, getIdToken } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getIdToken();
      const data = await adminService.getAllUsers(token);
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      const token = await getIdToken();
      await adminService.deleteUser(userId, token);
      setSuccessMessage(`User deleted successfully`);
      
      // Refresh the user list
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again later.');
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      setError(null);
      const token = await getIdToken();
      await adminService.setUserRole(userId, newRole, token);
      setSuccessMessage(`User role updated to ${newRole}`);
      
      // Refresh the user list
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error changing role:', err);
      setError('Failed to update user role. Please try again later.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
              >
                Refresh
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md border border-green-200">
                {successMessage}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-gray-600">Total Users: <span className="font-semibold">{users.length}</span></p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.userId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt * 1000).toLocaleString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {user.role === 'user' ? (
                                <button
                                  onClick={() => changeRole(user.userId, 'admin')}
                                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                                >
                                  Promote to Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => changeRole(user.userId, 'user')}
                                  className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-md hover:bg-yellow-200 transition-colors"
                                >
                                  Demote to User
                                </button>
                              )}
                              <button
                                onClick={() => deleteUser(user.userId)}
                                className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {users.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    No users found.
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </RequireAdmin>
  );
} 