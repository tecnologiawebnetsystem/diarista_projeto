import { DollarSign } from 'lucide-react';

interface TotalSectionProps {
  totalWorkDays: number;
  totalLaundry: number;
  totalMonth: number;
}

export const TotalSection = ({ totalWorkDays, totalLaundry, totalMonth }: TotalSectionProps) => {
  return (
    <div className="bg-gradient-to-r from-gray-800 to-black text-white rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold">Total do Mês</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-gray-700">
          <span className="text-gray-300">Dias trabalhados:</span>
          <span className="text-lg font-semibold text-red-400">R$ {totalWorkDays.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center pb-2 border-b border-gray-700">
          <span className="text-gray-300">Lavagem de roupas:</span>
          <span className="text-lg font-semibold text-yellow-400">R$ {totalLaundry.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-xl font-bold">TOTAL:</span>
          <span className="text-2xl font-bold text-green-400">R$ {totalMonth.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
