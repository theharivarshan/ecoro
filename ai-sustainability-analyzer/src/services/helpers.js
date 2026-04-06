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
  transport: { label: 'Transportation', icon: '🚗', color: 'blue' },
  electricity: { label: 'Electricity', icon: '⚡', color: 'yellow' },
  food: { label: 'Food & Diet', icon: '🍽️', color: 'orange' },
  waste: { label: 'Waste Management', icon: '♻️', color: 'green' },
  water: { label: 'Water Usage', icon: '💧', color: 'cyan' },
  lifestyle: { label: 'Lifestyle', icon: '🛍️', color: 'purple' },
  pollution: { label: 'Pollution', icon: '🌫️', color: 'gray' },
  bonus: { label: 'Green Bonus', icon: '🌿', color: 'emerald' },
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

export function formatAgeGroup(val) {
  const map = { under_18: 'Under 18', '18_25': '18-25', '26_35': '26-35', '36_50': '36-50', above_50: 'Above 50' };
  return map[val] || val || 'Not specified';
}

export function formatCityType(val) {
  const map = { metro: 'Metro City', tier2: 'Tier 2 City', tier3: 'Tier 3 City', rural: 'Rural Area' };
  return map[val] || val || 'Not specified';
}

export function formatLivingType(val) {
  const map = { apartment: 'Apartment', independent_house: 'Independent House', hostel: 'Hostel', pg: 'PG Accommodation' };
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

export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

const WEIGHTS = {
  transport: 20, electricity: 15, food: 15, waste: 15,
  water: 10, lifestyle: 10, pollution: 10, bonus: 5,
};

export function getCategoryWeight(key) {
  return WEIGHTS[key] || 0;
}
