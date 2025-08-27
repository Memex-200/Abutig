# Complaint Management System - Implementation Guide

## Overview

This guide provides step-by-step instructions to fix the complaint management system where citizen-submitted complaints were incorrectly assigned "employee" roles and displayed in the wrong sections.

## Issues Fixed

### 1. Role Assignment Issue

- **Problem**: Citizens were assigned "EMPLOYEE" role instead of "CITIZEN"
- **Solution**: Updated complaint submission logic to explicitly assign "CITIZEN" role

### 2. Display Location Issue

- **Problem**: Complaints appeared in "User Management" instead of "Complaint Management"
- **Solution**: Updated UI routing and data fetching to display complaints in correct sections

### 3. Data Consistency Issue

- **Problem**: Existing data had incorrect role assignments
- **Solution**: Created comprehensive database fix script

## Implementation Steps

### Step 1: Database Fixes

1. **Run the Database Fix Script**:

   ```sql
   -- Execute fix_complaint_roles.sql in Supabase SQL Editor
   ```

   This script will:

   - Update existing users with complaints to have "CITIZEN" role
   - Create missing user records for complaints
   - Link complaints to correct citizen users
   - Provide verification queries

2. **Apply Updated RLS Policies**:
   ```sql
   -- Execute apply_rls_policies.sql in Supabase SQL Editor
   ```
   This ensures proper role-based access control.

### Step 2: Code Updates

#### ComplaintForm.tsx Changes

- Enhanced role assignment logic
- Added explicit "CITIZEN" role assignment
- Improved error handling and logging
- Added validation for existing users

#### AdminDashboard.tsx Changes

- Updated `fetchComplaints()` to properly handle citizen data
- Modified `fetchUsers()` to only show employees and admins
- Enhanced UI to display citizen role information
- Improved data transformation and error handling

### Step 3: UI Improvements

#### Complaint Management Section

- Displays all complaints with proper citizen information
- Shows citizen role (مواطن) in the complaints table
- Proper filtering and search functionality

#### User Management Section

- Only shows employees and admins
- Citizens are managed through the complaints system
- Clear role distinction in the UI

## Technical Details

### Database Schema

```sql
-- Users table with proper role enum
CREATE TYPE user_role AS ENUM ('CITIZEN', 'EMPLOYEE', 'ADMIN');

-- Complaints table with citizen association
CREATE TABLE complaints (
  id UUID PRIMARY KEY,
  citizen_id UUID REFERENCES users(id),
  -- other fields...
);
```

### Role-Based Access Control

- **Citizens**: Can only see their own complaints
- **Employees**: Can see complaints assigned to them
- **Admins**: Can see all complaints and manage users

### Data Flow

1. Citizen submits complaint → Creates/updates user with "CITIZEN" role
2. Complaint is stored with proper citizen association
3. Admin dashboard displays complaints in correct section
4. User management only shows employees and admins

## Verification Steps

### 1. Check Database

```sql
-- Verify user roles
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Verify complaint associations
SELECT c.id, u.role, u.full_name
FROM complaints c
JOIN users u ON c.citizen_id = u.id;
```

### 2. Test Complaint Submission

1. Submit a new complaint as a citizen
2. Verify the user is created with "CITIZEN" role
3. Check that the complaint appears in "Complaint Management"

### 3. Test Admin Dashboard

1. Login as admin
2. Navigate to "Complaint Management" - should show all complaints
3. Navigate to "User Management" - should only show employees and admins

## Troubleshooting

### Common Issues

1. **Role Assignment Still Wrong**

   - Check if the database fix script was executed
   - Verify RLS policies are applied
   - Check browser console for errors

2. **Complaints Not Showing**

   - Verify complaint-citizen associations in database
   - Check RLS policies for admin access
   - Ensure proper data transformation in fetchComplaints()

3. **UI Not Updating**
   - Clear browser cache
   - Restart development server
   - Check for TypeScript compilation errors

### Debug Commands

```sql
-- Check current state
SELECT 'Users' as table_name, role, COUNT(*) as count FROM users GROUP BY role
UNION ALL
SELECT 'Complaints' as table_name, status, COUNT(*) as count FROM complaints GROUP BY status;

-- Check specific complaint
SELECT c.*, u.full_name, u.role
FROM complaints c
JOIN users u ON c.citizen_id = u.id
WHERE c.id = 'your-complaint-id';
```

## Performance Considerations

1. **Indexing**: Ensure proper indexes on frequently queried fields
2. **Caching**: Consider implementing client-side caching for complaint data
3. **Pagination**: Implement pagination for large complaint lists
4. **Real-time Updates**: Consider using Supabase real-time subscriptions

## Security Considerations

1. **Role Validation**: Always validate user roles on both client and server
2. **RLS Policies**: Ensure all tables have proper RLS policies
3. **Input Validation**: Validate all form inputs before database operations
4. **Error Handling**: Don't expose sensitive information in error messages

## Future Enhancements

1. **Complaint Assignment**: Allow admins to assign complaints to employees
2. **Status Tracking**: Implement detailed status tracking with timestamps
3. **Notifications**: Add real-time notifications for status changes
4. **Reporting**: Implement comprehensive reporting features
5. **Mobile Support**: Optimize for mobile devices

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify database state using the verification queries
4. Check Supabase logs for backend errors
