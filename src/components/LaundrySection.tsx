import { CheckCircle, Circle } from 'lucide-react';
import { LaundryWeek } from '../types';

interface LaundrySectionProps {
  laundryWeeks: LaundryWeek[];
  onToggleWeek: (weekId: string, completed: boolean) => void;
}

export const LaundrySection = ({ laundryWeeks, onToggleWeek }: LaundrySectionProps) => {
  const completedWeeks = laundryWeeks.filter(w => w.completed).length;
  const totalLaundry = (completedWeeks / 4) * 300;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-2">Lavagem de Roupas</h2>
      <p className="text-sm text-gray-600 mb-4">
        Total mensal: R$ 300 (4 semanas) - Atual: R$ {totalLaundry.toFixed(2)}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {laundryWeeks.map(week => (
          <button
            key={week.id}
            onClick={() => onToggleWeek(week.id, week.completed)}
            className={`p-4 rounded-lg border-2 transition-all ${
              week.completed
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {week.completed ? (
                <CheckCircle className="w-6 h-6 text-yellow-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
              <span className={`font-semibold ${
                week.completed ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                Semana {week.weekNumber}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
