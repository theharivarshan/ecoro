import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCO2, formatWater } from '../services/helpers';

export default function AnnualProjectionCard({ yearlyResult, weeklyScore }) {
  if (!yearlyResult) return null;
  const { annualizedMetrics: m, projectedAnnualScore, riskPatterns, annualSummary, earthImpactPercent } = yearlyResult;

  const chartData = [
    { name: 'Current', score: weeklyScore },
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
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-xs text-gray-500">Electricity</div>
          <div className="text-lg font-mono font-bold text-gray-900">{m.yearlyUnits} units/yr</div>
          <div className="text-xs text-gray-400">{annualSummary.estimatedMonthlyBill}/mo</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">🚗</div>
          <div className="text-xs text-gray-500">Transport CO₂</div>
          <div className="text-lg font-mono font-bold text-gray-900">{formatCO2(m.yearlyTransportCO2Kg)}/yr</div>
          <div className="text-xs text-gray-400">{m.yearlyKmDriven.toLocaleString()} km driven</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">💧</div>
          <div className="text-xs text-gray-500">Water</div>
          <div className="text-lg font-mono font-bold text-gray-900">{annualSummary.yearlyWater}</div>
          <div className="text-xs text-gray-400">{annualSummary.dailyWater} daily</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-xs text-gray-500">Online Orders</div>
          <div className="text-lg font-mono font-bold text-gray-900">{m.yearlyOnlineOrders}/yr</div>
          <div className="text-xs text-gray-400">{formatCO2(m.yearlyShoppingCO2Kg)} CO₂</div>
        </div>
      </div>

      {/* Earth Impact */}
      {earthImpactPercent && (
        <div className="bg-gradient-to-r from-forest-50 to-sky-50 rounded-xl border border-forest-200 p-4 mb-6 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Your Share of India's CO₂ Emissions</div>
          <div className="text-xl font-mono font-bold text-forest-800">{earthImpactPercent}%</div>
          <div className="text-xs text-gray-400">of India's {2.88} billion tonnes/year</div>
        </div>
      )}

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
              {rp.level}: {rp.area} — {rp.detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
