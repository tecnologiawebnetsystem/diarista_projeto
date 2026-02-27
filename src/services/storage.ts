import { AppData, MonthData, WorkDay, LaundryWeek } from '../types';

const STORAGE_KEY = 'empregada_app_data';

const getDefaultMonthData = (month: string, year: number): MonthData => ({
  month,
  year,
  workDays: [],
  laundryWeeks: [
    { id: `${month}-${year}-w1`, weekNumber: 1, completed: false },
    { id: `${month}-${year}-w2`, weekNumber: 2, completed: false },
    { id: `${month}-${year}-w3`, weekNumber: 3, completed: false },
    { id: `${month}-${year}-w4`, weekNumber: 4, completed: false },
  ],
  totalWorkDays: 0,
  totalLaundry: 0,
  totalMonth: 0,
});

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { months: {} };
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getCurrentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthData = (monthKey: string): MonthData => {
  const data = loadData();
  if (!data.months[monthKey]) {
    const [year, month] = monthKey.split('-');
    data.months[monthKey] = getDefaultMonthData(month, parseInt(year));
    saveData(data);
  }
  return data.months[monthKey];
};

export const addWorkDay = (monthKey: string, workDay: WorkDay): void => {
  const data = loadData();
  const monthData = getMonthData(monthKey);
  monthData.workDays.push(workDay);
  calculateTotals(monthData);
  data.months[monthKey] = monthData;
  saveData(data);
};

export const removeWorkDay = (monthKey: string, workDayId: string): void => {
  const data = loadData();
  const monthData = getMonthData(monthKey);
  monthData.workDays = monthData.workDays.filter(wd => wd.id !== workDayId);
  calculateTotals(monthData);
  data.months[monthKey] = monthData;
  saveData(data);
};

export const toggleLaundryWeek = (monthKey: string, weekId: string): void => {
  const data = loadData();
  const monthData = getMonthData(monthKey);
  const week = monthData.laundryWeeks.find(w => w.id === weekId);
  if (week) {
    week.completed = !week.completed;
  }
  calculateTotals(monthData);
  data.months[monthKey] = monthData;
  saveData(data);
};

const calculateTotals = (monthData: MonthData): void => {
  monthData.totalWorkDays = monthData.workDays.reduce((sum, wd) => sum + wd.value, 0);

  const completedWeeks = monthData.laundryWeeks.filter(w => w.completed).length;
  monthData.totalLaundry = (completedWeeks / 4) * 300;

  monthData.totalMonth = monthData.totalWorkDays + monthData.totalLaundry;
};

export const getAllMonths = (): MonthData[] => {
  const data = loadData();
  return Object.keys(data.months)
    .sort((a, b) => b.localeCompare(a))
    .map(key => data.months[key]);
};
