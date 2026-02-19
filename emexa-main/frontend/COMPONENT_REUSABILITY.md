# Component Reusability Guide

## Overview
The `headerorigin.jsx` and `sidebarorigin.jsx` components are now **reusable** for both Student and Teacher dashboards.

## How It Works

### 1. Header Component
**Props:**
- `userName` (string): The name of the logged-in user
- `userRole` (string): Either "student" or "teacher" (changes avatar color)

**Usage:**
```jsx
import Header from '../components/headerorigin';

// For students (blue avatar)
<Header userName={userName} userRole="student" />

// For teachers (purple avatar)
<Header userName={userName} userRole="teacher" />
```

### 2. Sidebar Component
**Props:**
- `activeMenuItem` (string): Currently selected menu item ID
- `setActiveMenuItem` (function): Function to update active menu item
- `menuItems` (array, optional): Custom menu items for the sidebar

**Usage:**
```jsx
import Sidebar from '../components/sidebarorigin';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <svg>...</svg>
  },
  // Add more items...
];

<Sidebar 
  activeMenuItem={activeMenuItem}
  setActiveMenuItem={setActiveMenuItem}
  menuItems={menuItems}  // Pass custom items
/>
```

## Benefits of This Approach

✅ **No Code Duplication**: One component serves multiple purposes
✅ **Easy Maintenance**: Bug fixes apply to all dashboards
✅ **Consistent UI/UX**: Same look and feel across roles
✅ **Flexible**: Easy to add new roles (admin, parent, etc.)
✅ **Scalable**: Adding new menu items is simple

## Example: Student Dashboard

```jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/headerorigin';
import Sidebar from '../components/sidebarorigin';
import { studentMenuItems } from '../config/menuItems';

const StudentDashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) setUserName(storedUserName);
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen">
      <Header userName={userName} userRole="student" />
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={studentMenuItems}
      />
      {/* Your content here */}
    </div>
  );
};
```

## Example: Teacher Dashboard

```jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/headerorigin';
import Sidebar from '../components/sidebarorigin';
import { teacherMenuItems } from '../config/menuItems';

const TeacherDashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) setUserName(storedUserName);
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-50 to-white min-h-screen">
      <Header userName={userName} userRole="teacher" />
      <Sidebar 
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={setActiveMenuItem}
        menuItems={teacherMenuItems}
      />
      {/* Your content here */}
    </div>
  );
};
```

## Key Differences: Student vs Teacher

| Feature | Student | Teacher |
|---------|---------|---------|
| Avatar Color | Blue | Purple |
| Menu Items | Dashboard, Wellness, Profile | Dashboard, **Quizzes**, Wellness, Profile |
| Route | `/dashboard` | `/teacher-dashboard` |

## Adding New Features

### Add a new menu item to teachers only:
1. Edit `frontend/src/config/menuItems.js`
2. Add the item to `teacherMenuItems` array
3. No changes needed to components!

### Add a new role (e.g., Admin):
1. Create `adminMenuItems` in `menuItems.js`
2. Pass them to the same `Sidebar` component
3. Set `userRole="admin"` on Header for custom color

## Configuration File

All menu items are centralized in:
```
frontend/src/config/menuItems.js
```

This makes it easy to manage menu items for all roles in one place!
