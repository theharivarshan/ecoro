import { getCategoryLabel, getCategoryIcon, getCategoryWeight, getScoreBarColor } from '../services/helpers';

export default function CategoryBreakdown({ categoryScores }) {
  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h3 className="font-display text-xl font-bold text-forest-900 mb-4">Category Breakdown</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sorted.map(([cat, score]) => (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 p-4 hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getCategoryIcon(cat)}</span>
              <span className="font-semibold text-sm text-gray-800">{getCategoryLabel(cat)}</span>
            </div>
            <div className="text-2xl font-mono font-bold text-gray-900 mb-1">{score}<span className="text-sm text-gray-400">/100</span></div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full ${getScoreBarColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <div className="text-xs font-mono text-gray-400">Weight: {getCategoryWeight(cat)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
