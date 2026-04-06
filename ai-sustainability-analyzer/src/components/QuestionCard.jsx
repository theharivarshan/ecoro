import { useState, useEffect } from 'react';

export default function QuestionCard({ question, value, onChange, error }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const q = question;
  const val = value;

  const renderInput = () => {
    switch (q.type) {
      case 'text':
        return (
          <input
            type="text"
            value={val || ''}
            onChange={(e) => onChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Type your answer...'}
            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-gray-300'} focus:border-forest-500 focus:ring-2 focus:ring-forest-200 outline-none transition-all`}
          />
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={val || ''}
              onChange={(e) => onChange(q.id, Number(e.target.value))}
              min={q.min}
              max={q.max}
              step={q.step}
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-gray-300'} focus:border-forest-500 focus:ring-2 focus:ring-forest-200 outline-none transition-all`}
            />
            {q.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded">{q.unit}</span>
            )}
          </div>
        );

      case 'slider': {
        const sliderVal = val !== undefined && val !== '' ? Number(val) : (q.defaultValue !== undefined ? q.defaultValue : q.min || 0);
        return (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">{q.min || 0}</span>
              <span className="text-lg font-bold text-forest-800">{sliderVal}{q.unit ? ` ${q.unit}` : ''}</span>
              <span className="text-xs text-gray-400">{q.max}</span>
            </div>
            <input
              type="range"
              min={q.min || 0}
              max={q.max || 100}
              step={q.step || 1}
              value={sliderVal}
              onChange={(e) => onChange(q.id, Number(e.target.value))}
              className="w-full"
            />
          </div>
        );
      }

      case 'radio':
        return (
          <div className="grid grid-cols-2 gap-2">
            {(q.options || []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(q.id, opt.value)}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                  val === opt.value
                    ? 'bg-forest-800 text-white border-forest-800'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-forest-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

      case 'toggle': {
        const isOn = val === true || val === 'yes';
        const isOff = val === false || val === 'no';
        return (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange(q.id, 'yes')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all border-2 ${
                isOn ? 'bg-forest-700 text-white border-forest-700' : 'bg-white text-gray-500 border-gray-200 hover:border-forest-300'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange(q.id, 'no')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all border-2 ${
                isOff ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              No
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`mb-6 transition-all duration-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      <label className="block text-base font-semibold text-gray-800 mb-1">{q.question}</label>
      {q.tooltip && (
        <p className="text-xs text-gray-400 italic mb-3">{q.tooltip}</p>
      )}
      {renderInput()}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
