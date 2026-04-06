import { Loader2, Zap, Calendar, Leaf, Target, Sparkles } from 'lucide-react';

export default function RecommendationCard({ recommendations, isLoading, source }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold text-forest-900">AI Recommendations</h3>
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating personalized recommendations...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations) return null;
  const r = recommendations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-forest-900">AI Recommendations</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${source === 'live' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {source === 'live' ? 'AI-powered' : 'Smart analysis'}
        </span>
      </div>

      <div className="bg-forest-50 rounded-xl p-4 border border-forest-200">
        <p className="text-forest-900 text-sm leading-relaxed">{r.summary}</p>
      </div>

      {r.topConcerns && r.topConcerns.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-amber-600" /> Top Concerns</h4>
          <div className="space-y-2">
            {r.topConcerns.map((c, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">{c}</div>
            ))}
          </div>
        </div>
      )}

      {r.immediateActions && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-green-600" /> Immediate Actions</h4>
          <div className="space-y-3">
            {r.immediateActions.map((a, i) => (
              <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold text-green-900 text-sm">{a.action}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${a.effort === 'low' ? 'bg-green-200 text-green-800' : a.effort === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>{a.effort}</span>
                </div>
                <p className="text-xs text-green-700 mb-1">{a.impact}</p>
                <p className="text-xs font-medium text-green-800">{a.estimatedSaving}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.weeklyImprovements && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-600" /> Weekly Habits</h4>
          <div className="space-y-2">
            {r.weeklyImprovements.map((h, i) => (
              <div key={i} className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <span className="font-medium text-teal-900 text-sm">{h.habit}</span>
                <p className="text-xs text-teal-700 mt-0.5">{h.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.monthlyPlan && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> Monthly Goals</h4>
          {r.monthlyPlan.map((p, i) => (
            <div key={i} className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-2">
              <span className="font-semibold text-purple-900 text-sm">{p.goal}</span>
              <ol className="mt-2 space-y-1">
                {p.steps.map((s, j) => (
                  <li key={j} className="text-xs text-purple-700 flex gap-2"><span className="font-bold">{j + 1}.</span>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {r.longTermHabits && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Leaf className="w-4 h-4 text-forest-600" /> Long-term Habits</h4>
          <ul className="space-y-2">
            {r.longTermHabits.map((h, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2 items-start">
                <Leaf className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />{h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.motivation && (
        <div className="bg-forest-800 text-white rounded-xl p-5">
          <p className="font-display italic text-sm leading-relaxed">{r.motivation}</p>
        </div>
      )}
    </div>
  );
}
