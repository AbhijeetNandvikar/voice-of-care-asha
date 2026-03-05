// Common types for the mobile application

export interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  aadhar_id?: string;
  email?: string;
  address?: string;
  worker_id: string;
  worker_type: string;
  mpin_hash?: string | null;
  profile_photo_url?: string;
  collection_center_id?: number;
  meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: number;
  first_name: string;
  last_name: string;
  mcts_id: string;
  phone_number?: string;
  aadhar_id?: string;
  email?: string;
  address?: string;
  age?: number;
  weight?: number;
  beneficiary_type: string;
  assigned_asha_id: number;
  meta_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VisitTemplate {
  id: number;
  template_type: string;
  name: string;
  questions: Question[];
  meta_data?: Record<string, any>;
  created_at: string;
}

export interface Question {
  id: string;
  order: number;
  input_type: 'yes_no' | 'number' | 'voice';
  question_en: string;
  question_hi: string;
  action_en?: string;
  action_hi?: string;
  is_required: boolean;
}

export interface Visit {
  id: number;
  server_id?: number;
  visit_type: string;
  visit_date_time: string;
  day_number?: number;
  is_synced: boolean;
  assigned_asha_id: number;
  beneficiary_id: number;
  template_id: number;
  visit_data: VisitData;
  meta_data?: Record<string, any>;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VisitData {
  answers: Answer[];
}

export interface Answer {
  question_id: string;
  answer: string | number | null;
  audio_path?: string;
  audio_s3_key?: string;
  transcript_en?: string;
  transcript_hi?: string;
  recorded_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  worker: Worker;
}

export interface InitData {
  worker: Worker;
  beneficiaries: Beneficiary[];
  templates: VisitTemplate[];
}
