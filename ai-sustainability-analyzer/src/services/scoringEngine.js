import REAL_DATA from '../data/realWorldData.js';

const WEIGHTS = {
  transport: 20,
  electricity: 15,
  food: 15,
  waste: 15,
  water: 10,
  lifestyle: 10,
  pollution: 10,
  bonus: 5,
};

function clamp(val, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, val)));
}

function scoreTransport(a) {
  let score = 50;
  const walkKm = Number(a.walkingCyclingKm) || 0;
  const busKm = Number(a.busMetroTrainKm) || 0;
  const petrol2wKm = Number(a.petrolTwoWheelerKm) || 0;
  const petrolCarKm = Number(a.petrolCarKm) || 0;
  const dieselCarKm = Number(a.dieselCarKm) || 0;

  // Positive: green modes
  score += Math.min(walkKm * 0.5, 12);
  score += Math.min(busKm * 0.08, 8);

  // Negative: fossil fuel (penalties proportional to real CO2 per km)
  score -= Math.min(petrol2wKm * 0.06, 15); // 92g CO₂/km
  score -= Math.min(petrolCarKm * 0.10, 20); // 155g CO₂/km
  score -= Math.min(dieselCarKm * 0.12, 20); // 168g CO₂/km

  // Deliveries
  const del = a.weeklyDeliveries;
  if (del === '8+') score -= 10;
  else if (del === '5-7') score -= 6;
  else if (del === '3-4') score -= 3;
  else if (del === '1-2') score -= 1;

  // Carpooling
  const cp = a.carpooling;
  if (cp === 'always') score += 5;
  else if (cp === 'often') score += 3;
  else if (cp === 'rarely') score -= 3;
  else if (cp === 'never_drive') score += 2;

  return clamp(score);
}

function scoreElectricity(a) {
  let score = 70;
  const acHrs = Number(a.acHoursPerWeek) || 0;
  const geyserHrs = Number(a.geyserHoursPerWeek) || 0;
  const tvHrs = Number(a.tvHoursPerWeek) || 0;
  const fanHrs = Number(a.fanHoursPerDay) || 0;
  const washLoads = Number(a.washingLoadsPerWeek) || 0;

  // AC penalty (1.55 kWh/hr - heaviest residential load)
  if (acHrs > 42) score -= 25;
  else if (acHrs > 28) score -= 18;
  else if (acHrs > 14) score -= 10;
  else if (acHrs > 7) score -= 4;

  // Geyser (2.0 kWh/hr)
  if (geyserHrs > 10) score -= 15;
  else if (geyserHrs > 5) score -= 8;
  else if (geyserHrs > 2) score -= 3;

  // TV
  if (tvHrs > 35) score -= 8;
  else if (tvHrs > 21) score -= 4;
  else if (tvHrs > 14) score -= 2;

  // Fan
  if (fanHrs > 20) score -= 5;
  else if (fanHrs > 14) score -= 2;

  // Washing
  if (washLoads >= 7) score -= 10;
  else if (washLoads >= 5) score -= 7;
  else if (washLoads >= 3) score -= 3;

  // Positive behaviors
  if (a.ledBulbsUsed === true || a.ledBulbsUsed === 'yes') score += 10;
  if (a.solarAvailable === true || a.solarAvailable === 'yes') score += 15;
  if (a.efficientAppliances === true || a.efficientAppliances === 'yes') score += 8;

  return clamp(score);
}

function scoreFood(a) {
  let score = 65;
  const vegMeals = Number(a.vegMealsPerWeek) || 0;
  const nonVegMeals = Number(a.nonVegMealsPerWeek) || 0;

  // Veg bonus (0.7 kg CO₂e per veg meal vs 2.4 for chicken)
  score += Math.min((vegMeals / 21) * 15, 15);

  // Non-veg penalty
  score -= Math.min(nonVegMeals * 1.5, 18);

  // Food delivery
  const fd = a.foodDeliveryPerWeek;
  if (fd === 'daily') score -= 15;
  else if (fd === '5-7') score -= 10;
  else if (fd === '3-4') score -= 6;
  else if (fd === '1-2') score -= 2;

  // Packaged food
  const pf = a.packagedFoodUsage;
  if (pf === 'always') score -= 12;
  else if (pf === 'often') score -= 7;
  else if (pf === 'sometimes') score -= 3;

  // Food waste (India wastes 68 kg/person/year - FAO)
  const fw = a.foodWasteLevel;
  if (fw === 'high') score -= 15;
  else if (fw === 'moderate') score -= 7;
  else if (fw === 'small') score -= 2;
  else if (fw === 'none') score += 5;

  // Local food
  const lf = a.localFoodPreference;
  if (lf === 'always') score += 8;
  else if (lf === 'often') score += 5;
  else if (lf === 'sometimes') score += 2;

  // Bottled water
  const bw = a.bottledWaterUsage;
  if (bw === 'daily') score -= 10;
  else if (bw === 'weekly') score -= 5;
  else if (bw === 'sometimes') score -= 2;
  else if (bw === 'never') score += 3;

  return clamp(score);
}

function scoreWater(a) {
  let score = 70;

  // Bath type (real litres from REAL_DATA)
  const bt = a.bathType;
  if (bt === 'bucket') score += 15;        // 12L
  else if (bt === 'short_shower') score += 5; // 35L
  else if (bt === 'medium_shower') score -= 5; // 70L
  else if (bt === 'long_shower') score -= 15;  // 120L
  else if (bt === 'bath_tub') score -= 20;     // 180L

  // Laundry (130L per top-load)
  const laundry = Number(a.laundryLoadsPerWeek) || 0;
  if (laundry >= 7) score -= 12;
  else if (laundry >= 5) score -= 7;
  else if (laundry >= 3) score -= 3;

  // Vehicle wash (hose=175L vs bucket=20L)
  const vw = a.vehicleWashFrequency;
  if (vw === 'multiple_week') score -= 15;
  else if (vw === 'weekly') score -= 10;
  else if (vw === 'biweekly') score -= 5;
  else if (vw === 'monthly') score -= 1;
  else if (vw === 'never') score += 3;

  if (a.waterReuseHabits === true || a.waterReuseHabits === 'yes') score += 10;
  if (a.rainwaterHarvesting === true || a.rainwaterHarvesting === 'yes') score += 15;
  if (a.leakageAwareness === true || a.leakageAwareness === 'yes') score += 5;

  return clamp(score);
}

function scoreWaste(a) {
  let score = 55; // India only processes 24% of solid waste

  if (a.segregationPracticed === true || a.segregationPracticed === 'yes') score += 20;
  if (a.compostingPracticed === true || a.compostingPracticed === 'yes') score += 15;

  const cb = a.clothBagUsage;
  if (cb === 'always') score += 10;
  else if (cb === 'often') score += 6;
  else if (cb === 'sometimes') score += 2;
  else if (cb === 'rarely') score -= 5;

  const sup = a.singleUsePlastic;
  if (sup === 'never') score += 5;
  else if (sup === 'rarely') score -= 1;
  else if (sup === 'sometimes') score -= 5;
  else if (sup === 'often') score -= 12;
  else if (sup === 'always') score -= 18;

  const rh = a.reuseHabit;
  if (rh === 'always') score += 10;
  else if (rh === 'often') score += 6;
  else if (rh === 'sometimes') score += 2;
  else if (rh === 'rarely') score -= 3;

  const ew = a.eWasteDisposal;
  if (ew === 'proper_recycler') score += 7;
  else if (ew === 'kabadiwala') score += 3;
  else if (ew === 'trash') score -= 8;
  else if (ew === 'stored') score -= 2;

  const pl = a.plasticLevel;
  if (pl === 'very_low') score += 5;
  else if (pl === 'low') score += 2;
  else if (pl === 'moderate') score -= 3;
  else if (pl === 'high') score -= 10;

  return clamp(score);
}

function scoreLifestyle(a) {
  let score = 75;
  const screenHrs = Number(a.screenTimeHours) || 0;
  const streamHrs = Number(a.streamingHoursPerWeek) || 0;

  if (screenHrs > 10) score -= 18;
  else if (screenHrs > 8) score -= 13;
  else if (screenHrs > 6) score -= 8;
  else if (screenHrs > 4) score -= 4;
  else if (screenHrs <= 2) score += 5;

  if (streamHrs > 35) score -= 10;
  else if (streamHrs > 21) score -= 6;
  else if (streamHrs > 14) score -= 3;

  const os = a.onlineShoppingFrequency;
  if (os === 'multiple_week') score -= 15;
  else if (os === 'weekly') score -= 10;
  else if (os === 'biweekly') score -= 5;
  else if (os === 'monthly') score -= 2;

  const ff = a.fastFashionFrequency;
  if (ff === 'frequent') score -= 15;
  else if (ff === 'monthly') score -= 8;
  else if (ff === 'seasonal') score -= 3;
  else if (ff === 'rarely') score += 5;

  // Clothes drying (replaces standbyDevices)
  const cd = a.clothesDrying;
  if (cd === 'sun_dry') score += 5;
  else if (cd === 'machine_dryer') score -= 10;
  else if (cd === 'mix') score -= 4;

  return clamp(score);
}

function scorePollution(a) {
  let score = 80;

  const wb = a.wasteBurning;
  if (wb === 'often') score -= 30;
  else if (wb === 'sometimes') score -= 18;
  else if (wb === 'rarely') score -= 8;

  const vi = a.vehicleIdling;
  if (vi === 'often') score -= 15;
  else if (vi === 'sometimes') score -= 8;
  else if (vi === 'rarely') score -= 3;
  else if (vi === 'never') score += 5;

  const ch = a.chemicalProducts;
  if (ch === 'often') score -= 10;
  else if (ch === 'sometimes') score -= 5;
  else if (ch === 'rarely') score -= 1;
  else if (ch === 'natural_only') score += 5;

  const lt = a.littering;
  if (lt === 'often') score -= 20;
  else if (lt === 'sometimes') score -= 10;
  else if (lt === 'rarely') score -= 3;
  else if (lt === 'never') score += 5;

  const fc = a.firecrackerUsage;
  if (fc === 'heavy') score -= 15;
  else if (fc === 'moderate') score -= 8;
  else if (fc === 'minimal') score -= 2;
  else if (fc === 'none') score += 5;

  return clamp(score);
}

function scoreBonus(a) {
  let score = 20;
  const toggles = [
    'publicTransportPreference',
    'reusableBottleUsage',
    'treePlantCare',
    'repairInsteadOfReplace',
    'communityParticipation',
    'sustainabilityAwareness',
  ];
  toggles.forEach(key => {
    if (a[key] === true || a[key] === 'yes') score += 15;
  });
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
  const petrol2wKm = Number(a.petrolTwoWheelerKm) || 0;
  const petrolCarKm = Number(a.petrolCarKm) || 0;
  const dieselCarKm = Number(a.dieselCarKm) || 0;
  const acHrs = Number(a.acHoursPerWeek) || 0;
  const deliveries = a.foodDeliveryPerWeek;

  const totalFossilKm = petrol2wKm + petrolCarKm + dieselCarKm;
  if (totalFossilKm > 0) {
    const weeklyKg = (petrol2wKm * REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM +
      petrolCarKm * REAL_DATA.PETROL_CAR_CO2_PER_KM +
      dieselCarKm * REAL_DATA.DIESEL_CAR_CO2_PER_KM) / 1000;
    const yearlyTonnes = (weeklyKg * 52 / 1000).toFixed(2);
    impacts.push(`You travel ${totalFossilKm} km/week by fossil fuel vehicles → emits ~${weeklyKg.toFixed(1)} kg CO₂/week (${yearlyTonnes} tonnes/year)`);
  }

  if (acHrs > 0) {
    const weeklyKwh = (acHrs * REAL_DATA.AC_1P5TON_3STAR_KWH_PER_HR).toFixed(1);
    const weeklyCO2 = (acHrs * REAL_DATA.AC_1P5TON_3STAR_KWH_PER_HR * REAL_DATA.INDIA_GRID_CO2_INTENSITY).toFixed(1);
    impacts.push(`Your AC usage of ${acHrs} hrs/week consumes ~${weeklyKwh} kWh and emits ~${weeklyCO2} kg CO₂/week`);
  }

  const bt = a.bathType;
  const bathLitres = bt === 'bucket' ? 12 : bt === 'short_shower' ? 35 : bt === 'medium_shower' ? 70 : bt === 'long_shower' ? 120 : bt === 'bath_tub' ? 180 : 0;
  if (bathLitres > 12 && bt) {
    const pctMore = (((bathLitres - 12) / 12) * 100).toFixed(0);
    impacts.push(`Your bathing method uses ~${bathLitres} litres/bath vs bucket's 12 litres — ${pctMore}% more water`);
  }

  let delCount = 0;
  if (deliveries === 'daily') delCount = 7;
  else if (deliveries === '5-7') delCount = 6;
  else if (deliveries === '3-4') delCount = 3.5;
  else if (deliveries === '1-2') delCount = 1.5;
  if (delCount > 0) {
    const yearlyKg = (delCount * REAL_DATA.FOOD_DELIVERY_EXTRA_CO2E_KG * 52).toFixed(1);
    impacts.push(`${delCount} food delivery orders/week adds ~${yearlyKg} kg CO₂e/year from packaging and last-mile delivery`);
  }

  const segregation = a.segregationPracticed;
  if (segregation !== true && segregation !== 'yes') {
    impacts.push(`Not segregating waste contributes to the 76% of Indian solid waste that goes unprocessed (CPCB 2022)`);
  }

  return impacts.slice(0, 5);
}

export function calculateScore(answers) {
  const categoryScores = {
    transport: scoreTransport(answers),
    electricity: scoreElectricity(answers),
    food: scoreFood(answers),
    waste: scoreWaste(answers),
    water: scoreWater(answers),
    lifestyle: scoreLifestyle(answers),
    pollution: scorePollution(answers),
    bonus: scoreBonus(answers),
  };

  const weightedScores = {};
  let totalWeighted = 0;
  Object.keys(WEIGHTS).forEach(cat => {
    weightedScores[cat] = (categoryScores[cat] * WEIGHTS[cat]) / 100;
    totalWeighted += weightedScores[cat];
  });

  const finalScore = clamp(Math.round(totalWeighted));
  const scoreBand = getScoreBand(finalScore);

  // Find strengths and weaknesses
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
  };
}

export function simulateImprovedScore(answers, changes) {
  const modified = { ...answers };

  changes.forEach(change => {
    switch (change) {
      case 'reduce_ac':
        modified.acHoursPerWeek = Math.max(0, (Number(modified.acHoursPerWeek) || 0) / 2);
        break;
      case 'switch_to_led':
        modified.ledBulbsUsed = 'yes';
        break;
      case 'use_public_transport':
        modified.petrolCarKm = Math.max(0, (Number(modified.petrolCarKm) || 0) * 0.3);
        modified.busMetroTrainKm = (Number(modified.busMetroTrainKm) || 0) + 50;
        break;
      case 'start_segregation':
        modified.segregationPracticed = 'yes';
        break;
      case 'reduce_food_delivery':
        modified.foodDeliveryPerWeek = '1-2';
        break;
      case 'reusable_bags':
        modified.clothBagUsage = 'always';
        modified.singleUsePlastic = 'never';
        break;
      case 'bucket_bath':
        modified.bathType = 'bucket';
        break;
      case 'stop_idling':
        modified.vehicleIdling = 'never';
        break;
      case 'reduce_fast_fashion':
        modified.fastFashionFrequency = 'rarely';
        break;
      case 'stop_waste_burning':
        modified.wasteBurning = 'never';
        break;
    }
  });

  return calculateScore(modified);
}
