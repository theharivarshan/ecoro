import REAL_DATA from '../data/realWorldData.js';

const WEIGHTS = {
  electricity: 18,
  transport: 18,
  food: 16,
  water: 14,
  waste: 14,
  shopping: 10,
  green: 10,
};

function clamp(val, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, val)));
}

// ── Get approximate monthly bill midpoint ──
function getBillMidpoint(range) {
  const map = { '0-300': 150, '300-700': 500, '700-1500': 1100, '1500-3000': 2250, '3000-5000': 4000, '5000+': 6500 };
  return map[range] || 500;
}

function getFuelMidpoint(range) {
  const map = { '0': 0, '1-1000': 500, '1000-2500': 1750, '2500-5000': 3750, '5000-10000': 7500, '10000+': 12000 };
  return map[range] || 0;
}

// ── Scoring Functions ──

function scoreElectricity(a) {
  let score = 65;

  // Monthly bill → higher bill = more consumption = lower score
  const bill = getBillMidpoint(a.monthlyElectricityBill);
  if (bill <= 300) score += 15;
  else if (bill <= 700) score += 8;
  else if (bill <= 1500) score -= 5;
  else if (bill <= 3000) score -= 15;
  else if (bill <= 5000) score -= 25;
  else score -= 35;

  // AC usage
  const ac = a.acUsage;
  if (ac === 'no') score += 10;
  else if (ac === 'rarely') score += 5;
  else if (ac === 'moderate') score -= 3;
  else if (ac === 'daily_few') score -= 10;
  else if (ac === 'daily_long') score -= 20;

  // Geyser usage (times/month)
  const geyser = a.geyserUsage;
  if (geyser === '0') score += 5;
  else if (geyser === '1-10') score -= 2;
  else if (geyser === '10-20') score -= 6;
  else if (geyser === '20-30') score -= 12;
  else if (geyser === '30+') score -= 18;

  // BEE star rating
  const rating = a.applianceRating;
  if (rating === '5star') score += 10;
  else if (rating === '3star') score += 3;
  else if (rating === 'old') score -= 8;

  // Positive behaviors
  if (a.solarPanels === true || a.solarPanels === 'yes') score += 15;
  if (a.ledBulbs === true || a.ledBulbs === 'yes') score += 8;

  return clamp(score);
}

function scoreTransport(a) {
  let score = 55;

  // Vehicle type
  const v = a.vehicleType;
  if (v === 'walk_cycle' || v === 'none') score += 25;
  else if (v === 'public') score += 18;
  else if (v === 'ev_2w') score += 12;
  else if (v === 'ev_car') score += 8;
  else if (v === 'petrol_2w') score -= 5;
  else if (v === 'petrol_car') score -= 12;
  else if (v === 'diesel_car') score -= 18;

  // Monthly fuel spend → CO₂ calculation
  const fuelSpend = getFuelMidpoint(a.monthlyFuelSpend);
  if (fuelSpend === 0) score += 5;
  else if (fuelSpend <= 1000) score -= 2;
  else if (fuelSpend <= 2500) score -= 8;
  else if (fuelSpend <= 5000) score -= 15;
  else if (fuelSpend <= 10000) score -= 22;
  else score -= 30;

  // Daily commute distance
  const commute = a.dailyCommuteKm;
  if (commute === 'wfh' || commute === '0-2') score += 8;
  else if (commute === '2-5') score += 3;
  else if (commute === '5-15') score -= 3;
  else if (commute === '15-30') score -= 8;
  else if (commute === '30+') score -= 15;

  // Public transport usage
  const pt = a.publicTransportUsage;
  if (pt === 'daily') score += 12;
  else if (pt === 'few_week') score += 7;
  else if (pt === 'few_month') score += 3;
  else if (pt === 'rarely') score -= 2;
  else if (pt === 'never') score -= 5;

  // Carpooling
  const cp = a.carpooling;
  if (cp === 'regularly') score += 5;
  else if (cp === 'sometimes') score += 2;
  else if (cp === 'no_vehicle') score += 3;

  return clamp(score);
}

function scoreFood(a) {
  let score = 60;

  // Diet type
  const diet = a.dietType;
  if (diet === 'vegan') score += 20;
  else if (diet === 'veg') score += 15;
  else if (diet === 'eggetarian') score += 10;
  else if (diet === 'non_veg_occasional') score += 2;
  else if (diet === 'non_veg_regular') score -= 8;
  else if (diet === 'non_veg_daily') score -= 18;

  // Food ordering frequency
  const orders = a.monthlyFoodOrdering;
  if (orders === '0') score += 10;
  else if (orders === '1-4') score += 3;
  else if (orders === '5-10') score -= 5;
  else if (orders === '10-20') score -= 12;
  else if (orders === '20+') score -= 20;

  // Food spend (proxy for packaging and delivery impact)
  const spend = a.monthlyFoodSpend;
  if (spend === '0') score += 5;
  else if (spend === '1-1000') score += 2;
  else if (spend === '1000-3000') score -= 3;
  else if (spend === '3000-5000') score -= 8;
  else if (spend === '5000+') score -= 15;

  // Food waste
  const waste = a.foodWaste;
  if (waste === 'almost_none') score += 8;
  else if (waste === 'little') score += 2;
  else if (waste === 'moderate') score -= 5;
  else if (waste === 'significant') score -= 15;

  // Local food preference
  const local = a.localFood;
  if (local === 'always') score += 8;
  else if (local === 'mostly') score += 5;
  else if (local === 'sometimes') score += 1;
  else if (local === 'rarely') score -= 5;

  return clamp(score);
}

function scoreWater(a) {
  let score = 65;

  // Bathing method
  const bath = a.bathingMethod;
  if (bath === 'bucket') score += 15;
  else if (bath === 'both') score += 5;
  else if (bath === 'short_shower') score -= 5;
  else if (bath === 'long_shower') score -= 18;

  // Washing machine frequency
  const wash = a.washingFrequency;
  if (wash === '0') score += 8;
  else if (wash === '1-4') score += 3;
  else if (wash === '5-8') score -= 3;
  else if (wash === '8-12') score -= 8;
  else if (wash === '12+') score -= 15;

  // Tap habit
  if (a.tapHabit === true || a.tapHabit === 'yes') score += 10;
  else score -= 8;

  // Water reuse
  if (a.waterReuse === true || a.waterReuse === 'yes') score += 10;

  // Leak fixing
  if (a.leakFixing === true || a.leakFixing === 'yes') score += 5;

  return clamp(score);
}

function scoreWaste(a) {
  let score = 50;

  // Dustbin fill frequency (less = better)
  const fill = a.wasteFillDays;
  if (fill === 'longer') score += 15;
  else if (fill === 'weekly') score += 8;
  else if (fill === '2-3days') score -= 2;
  else if (fill === 'daily') score -= 10;

  // Segregation
  if (a.wasteSegregation === true || a.wasteSegregation === 'yes') score += 20;

  // Plastic usage
  const plastic = a.plasticUsage;
  if (plastic === 'never') score += 10;
  else if (plastic === 'rarely') score += 4;
  else if (plastic === 'sometimes') score -= 5;
  else if (plastic === 'often') score -= 15;

  // E-waste disposal
  const ew = a.eWaste;
  if (ew === 'recycler') score += 8;
  else if (ew === 'kabadiwala') score += 4;
  else if (ew === 'trash') score -= 10;
  else if (ew === 'stored') score -= 2;

  // Composting
  if (a.composting === true || a.composting === 'yes') score += 15;

  return clamp(score);
}

function scoreShopping(a) {
  let score = 70;

  // Online orders per month
  const orders = a.onlineOrdersPerMonth;
  if (orders === '0') score += 10;
  else if (orders === '1-3') score += 3;
  else if (orders === '4-8') score -= 5;
  else if (orders === '8-15') score -= 12;
  else if (orders === '15+') score -= 22;

  // Return frequency
  const ret = a.returnFrequency;
  if (ret === 'never') score += 5;
  else if (ret === 'sometimes') score -= 5;
  else if (ret === 'often') score -= 15;

  // Clothes buying
  const clothes = a.clothesBuyingFrequency;
  if (clothes === 'rarely') score += 8;
  else if (clothes === 'seasonal') score += 2;
  else if (clothes === 'quarterly') score -= 5;
  else if (clothes === 'monthly') score -= 15;

  // Internet usage
  const internet = a.internetUsageHrs;
  if (internet === '1-3') score += 5;
  else if (internet === '3-6') score -= 2;
  else if (internet === '6-10') score -= 8;
  else if (internet === '10+') score -= 15;

  // Streaming
  const stream = a.streamingHours;
  if (stream === '0-1') score += 3;
  else if (stream === '1-3') score -= 2;
  else if (stream === '3-5') score -= 8;
  else if (stream === '5+') score -= 15;

  return clamp(score);
}

function scoreGreen(a) {
  let score = 25;

  // Plants
  const plants = a.plantsAtHome;
  if (plants === 'garden') score += 20;
  else if (plants === 'balcony') score += 14;
  else if (plants === 'few') score += 7;

  // Plant count bonus
  const count = Number(a.plantCount) || 0;
  score += Math.min(count * 0.5, 10);

  // Repair vs replace
  const repair = a.repairOrReplace;
  if (repair === 'always_repair') score += 15;
  else if (repair === 'mostly_repair') score += 10;
  else if (repair === 'depends') score += 4;
  else if (repair === 'usually_replace') score -= 5;

  // Toggle bonuses
  if (a.reusableBags === true || a.reusableBags === 'yes') score += 8;
  if (a.reusableBottle === true || a.reusableBottle === 'yes') score += 6;
  if (a.communityGreen === true || a.communityGreen === 'yes') score += 10;
  if (a.sustainabilityAwareness === true || a.sustainabilityAwareness === 'yes') score += 6;

  return clamp(score);
}

function getScoreBand(score) {
  if (score >= 80) return { label: 'Excellent', color: '#064e3b', emoji: '🌟' };
  if (score >= 65) return { label: 'Good', color: '#16a34a', emoji: '🌿' };
  if (score >= 50) return { label: 'Average', color: '#84cc16', emoji: '🌱' };
  if (score >= 35) return { label: 'Below Average', color: '#d97706', emoji: '⚠️' };
  return { label: 'Needs Improvement', color: '#dc2626', emoji: '🔴' };
}

function buildImpactSummary(a) {
  const impacts = [];
  const state = a.state || 'TN';

  // Electricity impact
  const bill = getBillMidpoint(a.monthlyElectricityBill);
  const monthlyUnits = REAL_DATA.unitsFromBill(bill, state);
  const monthlyCO2 = (monthlyUnits * REAL_DATA.INDIA_GRID_CO2_INTENSITY).toFixed(1);
  impacts.push(`Your electricity usage is ~${monthlyUnits} units/month → ${monthlyCO2} kg CO₂/month (${(monthlyCO2 * 12 / 1000).toFixed(2)} tonnes/year)`);

  // Fuel/transport impact
  const fuelSpend = getFuelMidpoint(a.monthlyFuelSpend);
  if (fuelSpend > 0) {
    const pricePerLitre = a.vehicleType === 'diesel_car' ? REAL_DATA.DIESEL_PRICE_PER_LITRE : REAL_DATA.PETROL_PRICE_PER_LITRE;
    const litres = fuelSpend / pricePerLitre;
    const co2PerLitre = a.vehicleType === 'diesel_car' ? REAL_DATA.DIESEL_CO2_PER_LITRE : REAL_DATA.PETROL_CO2_PER_LITRE;
    const monthlyCO2Transport = (litres * co2PerLitre).toFixed(1);
    impacts.push(`Fuel spend ₹${fuelSpend}/month → ~${litres.toFixed(1)}L → ${monthlyCO2Transport} kg CO₂/month`);
  }

  // Food delivery impact
  const orderMap = { '0': 0, '1-4': 2.5, '5-10': 7.5, '10-20': 15, '20+': 25 };
  const foodOrders = orderMap[a.monthlyFoodOrdering] || 0;
  if (foodOrders > 0) {
    const deliveryCO2 = (foodOrders * REAL_DATA.FOOD_DELIVERY_CO2E_PER_ORDER).toFixed(1);
    impacts.push(`${foodOrders} food orders/month adds ~${deliveryCO2} kg CO₂e/month from packaging and delivery`);
  }

  // Water impact
  const bathMap = { bucket: 15, short_shower: 40, long_shower: 75, both: 28 };
  const bathLitres = bathMap[a.bathingMethod] || 28;
  const dailyWater = bathLitres + 30 + 20; // bath + cooking/cleaning + flushing etc.
  impacts.push(`Your bathing uses ~${bathLitres}L/day. BIS recommends total 135L/person/day — you use ~${dailyWater}L/day estimated`);

  // Online shopping
  const orderCountMap = { '0': 0, '1-3': 2, '4-8': 6, '8-15': 11, '15+': 18 };
  const onlineOrders = orderCountMap[a.onlineOrdersPerMonth] || 0;
  if (onlineOrders > 0) {
    impacts.push(`${onlineOrders} online orders/month = ${(onlineOrders * REAL_DATA.DELIVERY_PACKAGING_CO2E_KG).toFixed(1)} kg CO₂e/month from packaging + transport`);
  }

  return impacts.slice(0, 5);
}

// Calculate % Earth impact
function calcEarthImpactPercent(totalCO2Tonnes) {
  // India total: 2.88 billion tonnes, population ~1.4 billion
  // Individual share of India's CO₂ = personal / national total × 100
  const indiaTotalKg = REAL_DATA.INDIA_CO2_BILLION_TONNES_2022 * 1e9;
  const personalKg = totalCO2Tonnes * 1000;
  const pct = (personalKg / indiaTotalKg) * 100;
  return pct.toExponential(2);
}

export function calculateScore(answers) {
  const categoryScores = {
    electricity: scoreElectricity(answers),
    transport: scoreTransport(answers),
    food: scoreFood(answers),
    water: scoreWater(answers),
    waste: scoreWaste(answers),
    shopping: scoreShopping(answers),
    green: scoreGreen(answers),
  };

  let totalWeighted = 0;
  const weightedScores = {};
  Object.keys(WEIGHTS).forEach(cat => {
    weightedScores[cat] = (categoryScores[cat] * WEIGHTS[cat]) / 100;
    totalWeighted += weightedScores[cat];
  });

  const finalScore = clamp(Math.round(totalWeighted));
  const scoreBand = getScoreBand(finalScore);

  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 3).map(([cat, score]) => ({ category: cat, score }));
  const weaknesses = sorted.slice(-3).reverse().map(([cat, score]) => ({ category: cat, score }));

  const impactSummary = buildImpactSummary(answers);

  return {
    finalScore,
    scoreBand,
    categoryScores,
    weightedScores,
    strengths,
    weaknesses,
    impactSummary,
    earthImpactPercent: null, // filled by yearly estimator
  };
}

export function simulateImprovedScore(answers, changes) {
  const modified = { ...answers };

  changes.forEach(change => {
    switch (change) {
      case 'reduce_electricity':
        // Simulate dropping one bill slab
        if (modified.monthlyElectricityBill === '5000+') modified.monthlyElectricityBill = '3000-5000';
        else if (modified.monthlyElectricityBill === '3000-5000') modified.monthlyElectricityBill = '1500-3000';
        else if (modified.monthlyElectricityBill === '1500-3000') modified.monthlyElectricityBill = '700-1500';
        break;
      case 'switch_public_transport':
        modified.publicTransportUsage = 'daily';
        modified.monthlyFuelSpend = '0';
        break;
      case 'reduce_food_orders':
        modified.monthlyFoodOrdering = '1-4';
        modified.monthlyFoodSpend = '1-1000';
        break;
      case 'bucket_bath':
        modified.bathingMethod = 'bucket';
        break;
      case 'start_segregation':
        modified.wasteSegregation = 'yes';
        modified.composting = 'yes';
        break;
      case 'reduce_online_shopping':
        modified.onlineOrdersPerMonth = '1-3';
        modified.returnFrequency = 'never';
        break;
      case 'grow_plants':
        modified.plantsAtHome = 'balcony';
        modified.plantCount = 10;
        break;
      case 'repair_first':
        modified.repairOrReplace = 'always_repair';
        break;
    }
  });

  return calculateScore(modified);
}
