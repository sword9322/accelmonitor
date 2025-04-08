/**
 * Service for managing administrative functions
 */
// Remove API_BASE_URL if not needed directly by this service
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; 

const adminService = {
  /**
   * Get all users (admin only)
   * @param {string} token - Firebase auth token
   * @returns {Promise<Array>} - Array of users
   */
  getAllUsers: async (token) => {
    try {
      // Use the Next.js API proxy route
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  /**
   * Delete a user (admin only)
   * @param {string} userId - User ID to delete
   * @param {string} token - Firebase auth token
   * @returns {Promise<Object>} - Response data
   */
  deleteUser: async (userId, token) => {
    try {
      // Use the Next.js API proxy route
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting user: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  /**
   * Set a user's role (admin only)
   * @param {string} userId - User ID to update
   * @param {string} role - New role (admin or user)
   * @param {string} token - Firebase auth token
   * @returns {Promise<Object>} - Response data
   */
  setUserRole: async (userId, role, token) => {
    try {
      // Use the Next.js API proxy route
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id_to_update: userId,
          role
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating user role: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
  
  /**
   * Check if the current user is an admin
   * @param {string} token - Firebase auth token
   * @returns {Promise<boolean>} - Whether the user is an admin
   */
  checkAdminStatus: async (token) => {
    try {
      // Use the Next.js API proxy route
      const response = await fetch('/api/user/role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error checking role: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};

export default adminService; 