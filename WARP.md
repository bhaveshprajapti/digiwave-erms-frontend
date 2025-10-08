# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is **digiwave-erms-frontend**, an Employee Resource Management System (ERMS) frontend built with Next.js 15, React 19, and TypeScript. The application provides dashboards for both administrators and employees to manage attendance, leave requests, projects, clients, and other HR-related activities.

## Common Development Commands

### Development
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build` 
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

### Package Management
- **Install dependencies**: `npm install` or `pnpm install` (pnpm-lock.yaml exists)
- **Add dependency**: `npm install <package>` or `pnpm add <package>`

### Development Server
The app runs on `http://localhost:3000` in development mode with hot reloading enabled.

## Architecture & Structure

### Framework & Technology Stack
- **Frontend**: Next.js 15 with App Router (app/ directory structure)
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks, SWR for data fetching
- **Authentication**: JWT-based with automatic token refresh
- **API Communication**: Axios with interceptors for auth

### Directory Structure

#### App Router (app/)
- `app/dashboard/` - Admin dashboard pages (employees, clients, projects, etc.)
- `app/employee-dashboard/` - Employee-specific dashboard pages
- `app/login/` - Authentication pages
- `app/layout.tsx` - Root layout with providers
- `app/globals.css` - Global styles and Tailwind imports

#### Components (components/)
- `admin/` - Admin-specific components (user management, settings)
- `employee/` - Employee-specific components (dashboard, profile)
- `attendance/` - Attendance tracking and history components
- `leave/` - Leave management components
- `projects/` - Project management components
- `clients/` - Client management components
- `auth/` - Authentication forms and components
- `layout/` - Navigation and layout components
- `ui/` - Reusable UI components (shadcn/ui based)
- `common/` - Shared components like data tables

#### Core Libraries (lib/)
- `api.ts` - Main API client with auth interceptors
- `axios.ts` - Secondary axios instance
- `auth.ts` - Authentication utilities and user management

#### Custom Hooks (hooks/)
- Data fetching hooks for employees, roles, leaves, etc.
- `use-toast.ts` - Toast notifications
- `use-mobile.ts` - Mobile responsiveness utilities

### API Integration

#### Backend Communication
- **API Base URL**: `http://127.0.0.1:8000/api/v1` (Django backend)
- **Proxy Configuration**: Next.js rewrites `/api/*` to Django backend
- **Authentication**: Bearer token in Authorization header
- **Token Management**: Automatic refresh on 401 responses

#### Available API Endpoints
Based on Django URL patterns discovered in error logs:
- `/api/v1/accounts/` - User authentication and profiles
- `/api/v1/common/` - Common data (roles, designations, etc.)
- `/api/v1/attendance/` - Attendance tracking
- `/api/v1/projects/` - Project management
- `/api/v1/clients/` - Client management
- `/api/v1/policies/` - HR policies
- `/api/v1/assets/` - Asset management
- `/api/v1/resources/` - Resource management
- `/api/v1/audit/` - Audit logs

### Key Architectural Patterns

#### Authentication Flow
1. JWT tokens stored in sessionStorage (access) and localStorage (refresh)
2. Automatic token refresh via response interceptor
3. Redirect to `/login` on authentication failure
4. User data cached in localStorage for quick access

#### Component Organization
- **Role-based components**: Separate admin and employee component trees
- **Feature-based grouping**: Components grouped by domain (attendance, leave, projects)
- **Reusable UI**: shadcn/ui components with consistent styling
- **Layout components**: Shared navigation and layout structures

#### Data Fetching
- **SWR integration**: For caching and synchronization
- **Custom hooks**: Domain-specific data fetching (employees, projects, etc.)
- **Error handling**: Graceful degradation when APIs are unavailable
- **Loading states**: Consistent loading indicators across components

#### Styling System
- **Tailwind CSS**: Utility-first styling with custom configuration
- **CSS Variables**: Dynamic theming support
- **shadcn/ui**: Pre-built component library with consistent design
- **Responsive Design**: Mobile-first approach with breakpoint utilities

## Configuration Files

- `next.config.mjs` - Next.js configuration with API proxy setup
- `tailwind.config.js` - Tailwind CSS customization
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `postcss.config.mjs` - PostCSS configuration for Tailwind

## Known Issues

### API Endpoints
The frontend expects certain leave management endpoints that may not be implemented in the backend:
- `/api/v1/leave/leave-requests/`
- `/api/v1/leave/leave-balances/`

These result in 404 errors but are handled gracefully in the application.

### Development Setup
Ensure the Django backend is running on `http://127.0.0.1:8000` before starting the frontend development server.