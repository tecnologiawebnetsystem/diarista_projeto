/*
  # Create Empregada App Database Schema

  1. New Tables
    - `months`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `month` (text, month number like "01", "02")
      - `year` (integer)
      - `total_work_days` (decimal)
      - `total_laundry` (decimal)
      - `total_month` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `work_days`
      - `id` (uuid, primary key)
      - `month_id` (uuid, foreign key to months)
      - `date` (date)
      - `type` (text: "monday" or "thursday")
      - `value` (decimal)
      - `created_at` (timestamp)
    
    - `laundry_weeks`
      - `id` (uuid, primary key)
      - `month_id` (uuid, foreign key to months)
      - `week_number` (integer: 1-4)
      - `completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies so users only see their own data
    - Public access disabled

  3. Indexes
    - Index on months (user_id, year, month)
    - Index on work_days (month_id)
    - Index on laundry_weeks (month_id)
*/

CREATE TABLE IF NOT EXISTS months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  total_work_days decimal(10, 2) DEFAULT 0,
  total_laundry decimal(10, 2) DEFAULT 0,
  total_month decimal(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, year)
);

CREATE TABLE IF NOT EXISTS work_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('monday', 'thursday')),
  value decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laundry_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month_id, week_number)
);

ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own months"
  ON months FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own months"
  ON months FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own months"
  ON months FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view work_days of own months"
  ON work_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = work_days.month_id
      AND months.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert work_days in own months"
  ON work_days FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = work_days.month_id
      AND months.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own work_days"
  ON work_days FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = work_days.month_id
      AND months.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view laundry_weeks of own months"
  ON laundry_weeks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = laundry_weeks.month_id
      AND months.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert laundry_weeks in own months"
  ON laundry_weeks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = laundry_weeks.month_id
      AND months.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own laundry_weeks"
  ON laundry_weeks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = laundry_weeks.month_id
      AND months.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM months
      WHERE months.id = laundry_weeks.month_id
      AND months.user_id = auth.uid()
    )
  );

CREATE INDEX idx_months_user_id ON months(user_id);
CREATE INDEX idx_months_user_year_month ON months(user_id, year, month);
CREATE INDEX idx_work_days_month_id ON work_days(month_id);
CREATE INDEX idx_laundry_weeks_month_id ON laundry_weeks(month_id);
