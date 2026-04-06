import { useEffect, useState } from 'react';

function getColor(score) {
  if (score >= 80) return '#064e3b';
  if (score >= 65) return '#16a34a';
  if (score >= 50) return '#84cc16';
  if (score >= 35) return '#d97706';
  return '#dc2626';
}

function getLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 35) return 'Below Average';
  return 'Needs Improvement';
}

export default function ScoreGauge({ score, size = 'md' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const sizes = { sm: 160, md: 240, lg: 300 };
  const s = sizes[size] || 240;
  const cx = s / 2, cy = s / 2;
  const r = s / 2 - 20;
  const startAngle = 140;
  const endAngle = 400;
  const totalSweep = endAngle - startAngle;

  const polarToCart = (angle, radius) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });

  const describeArc = (startA, endA) => {
    const s1 = polarToCart(startA, r);
    const s2 = polarToCart(endA, r);
    const largeArc = endA - startA > 180 ? 1 : 0;
    return `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${largeArc} 1 ${s2.x} ${s2.y}`;
  };

  const fillAngle = startAngle + (totalSweep * animatedScore) / 100;
  const color = getColor(animatedScore);
  const label = getLabel(animatedScore);
  const fontSize = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-4xl' : 'text-2xl';
  const labelSize = size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <div className="flex flex-col items-center">
      <svg width={s} height={s * 0.75} viewBox={`0 0 ${s} ${s * 0.85}`}>
        <path d={describeArc(startAngle, endAngle)} fill="none" stroke="#e5e7eb" strokeWidth={size === 'lg' ? 18 : 14} strokeLinecap="round" />
        {animatedScore > 0 && (
          <path d={describeArc(startAngle, fillAngle)} fill="none" stroke={color} strokeWidth={size === 'lg' ? 18 : 14} strokeLinecap="round" />
        )}
      </svg>
      <div className="-mt-12 text-center">
        <div className={`${fontSize} font-extrabold`} style={{ color }}>{animatedScore}</div>
        <div className={`${labelSize} font-semibold text-gray-500`}>{label}</div>
      </div>
    </div>
  );
}
