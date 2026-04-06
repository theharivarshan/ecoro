import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCO2, formatWater } from '../services/helpers';

export default function AnnualProjectionCard({ yearlyResult, weeklyScore }) {
  if (!yearlyResult) return null;
  const { annualizedMetrics: m, projectedAnnualScore, riskPatterns, annualSummary } = yearlyResult;

  const chartData = [
    { name: 'Weekly x52', score: weeklyScore },
    { name: 'Projected Annual', score: projectedAnnualScore },
  ];

  const riskColor = (level) => {
    if (level === 'HIGH') return 'bg-red-100 text-red-700';
    if (level === 'MEDIUM') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div>
      <h3 className="font-display text-xl font-bold text-forest-900 mb-4">Annual Projection</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">🚗</div>
          <div className="text-xs text-gray-500">Transport CO2</div>
          <div className="text-lg font-bold text-gray-900">{formatCO2(m.totalTransportCO2KgYear)}/yr</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-xs text-gray-500">Electricity</div>
          <div className="text-lg font-bold text-gray-900">{m.totalEstimatedKwhYear} kWh/yr</div>
          <div className="text-xs text-gray-400">{annualSummary.estimatedMonthlyBill}/mo</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">💧</div>
          <div className="text-xs text-gray-500">Water</div>
          <div className="text-lg font-bold text-gray-900">{formatWater(m.totalWaterLitresYear)}/yr</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-xs text-gray-500">Deliveries</div>
          <div className="text-lg font-bold text-gray-900">{m.deliveriesPerYear}/yr</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="text-sm text-gray-500 mb-2">Score Projection (seasonal adjustment)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="score" fill="#166534" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 italic mt-2">Seasonal factors: Summer AC usage increases, monsoon travel reduction, winter geyser increase.</p>
      </div>
      {riskPatterns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {riskPatterns.map((rp, i) => (
            <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${riskColor(rp.level)}`}>
              {rp.level}: {rp.area} - {rp.detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
