import { supabase } from '../lib/supabase';
import { MonthData, WorkDay, LaundryWeek } from '../types';

export const getOrCreateMonth = async (
  userId: string,
  month: string,
  year: number
): Promise<string> => {
  const { data, error } = await supabase
    .from('months')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data.id;
  }

  const { data: newMonth, error: createError } = await supabase
    .from('months')
    .insert([
      {
        user_id: userId,
        month,
        year,
        total_work_days: 0,
        total_laundry: 0,
        total_month: 0,
      },
    ])
    .select('id')
    .single();

  if (createError) throw createError;
  return newMonth.id;
};

export const getMonthData = async (
  userId: string,
  monthKey: string
): Promise<MonthData | null> => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr);
  const month = monthStr;

  try {
    const monthId = await getOrCreateMonth(userId, month, year);

    const { data: workDays, error: wdError } = await supabase
      .from('work_days')
      .select('*')
      .eq('month_id', monthId)
      .order('created_at', { ascending: false });

    if (wdError) throw wdError;

    const { data: laundryWeeks, error: lwError } = await supabase
      .from('laundry_weeks')
      .select('*')
      .eq('month_id', monthId)
      .order('week_number');

    if (lwError) throw lwError;

    const totalWorkDays = workDays?.reduce((sum, wd) => sum + wd.value, 0) || 0;
    const completedWeeks = laundryWeeks?.filter(w => w.completed).length || 0;
    const totalLaundry = (completedWeeks / 4) * 300;
    const totalMonth = totalWorkDays + totalLaundry;

    return {
      month,
      year,
      workDays: workDays || [],
      laundryWeeks: laundryWeeks || [],
      totalWorkDays,
      totalLaundry,
      totalMonth,
    };
  } catch (error) {
    console.error('Error fetching month data:', error);
    return null;
  }
};

export const addWorkDay = async (
  userId: string,
  monthKey: string,
  workDay: WorkDay
): Promise<void> => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr);
  const month = monthStr;

  const monthId = await getOrCreateMonth(userId, month, year);

  const { error } = await supabase.from('work_days').insert([
    {
      month_id: monthId,
      date: workDay.date,
      type: workDay.type,
      value: workDay.value,
    },
  ]);

  if (error) throw error;
};

export const removeWorkDay = async (workDayId: string): Promise<void> => {
  const { error } = await supabase
    .from('work_days')
    .delete()
    .eq('id', workDayId);

  if (error) throw error;
};

export const toggleLaundryWeek = async (
  laundryWeekId: string,
  completed: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('laundry_weeks')
    .update({ completed })
    .eq('id', laundryWeekId);

  if (error) throw error;
};

export const getAllMonths = async (userId: string): Promise<MonthData[]> => {
  const { data, error } = await supabase
    .from('months')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw error;

  const months: MonthData[] = [];

  for (const m of data || []) {
    const monthKey = `${m.year}-${m.month}`;
    const monthData = await getMonthData(userId, monthKey);
    if (monthData) {
      months.push(monthData);
    }
  }

  return months;
};
