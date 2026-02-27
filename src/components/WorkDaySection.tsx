import { Plus, Trash2 } from 'lucide-react';
import { WorkDay } from '../types';

interface WorkDaySectionProps {
  workDays: WorkDay[];
  onAddWorkDay: (type: 'monday' | 'thursday') => void;
  onRemoveWorkDay: (id: string) => void;
}

export const WorkDaySection = ({ workDays, onAddWorkDay, onRemoveWorkDay }: WorkDaySectionProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const mondayDays = workDays.filter(wd => wd.type === 'monday');
  const thursdayDays = workDays.filter(wd => wd.type === 'thursday');

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Dias Trabalhados</h2>

      <div className="space-y-4">
        <div className="border-l-4 border-red-500 pl-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Segundas-feiras (R$ 150)</h3>
            <button
              onClick={() => onAddWorkDay('monday')}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {mondayDays.map(day => (
              <div key={day.id} className="flex items-center justify-between bg-red-50 p-2 rounded">
                <span className="text-sm text-gray-700">{formatDate(day.date)}</span>
                <button
                  onClick={() => onRemoveWorkDay(day.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {mondayDays.length === 0 && (
              <p className="text-sm text-gray-500 italic">Nenhum dia adicionado</p>
            )}
          </div>
        </div>

        <div className="border-l-4 border-blue-500 pl-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Quintas-feiras (R$ 100)</h3>
            <button
              onClick={() => onAddWorkDay('thursday')}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {thursdayDays.map(day => (
              <div key={day.id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                <span className="text-sm text-gray-700">{formatDate(day.date)}</span>
                <button
                  onClick={() => onRemoveWorkDay(day.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {thursdayDays.length === 0 && (
              <p className="text-sm text-gray-500 italic">Nenhum dia adicionado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
