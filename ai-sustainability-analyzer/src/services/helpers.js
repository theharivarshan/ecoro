export function getScoreBand(score) {
  if (score >= 80) return { label: 'Excellent', color: '#064e3b', bgClass: 'bg-forest-900' };
  if (score >= 65) return { label: 'Good', color: '#16a34a', bgClass: 'bg-forest-600' };
  if (score >= 50) return { label: 'Average', color: '#84cc16', bgClass: 'bg-lime-500' };
  if (score >= 35) return { label: 'Below Average', color: '#d97706', bgClass: 'bg-amber-500' };
  return { label: 'Needs Improvement', color: '#dc2626', bgClass: 'bg-red-600' };
}

export function getScoreBarColor(score) {
  if (score >= 80) return 'bg-forest-800';
  if (score >= 65) return 'bg-forest-600';
  if (score >= 50) return 'bg-lime-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getScoreColorClass(score) {
  if (score >= 80) return 'text-forest-800';
  if (score >= 65) return 'text-forest-600';
  if (score >= 50) return 'text-lime-600';
  if (score >= 35) return 'text-amber-600';
  return 'text-red-600';
}

const CATEGORY_MAP = {
  electricity: { label: 'Electricity', icon: '⚡', color: 'yellow', weight: 18 },
  transport: { label: 'Transportation', icon: '🚗', color: 'blue', weight: 18 },
  food: { label: 'Food & Diet', icon: '🍽️', color: 'orange', weight: 16 },
  water: { label: 'Water Usage', icon: '💧', color: 'cyan', weight: 14 },
  waste: { label: 'Waste & Recycling', icon: '♻️', color: 'green', weight: 14 },
  shopping: { label: 'Shopping & Digital', icon: '📦', color: 'purple', weight: 10 },
  green: { label: 'Green Habits', icon: '🌿', color: 'emerald', weight: 10 },
};

export function getCategoryLabel(key) {
  return CATEGORY_MAP[key]?.label || key;
}

export function getCategoryIcon(key) {
  return CATEGORY_MAP[key]?.icon || '📊';
}

export function getCategoryColor(key) {
  return CATEGORY_MAP[key]?.color || 'gray';
}

export function getCategoryWeight(key) {
  return CATEGORY_MAP[key]?.weight || 0;
}

export function formatAgeGroup(val) {
  const map = { under_18: 'Under 18', '18_25': '18–25', '26_35': '26–35', '36_50': '36–50', above_50: 'Above 50' };
  return map[val] || val || 'Not specified';
}

export function formatGender(val) {
  const map = { male: 'Male', female: 'Female', other: 'Other', prefer_not: 'Not specified' };
  return map[val] || val || 'Not specified';
}

export function formatState(val) {
  const map = { TN: 'Tamil Nadu', PY: 'Puducherry', OTHER: 'Other' };
  return map[val] || val || 'Not specified';
}

export function getReportDate() {
  const d = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatCO2(kgValue) {
  if (kgValue >= 1000) return `${(kgValue / 1000).toFixed(2)} tonnes`;
  return `${Math.round(kgValue)} kg`;
}

export function formatWater(litres) {
  if (litres >= 1000) return `${(litres / 1000).toFixed(1)} kL`;
  return `${Math.round(litres)} litres`;
}

export function formatINR(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function isYesValue(val) {
  return val === true || val === 'yes' || val === 'Yes';
}
