import { Calendar } from 'lucide-react';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
}

export const Header = ({ currentMonth, onMonthChange, availableMonths }: HeaderProps) => {
  return (
    <header className="bg-black text-white p-4 shadow-lg">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold">Controle de Pagamentos</h1>
        </div>
        <select
          value={currentMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-yellow-400"
        >
          {availableMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return (
              <option key={month} value={month}>
                {monthNames[parseInt(monthNum) - 1]} {year}
              </option>
            );
          })}
        </select>
      </div>
    </header>
  );
};
