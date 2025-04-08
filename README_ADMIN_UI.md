# Admin User Management 

This document explains the admin user management functionality implemented in the AccelMonitor application.

## Overview

The admin user management feature allows administrators to:
- View all users in the system
- Promote regular users to admin
- Demote admins to regular users
- Delete users

## Components

The following components were created:

1. **API Endpoints**
   - `/api/admin/users` - List all users (admin only)
   - `/api/admin/set-role` - Set a user's role (admin only)
   - `/api/admin/users/{user_id}` - Delete a user (admin only)
   - `/api/user/role` - Get the current user's role

2. **Admin Page**
   - `/admin/users` - Admin user management page

3. **Supporting Components**
   - `RequireAdmin.jsx` - A component to protect admin routes
   - `adminService.js` - Service for interacting with admin APIs
   - Updated AuthContext with isAdmin state

## Usage

### Accessing the Admin Panel

1. Log in as an admin user
2. Click on the "User Management" link in the header
3. You will be taken to the admin user management page

### Managing Users

From the admin panel, you can:

1. **View all users**: See a list of all users with their IDs, roles, and creation dates
2. **Promote a user**: Click the "Promote to Admin" button next to a regular user
3. **Demote an admin**: Click the "Demote to User" button next to an admin user
4. **Delete a user**: Click the "Delete" button next to any user

### Admin Check

The admin functionality is protected by:

1. **Frontend checks**: The RequireAdmin component prevents non-admin users from accessing the admin pages
2. **Backend checks**: All admin API endpoints verify that the user has admin privileges before processing the request

## API Integration

The admin page communicates with the API server through Next.js API routes, which proxy the requests to the backend API server. This ensures:

1. **Security**: The backend API server details are not exposed to the client
2. **Consistency**: All requests include proper authentication headers
3. **Error handling**: Errors from the backend API server are handled appropriately

## Styling

The admin user management page is styled using Tailwind CSS, providing a consistent look and feel with the rest of the application.

## Testing

To test the admin user management functionality:

1. Create a regular user account
2. Use the `create_admin_user.py` script to make a user an admin:
   ```
   python create_admin_user.py <user_id>
   ```
3. Log in as the admin user
4. Access the User Management page
5. Try promoting, demoting, and deleting users 