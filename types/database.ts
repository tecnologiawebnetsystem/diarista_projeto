export interface Diarista {
  id: string
  name: string
  pin: string
  phone?: string | null
  active: boolean
  photo_url?: string | null
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  date: string
  day_type: 'heavy_cleaning' | 'light_cleaning'
  present: boolean
  start_time?: string | null
  end_time?: string | null
  notes?: string | null
  diarista_id?: string | null
  created_at: string
  updated_at: string
}

export interface LaundryWeek {
  id: string
  week_number: number
  month: number
  year: number
  value: number
  ironed: boolean
  washed: boolean
  transport_fee: number
  receipt_url?: string | null
  paid_at?: string | null
  diarista_id?: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyPayment {
  id: string
  month: number
  year: number
  payment_date?: string | null
  payment_due_date: string
  monthly_value: number
  receipt_url?: string | null
  paid_at?: string | null
  hour_limit: string
  notes?: string | null
  diarista_id?: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  date: string
  note_type: string
  content: string
  is_warning: boolean
  diarista_id?: string | null
  created_at: string
  updated_at: string
}

export interface Award {
  id: string
  period_start: string
  period_end: string
  status: 'pending' | 'awarded' | 'disqualified'
  value: number
  warnings_count: number
  attendance_score: number
  performance_score: number
  conduct_score: number
  disqualification_reason?: string | null
  awarded_at?: string | null
  diarista_id?: string | null
  created_at: string
  updated_at: string
}

export interface PerformanceMetric {
  id: string
  date: string
  punctuality: boolean
  tasks_completed: boolean
  requires_rework: boolean
  notes?: string | null
  diarista_id?: string | null
  created_at: string
  updated_at: string
}

export interface Config {
  id: string
  key: string
  value: number
  label: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface ContractAgreement {
  id: string
  agreed_at: string
  ip_address?: string | null
  user_agent?: string | null
  diarista_id?: string | null
  created_at: string
}

export interface PaymentHistory {
  id: string
  diarista_id: string
  month: number
  year: number
  type: 'salary' | 'laundry' | 'transport' | 'bonus'
  description?: string | null
  amount: number
  status: 'pending' | 'paid'
  paid_at?: string | null
  receipt_url?: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      diaristas: {
        Row: Diarista
        Insert: Omit<Diarista, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Diarista, 'id' | 'created_at' | 'updated_at'>>
      }
      monthly_payments: {
        Row: MonthlyPayment
        Insert: Omit<MonthlyPayment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MonthlyPayment, 'id' | 'created_at' | 'updated_at'>>
      }
      attendance: {
        Row: Attendance
        Insert: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Attendance, 'id' | 'created_at' | 'updated_at'>>
      }
      laundry_weeks: {
        Row: LaundryWeek
        Insert: Omit<LaundryWeek, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LaundryWeek, 'id' | 'created_at' | 'updated_at'>>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at'>>
      }
      config: {
        Row: Config
        Insert: Omit<Config, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Config, 'id' | 'created_at' | 'updated_at'>>
      }
      awards: {
        Row: Award
        Insert: Omit<Award, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Award, 'id' | 'created_at' | 'updated_at'>>
      }
      performance_metrics: {
        Row: PerformanceMetric
        Insert: Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>>
      }
      contract_agreements: {
        Row: ContractAgreement
        Insert: Omit<ContractAgreement, 'id' | 'created_at'>
        Update: Partial<Omit<ContractAgreement, 'id' | 'created_at'>>
      }
      payment_history: {
        Row: PaymentHistory
        Insert: Omit<PaymentHistory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PaymentHistory, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
