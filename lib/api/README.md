# Centralized API Configuration

This directory contains the centralized API configuration for the ERMS frontend application.

## Structure

```
lib/
├── api.ts                 # Main axios configuration with interceptors
├── api/
│   ├── index.ts          # Re-exports all API functions
│   ├── users.ts          # User management APIs
│   ├── roles.ts          # Role management APIs
│   ├── holidays.ts       # Holiday management APIs
│   ├── shifts.ts         # Shift management APIs
│   ├── employee-types.ts # Employee type APIs
│   ├── leave-balances.ts # Leave balance APIs
│   ├── attendances.ts    # Attendance APIs
│   └── ...               # Other API modules
└── .env.local            # Environment configuration
```

## Environment Configuration

The API base URL is configured using environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

For production:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api/v1
```

## Usage

### Option 1: Import specific API functions
```typescript
import { getUsers, createUser, updateUser } from '@/lib/api/users'
import { getRoles, createRole } from '@/lib/api/roles'

// Use the functions
const users = await getUsers()
const newUser = await createUser(userData)
```

### Option 2: Import from centralized index
```typescript
import { getUsers, createUser, getRoles, createRole } from '@/lib/api'

// Use the functions
const users = await getUsers()
const roles = await getRoles()
```

### Option 3: Use the generic API service
```typescript
import { apiService } from '@/lib/api'

// Generic HTTP methods
const response = await apiService.get<User[]>('/accounts/users/')
const newUser = await apiService.post<User>('/accounts/users/', userData)

// File upload
await apiService.uploadFile('/upload/', file, (progress) => {
  console.log(`Upload progress: ${progress}%`)
})
```

## Features

### Authentication
- Automatic JWT token management
- Token refresh on 401 errors
- Automatic redirect to login on authentication failures

### Error Handling
- Centralized error handling with interceptors
- Automatic retry on token refresh
- Consistent error responses

### Request/Response Interceptors
- Automatic authorization headers
- Request/response logging in development
- Token refresh logic

### Environment-based Configuration
- Configurable API base URL via environment variables
- Support for different environments (dev, staging, prod)

## Migration from Old Pattern

### Before (multiple axios instances):
```typescript
// lib/axios.ts
import axios from 'axios'
export const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

// In components
import { axiosInstance } from '@/lib/axios'
const response = await axiosInstance.get('/api/v1/users/')
```

### After (centralized configuration):
```typescript
// lib/api/users.ts
import { apiService } from '@/lib/api'
export const getUsers = () => apiService.get<User[]>('/accounts/users/')

// In components
import { getUsers } from '@/lib/api/users'
const users = await getUsers()
```

## Benefits

1. **Single Source of Truth**: One axios configuration for the entire app
2. **Environment Configuration**: Easy to switch between dev/staging/prod
3. **Type Safety**: TypeScript support with proper typing
4. **Consistent Error Handling**: Centralized error management
5. **Easy Testing**: Mock API functions instead of axios instances
6. **Better Organization**: Logical grouping of API endpoints
7. **Reusability**: Shared API functions across components