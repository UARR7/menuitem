// ─────────────────────────────────────────────
// Domain Models
// ─────────────────────────────────────────────

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  availability: AvailabilityStatus;
  category_id: number | null;   // nullable — item exists independently of category
  created_at: Date;
  updated_at: Date;
}

// With joined category info (read model)
export interface MenuItemWithCategory extends MenuItem {
  category_name: string | null;
}

// ─────────────────────────────────────────────
// Request DTOs
// ─────────────────────────────────────────────

export interface CreateCategoryDto {
  name: string;
  description?: string;
  display_order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  availability?: AvailabilityStatus;
  category_id?: number | null;
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  availability?: AvailabilityStatus;
  category_id?: number | null;  // explicitly settable to null to un-assign
}

export interface AssignCategoryDto {
  category_id: number | null;   // null = remove from category
}

export interface ToggleAvailabilityDto {
  availability: AvailabilityStatus;
}

// ─────────────────────────────────────────────
// Query / Filter DTOs
// ─────────────────────────────────────────────

export interface MenuItemFilterDto {
  category_id?: number | null;
  availability?: AvailabilityStatus;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}
