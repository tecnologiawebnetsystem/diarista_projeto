-- Create tables for diarista payment control system

-- Table for work days
CREATE TABLE IF NOT EXISTS work_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for laundry weeks
CREATE TABLE IF NOT EXISTS laundry_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  value DECIMAL(10, 2) NOT NULL DEFAULT 70.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(week_number, month, year)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_work_days_date ON work_days(date);
CREATE INDEX IF NOT EXISTS idx_work_days_day_of_week ON work_days(day_of_week);
CREATE INDEX IF NOT EXISTS idx_laundry_weeks_period ON laundry_weeks(year, month, week_number);

-- Enable Row Level Security
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_weeks ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - can be restricted later)
CREATE POLICY "Allow all operations on work_days" ON work_days
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on laundry_weeks" ON laundry_weeks
  FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_work_days_updated_at BEFORE UPDATE ON work_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_laundry_weeks_updated_at BEFORE UPDATE ON laundry_weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
