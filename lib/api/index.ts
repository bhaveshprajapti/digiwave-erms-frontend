// Re-export all API functions for easy importing
export * from './users'
export * from './roles'
export * from './holidays'
export * from './shifts'
export * from './employee-types'
export * from './leave-balances'
export * from './attendances'
export * from './leave-requests'
export * from './leave-types'
export * from './leave-policies'
export * from './leave-analytics'
export * from './approvals'
// Note: time-adjustments commented out due to duplicate PaginatedResponse export
// export * from './time-adjustments'

// Export the main API client and service
export { default as api, apiClient, apiService } from '@/lib/api'