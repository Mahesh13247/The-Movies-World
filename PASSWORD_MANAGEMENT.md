# Role-Based Password Management System with Auto-Lock

## Overview

This application now includes a comprehensive role-based password management system with advanced auto-lock features. Only administrators can set, change, or reset passwords, while regular users can only unlock protected sections. The system includes automatic locking after inactivity, session timeouts, and configurable auto-lock settings.

## Features

### 🔐 Role-Based Access Control
- **Admin Role**: Full access to password management and auto-lock settings
- **User Role**: Can only unlock sections with existing PINs

### 👑 Admin Capabilities
- Set section PINs for any protected area
- Change admin PIN (requires current admin PIN)
- Reset section PINs
- View all current section PINs
- Switch between admin and user roles
- **Configure auto-lock settings**
- **Enable/disable auto-lock functionality**
- **Set inactivity and session timeouts**

### 👤 User Capabilities
- Unlock sections with existing PINs
- Switch to admin role (requires admin PIN)
- Cannot set, change, or reset any PINs
- **Receive auto-lock warnings**
- **Extend session by staying active**

### ⏰ Auto-Lock Features
- **Inactivity Timeout**: Auto-lock after specified minutes of inactivity
- **Session Timeout**: Maximum session duration before auto-lock
- **Activity Tracking**: Monitors mouse, keyboard, and touch activity
- **Warning System**: Shows countdown timer and warning notifications
- **Configurable Settings**: Admins can adjust timeouts and enable/disable
- **Visual Countdown**: Real-time countdown timer in protected sections

## Default Settings

- **Default Admin PIN**: `1234`
- **Default Inactivity Timeout**: 5 minutes
- **Default Session Timeout**: 30 minutes
- **Auto-Lock**: Enabled by default
- **Warning Time**: 1 minute before auto-lock

## How to Use

### For Administrators

1. **Access Admin Panel**:
   - Navigate to "Admin Panel" in the main menu
   - If not in admin role, click "Switch to Admin" and enter admin PIN

2. **Manage Admin PIN**:
   - Go to "Password Management" tab
   - Enter current admin PIN
   - Enter new admin PIN (twice for confirmation)
   - Click "Change Admin PIN"

3. **Manage Section PINs**:
   - Enter section name (e.g., "Adult 18+ Section")
   - Enter 4-digit PIN
   - Click "Set Section PIN" or "Reset Section PIN"

4. **Configure Auto-Lock Settings**:
   - Go to "Auto-Lock Settings" tab
   - Enable/disable auto-lock functionality
   - Set inactivity timeout (1-60 minutes)
   - Set session timeout (5-480 minutes)
   - Click "Save Auto-Lock Settings"

5. **View Current PINs**:
   - All current section PINs are displayed in the admin panel
   - PINs are masked with dots for security

### For Users

1. **Unlock Protected Sections**:
   - Navigate to any protected section
   - Enter the 4-digit PIN provided by admin
   - Click "Unlock"

2. **Monitor Auto-Lock Status**:
   - View countdown timer in top-right corner
   - Timer turns orange when 1 minute remaining
   - Click "Stay Active" to extend session

3. **Switch to Admin Role**:
   - Click "Switch to Admin" button
   - Enter admin PIN
   - Gain admin privileges temporarily

## Auto-Lock System

### How It Works
1. **Session Start**: When a section is unlocked, a session begins
2. **Activity Tracking**: System monitors user activity (mouse, keyboard, touch)
3. **Timeout Checking**: Continuously checks against inactivity and session timeouts
4. **Warning Display**: Shows warning 1 minute before auto-lock
5. **Auto-Lock**: Automatically locks section when timeout is reached

### Activity Detection
The system tracks the following user activities:
- Mouse movements and clicks
- Keyboard input
- Touch events (mobile devices)
- Scrolling
- Any interaction with the page

### Warning System
- **Visual Countdown**: Timer in top-right corner of protected sections
- **Warning Notification**: Popup warning 1 minute before auto-lock
- **Stay Active Button**: Allows users to extend their session
- **Color Coding**: Green timer turns orange when warning is active

### Configuration Options
- **Enable/Disable**: Turn auto-lock on or off globally
- **Inactivity Timeout**: Time before auto-lock due to inactivity (1-60 minutes)
- **Session Timeout**: Maximum session duration (5-480 minutes)
- **Real-time Updates**: Settings apply immediately across all sections

## Security Features

- **PIN Validation**: All PINs must be exactly 4 digits
- **Role Persistence**: User roles are stored in localStorage
- **Access Control**: Users cannot modify PINs without admin privileges
- **Visual Feedback**: Clear role indicators and status messages
- **Error Handling**: Comprehensive error messages for invalid actions
- **Session Management**: Automatic session tracking and cleanup
- **Activity Monitoring**: Real-time activity detection
- **Timeout Enforcement**: Strict enforcement of configured timeouts

## Technical Implementation

### Files Modified/Created:
- `src/utils/userRoles.js` - Core role management and auto-lock utilities
- `src/components/PinLock.jsx` - Updated with auto-lock functionality
- `src/AdminPanel.jsx` - Added auto-lock settings management
- `src/components/PinLock.css` - Styled auto-lock elements
- `src/AdminPanel.css` - Styled auto-lock management interface
- `src/App.jsx` - Added role system initialization

### Key Functions:
- `isAdmin()` - Check if current user is admin
- `setSectionPin()` - Set section PIN (admin only)
- `resetSectionPin()` - Reset section PIN (admin only)
- `changeAdminPin()` - Change admin PIN (admin only)
- `switchToAdmin()` - Switch to admin role (requires PIN)
- `switchToUser()` - Switch to user role
- `getAutoLockSettings()` - Get current auto-lock configuration
- `setAutoLockSettings()` - Update auto-lock settings (admin only)
- `startSession()` - Begin session tracking
- `updateActivity()` - Update last activity timestamp
- `isSessionValid()` - Check if session is still valid
- `checkAndAutoLock()` - Check and auto-lock if needed
- `getRemainingSessionTime()` - Get time remaining in session
- `formatTimeRemaining()` - Format time for display

## Best Practices

1. **Change Default PIN**: Always change the default admin PIN (1234) immediately
2. **Strong PINs**: Use non-sequential, non-repeating 4-digit PINs
3. **Regular Updates**: Periodically update section PINs for security
4. **Role Management**: Switch back to user role when not performing admin tasks
5. **PIN Sharing**: Share section PINs securely with authorized users only
6. **Auto-Lock Configuration**: Set appropriate timeouts based on security needs
7. **User Education**: Inform users about auto-lock features and warnings
8. **Activity Monitoring**: Regularly review auto-lock effectiveness

## Troubleshooting

### Common Issues:
- **"Only admins can..." messages**: Switch to admin role first
- **"Incorrect PIN"**: Verify PIN with administrator
- **"PIN must be 4 digits"**: Ensure PIN is exactly 4 numeric digits
- **Role not switching**: Clear browser cache and try again
- **Auto-lock not working**: Check if auto-lock is enabled in admin settings
- **Timer not updating**: Refresh page or check browser console for errors
- **Warning not showing**: Ensure activity detection is working

### Reset Options:
- Clear localStorage to reset all PINs, roles, and auto-lock settings
- Default admin PIN will be restored to 1234
- All section PINs will need to be set again
- Auto-lock settings will return to defaults

## Future Enhancements

- Server-side authentication
- PIN expiration policies
- Audit logging
- Multi-factor authentication
- Role-based permissions for different sections
- **Advanced activity detection**
- **Custom warning intervals**
- **Session recovery options**
- **Activity analytics**
- **Geolocation-based restrictions** 