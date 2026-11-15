import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card } from '../common/Card';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

const PALETTE = [
  { fill: '#4f46e5', name: 'Indigo' },
  { fill: '#0284c7', name: 'Sky' },
  { fill: '#059669', name: 'Emerald' },
  { fill: '#d97706', name: 'Amber' },
  { fill: '#7c3aed', name: 'Purple' },
  { fill: '#db2777', name: 'Pink' },
  { fill: '#2563eb', name: 'Blue' }
];

export const CategoryDistributionChart = ({ data = [], isLoading = false }) => {
  const [chartType, setChartType] = useState('bar');

  const totalWarehouseUnits = data.reduce((acc, curr) => acc + Number(curr.totalQuantity || 0), 0);

  return (
    <Card className="p-6 border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Stock Distribution by Category
            </h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
              {data.length} Categories &bull; {formatNumber(totalWarehouseUnits)} Units
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregate stock volume across warehouse product divisions
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200/60">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Volume (Bar)</span>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              chartType === 'pie'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Mix % (Donut)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 w-full flex items-center justify-center text-xs text-slate-400">
          No inventory distribution data available
        </div>
      ) : (
        <div className="h-72 w-full">
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <XAxis
                  dataKey="categoryName"
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1.5 animate-fadeIn">
                          <p className="font-bold text-slate-900 text-sm">{item.categoryName}</p>
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <span>Stock Units:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatNumber(item.totalQuantity)} units
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Share of Warehouse:</span>
                            <span className="font-bold text-emerald-700 font-mono">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQuantity" radius={[8, 8, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE[index % PALETTE.length].fill}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="totalQuantity"
                  nameKey="categoryName"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`pie-cell-${index}`}
                      fill={PALETTE[index % PALETTE.length].fill}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1.5 animate-fadeIn">
                          <p className="font-bold text-slate-900 text-sm">{item.categoryName}</p>
                          <p className="text-slate-600 font-medium">
                            Stock Units: <span className="font-bold text-slate-900 font-mono">{formatNumber(item.totalQuantity)}</span>
                          </p>
                          <p className="text-slate-600 font-medium">
                            Share: <span className="font-bold text-indigo-700 font-mono">{item.percentage}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Category Pills Breakdown */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
        {data.map((item, index) => (
          <div
            key={item.categoryId || index}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PALETTE[index % PALETTE.length].fill }}
            />
            <span className="truncate max-w-[100px]">{item.categoryName}</span>
            <span className="text-slate-400 font-normal">&bull;</span>
            <span className="font-bold text-slate-900 font-mono">{formatNumber(item.totalQuantity)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
