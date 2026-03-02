// Worker types
export interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  aadhar_id?: string;
  email?: string;
  address?: string;
  worker_type: 'asha_worker' | 'medical_officer' | 'anm' | 'aaw';
  worker_id: string;
  collection_center_id?: number;
  profile_photo_url?: string;
  meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Beneficiary types
export interface Beneficiary {
  id: number;
  first_name: string;
  last_name: string;
  phone_number?: string;
  aadhar_id?: string;
  email?: string;
  address?: string;
  age?: number;
  weight?: number;
  mcts_id: string;
  beneficiary_type: 'individual' | 'child' | 'mother_child';
  assigned_asha_id?: number;
  meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Visit types
export interface Visit {
  id: number;
  visit_type: 'hbnc' | 'anc' | 'pnc';
  visit_date_time: string;
  day_number?: number;
  is_synced: boolean;
  assigned_asha_id: number;
  beneficiary_id: number;
  template_id: number;
  visit_data: Record<string, any>;
  meta_data?: Record<string, any>;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  worker_id: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  worker: Worker;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Sync Log types
export interface SyncLog {
  id: number;
  visit_id: number;
  worker_id: number;
  collection_center_id?: number;
  date_time: string;
  status: 'completed' | 'incomplete' | 'failed';
  error_message?: string;
  meta_data?: Record<string, any>;
  worker_name?: string;
  visit_count?: number;
}

// API Error types
export interface ApiError {
  detail: string;
  status_code?: number;
}
