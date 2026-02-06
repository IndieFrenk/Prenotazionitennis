/**
 * Shared/common interfaces used across the application.
 */

/** Generic paginated API response wrapper. */
export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Standard API error response structure. */
export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  errors: string[];
}

/** Admin dashboard statistics overview. */
export interface DashboardStats {
  totalReservationsToday: number;
  totalReservationsWeek: number;
  totalReservationsMonth: number;
  totalRevenue: number;
  courtUsageStats: CourtUsageStat[];
}

/** Usage statistics for a single court. */
export interface CourtUsageStat {
  courtId: string;
  courtName: string;
  reservationCount: number;
  revenue: number;
}
