import REAL_DATA from '../data/realWorldData.js';

function getBillMidpoint(range) {
  const map = { '0-300': 150, '300-700': 500, '700-1500': 1100, '1500-3000': 2250, '3000-5000': 4000, '5000+': 6500 };
  return map[range] || 500;
}

function getFuelMidpoint(range) {
  const map = { '0': 0, '1-1000': 500, '1000-2500': 1750, '2500-5000': 3750, '5000-10000': 7500, '10000+': 12000 };
  return map[range] || 0;
}

function getGeyserTimesPerMonth(range) {
  const map = { '0': 0, '1-10': 5, '10-20': 15, '20-30': 25, '30+': 35 };
  return map[range] || 0;
}

function getOrderCount(range) {
  const map = { '0': 0, '1-4': 2.5, '5-10': 7.5, '10-20': 15, '20+': 25 };
  return map[range] || 0;
}

function getOnlineOrderCount(range) {
  const map = { '0': 0, '1-3': 2, '4-8': 6, '8-15': 11, '15+': 18 };
  return map[range] || 0;
}

export function estimateYearly(answers, monthlyScore) {
  const a = answers;
  const state = a.state || 'TN';

  // ── ELECTRICITY (monthly × 12) ──
  const monthlyBill = getBillMidpoint(a.monthlyElectricityBill);
  const monthlyUnits = REAL_DATA.unitsFromBill(monthlyBill, state);
  const yearlyUnits = monthlyUnits * 12;
  const yearlyElectricityBill = monthlyBill * 12;
  const yearlyElectricityCO2Kg = yearlyUnits * REAL_DATA.INDIA_GRID_CO2_INTENSITY;

  // Geyser contribution estimate
  const geyserTimesMonth = getGeyserTimesPerMonth(a.geyserUsage);
  const geyserKwhYear = geyserTimesMonth * REAL_DATA.GEYSER_15L_KWH_PER_USE * 12;

  // ── TRANSPORT (monthly × 12) ──
  const monthlyFuelSpend = getFuelMidpoint(a.monthlyFuelSpend);
  const isDiesel = a.vehicleType === 'diesel_car';
  const pricePerLitre = isDiesel ? REAL_DATA.DIESEL_PRICE_PER_LITRE : REAL_DATA.PETROL_PRICE_PER_LITRE;
  const co2PerLitre = isDiesel ? REAL_DATA.DIESEL_CO2_PER_LITRE : REAL_DATA.PETROL_CO2_PER_LITRE;
  const monthlyLitres = monthlyFuelSpend > 0 ? monthlyFuelSpend / pricePerLitre : 0;

  // Mileage-based km calculation
  let mileage = REAL_DATA.MILEAGE_PETROL_CAR;
  if (a.vehicleType === 'petrol_2w') mileage = REAL_DATA.MILEAGE_PETROL_2W;
  else if (a.vehicleType === 'diesel_car') mileage = REAL_DATA.MILEAGE_DIESEL_CAR;
  const monthlyKmDriven = monthlyLitres * mileage;
  const yearlyKmDriven = monthlyKmDriven * 12;
  const yearlyTransportCO2Kg = monthlyLitres * co2PerLitre * 12;

  // ── FOOD (monthly × 12) ──
  // Diet-based CO₂
  const mealsPerDay = 3;
  const daysPerMonth = 30;
  let mealCO2PerMeal = REAL_DATA.VEG_MEAL_CO2E_KG;
  if (a.dietType === 'non_veg_daily') mealCO2PerMeal = (REAL_DATA.VEG_MEAL_CO2E_KG + REAL_DATA.CHICKEN_MEAL_CO2E_KG) / 2;
  else if (a.dietType === 'non_veg_regular') mealCO2PerMeal = REAL_DATA.VEG_MEAL_CO2E_KG * 0.7 + REAL_DATA.CHICKEN_MEAL_CO2E_KG * 0.3;
  else if (a.dietType === 'non_veg_occasional') mealCO2PerMeal = REAL_DATA.VEG_MEAL_CO2E_KG * 0.85 + REAL_DATA.CHICKEN_MEAL_CO2E_KG * 0.15;
  else if (a.dietType === 'eggetarian') mealCO2PerMeal = REAL_DATA.VEG_MEAL_CO2E_KG + REAL_DATA.EGG_CO2E_KG * 0.3;
  else if (a.dietType === 'vegan') mealCO2PerMeal = REAL_DATA.VEG_MEAL_CO2E_KG * 0.8;

  const yearlyDietCO2Kg = mealCO2PerMeal * mealsPerDay * daysPerMonth * 12;
  const monthlyFoodOrders = getOrderCount(a.monthlyFoodOrdering);
  const yearlyFoodDeliveryCO2Kg = monthlyFoodOrders * REAL_DATA.FOOD_DELIVERY_CO2E_PER_ORDER * 12;

  // ── WATER (daily → yearly) ──
  const bathMap = { bucket: 15, short_shower: 40, long_shower: 75, both: 28 };
  const bathLitresPerDay = bathMap[a.bathingMethod] || 28;
  const cookCleanPerDay = 30;
  const flushingPerDay = 40; // ~4 flushes × 10L
  const miscPerDay = 15; // hand washing, drinking etc.

  // Washing machine
  const washMap = { '0': 0, '1-4': 2.5, '5-8': 6.5, '8-12': 10, '12+': 14 };
  const washLoadsMonth = washMap[a.washingFrequency] || 0;
  const washLitresPerDay = (washLoadsMonth * REAL_DATA.WASHING_MACHINE_LITRES_PER_LOAD) / 30;

  const dailyWaterLitres = bathLitresPerDay + cookCleanPerDay + flushingPerDay + miscPerDay + washLitresPerDay;
  const yearlyWaterLitres = Math.round(dailyWaterLitres * 365);
  const dailyRecommended = REAL_DATA.INDIA_DAILY_WATER_PER_CAPITA_LITRES;
  const waterVsRecommended = ((dailyWaterLitres / dailyRecommended) * 100).toFixed(0);

  // ── ONLINE SHOPPING (monthly × 12) ──
  const monthlyOnlineOrders = getOnlineOrderCount(a.onlineOrdersPerMonth);
  const yearlyOnlineOrders = monthlyOnlineOrders * 12;
  const yearlyShoppingCO2Kg = yearlyOnlineOrders * REAL_DATA.DELIVERY_PACKAGING_CO2E_KG;
  // Returns
  const returnMultiplier = a.returnFrequency === 'often' ? 0.5 : a.returnFrequency === 'sometimes' ? 0.2 : 0;
  const yearlyReturnCO2Kg = yearlyOnlineOrders * returnMultiplier * REAL_DATA.RETURN_EXTRA_CO2E_KG;

  // ── WASTE ──
  const familyMap = { '1': 1, '2': 2, '3-4': 3.5, '5+': 5.5 };
  const familySize = familyMap[a.familySize] || 3;
  const perPersonWasteKgDay = REAL_DATA.AVG_HOUSEHOLD_WASTE_KG_PER_DAY;
  const yearlyWasteKg = perPersonWasteKgDay * 365;
  const yearlyWasteCO2Kg = (a.wasteSegregation === 'yes' || a.wasteSegregation === true)
    ? yearlyWasteKg * REAL_DATA.METHANE_FROM_LANDFILL_KG_CO2E_PER_KG * 0.4 // segregation reduces landfill methane
    : yearlyWasteKg * REAL_DATA.METHANE_FROM_LANDFILL_KG_CO2E_PER_KG;

  // ── PLANTS OFFSET ──
  const plantCount = Number(a.plantCount) || 0;
  let plantOffset = 0;
  if (a.plantsAtHome === 'garden') plantOffset = REAL_DATA.BALCONY_GARDEN_CO2_OFFSET_KG_PER_YEAR + plantCount * REAL_DATA.INDOOR_PLANT_CO2_ABSORPTION_KG_PER_YEAR;
  else if (a.plantsAtHome === 'balcony') plantOffset = plantCount * REAL_DATA.INDOOR_PLANT_CO2_ABSORPTION_KG_PER_YEAR;
  else if (a.plantsAtHome === 'few') plantOffset = plantCount * REAL_DATA.INDOOR_PLANT_CO2_ABSORPTION_KG_PER_YEAR;

  // ── TOTAL CO₂ ──
  const totalCO2KgYear = Math.round(
    yearlyElectricityCO2Kg +
    yearlyTransportCO2Kg +
    yearlyDietCO2Kg +
    yearlyFoodDeliveryCO2Kg +
    yearlyShoppingCO2Kg +
    yearlyReturnCO2Kg +
    yearlyWasteCO2Kg -
    plantOffset
  );
  const totalCO2Tonnes = (totalCO2KgYear / 1000).toFixed(2);
  const indiaAvg = REAL_DATA.INDIA_PER_CAPITA_CO2_TONNES;
  const globalAvg = REAL_DATA.GLOBAL_PER_CAPITA_CO2_TONNES;
  const diffFromIndia = ((totalCO2KgYear / 1000 - indiaAvg) / indiaAvg * 100).toFixed(1);

  // Earth impact % (your share of India's emissions)
  const earthImpactPercent = (totalCO2KgYear / (REAL_DATA.INDIA_CO2_BILLION_TONNES_2022 * 1e9) * 100);

  // Projected annual score (seasonal adjustment)
  const isACUser = a.acUsage === 'daily_few' || a.acUsage === 'daily_long';
  const isGeyserUser = a.geyserUsage === '20-30' || a.geyserUsage === '30+';
  const summerAdj = isACUser ? -3 : 0;
  const winterAdj = isGeyserUser ? -1 : 0;
  const seasonalAdj = (summerAdj * 4 + 2 * 3 + winterAdj * 5) / 12;
  const projectedAnnualScore = Math.round(Math.min(100, Math.max(0, monthlyScore + Math.max(-2, Math.min(2, seasonalAdj)))));

  // Risk patterns
  const riskPatterns = [];
  if (yearlyTransportCO2Kg > 1200) riskPatterns.push({ area: 'Transport CO₂', level: 'HIGH', detail: `${Math.round(yearlyTransportCO2Kg)} kg/year` });
  else if (yearlyTransportCO2Kg > 500) riskPatterns.push({ area: 'Transport CO₂', level: 'MEDIUM', detail: `${Math.round(yearlyTransportCO2Kg)} kg/year` });
  if (yearlyUnits > 3600) riskPatterns.push({ area: 'Electricity', level: 'HIGH', detail: `${yearlyUnits} units/year` });
  else if (yearlyUnits > 1800) riskPatterns.push({ area: 'Electricity', level: 'MEDIUM', detail: `${yearlyUnits} units/year` });
  if (yearlyWaterLitres > 60000) riskPatterns.push({ area: 'Water Usage', level: 'MEDIUM', detail: `${yearlyWaterLitres.toLocaleString()} L/year` });
  if (yearlyOnlineOrders > 80) riskPatterns.push({ area: 'Online Shopping', level: 'MEDIUM', detail: `${yearlyOnlineOrders} orders/year` });

  return {
    annualizedMetrics: {
      monthlyUnits,
      yearlyUnits,
      yearlyElectricityBill,
      yearlyElectricityCO2Kg: Math.round(yearlyElectricityCO2Kg),
      geyserKwhYear: Math.round(geyserKwhYear),
      monthlyFuelSpend,
      monthlyLitres: Math.round(monthlyLitres * 10) / 10,
      yearlyKmDriven: Math.round(yearlyKmDriven),
      yearlyTransportCO2Kg: Math.round(yearlyTransportCO2Kg),
      yearlyDietCO2Kg: Math.round(yearlyDietCO2Kg),
      yearlyFoodDeliveryCO2Kg: Math.round(yearlyFoodDeliveryCO2Kg),
      dailyWaterLitres: Math.round(dailyWaterLitres),
      yearlyWaterLitres,
      waterVsRecommended,
      yearlyOnlineOrders,
      yearlyShoppingCO2Kg: Math.round(yearlyShoppingCO2Kg),
      yearlyWasteKg: Math.round(yearlyWasteKg),
      yearlyWasteCO2Kg: Math.round(yearlyWasteCO2Kg),
      plantOffset: Math.round(plantOffset),
      totalCO2KgYear,
    },
    projectedAnnualScore,
    riskPatterns,
    earthImpactPercent: earthImpactPercent.toExponential(2),
    annualSummary: {
      totalPersonalCO2Tonnes: `${totalCO2Tonnes} tonnes`,
      comparisonToIndiaAvg: `${Math.abs(diffFromIndia)}% ${diffFromIndia > 0 ? 'above' : 'below'} India's average of ${indiaAvg}t CO₂/person/year`,
      vsGlobalAvg: `${((totalCO2KgYear / 1000 / globalAvg) * 100).toFixed(0)}% of global average (${globalAvg}t)`,
      estimatedMonthlyBill: `₹${Math.round(monthlyBill).toLocaleString('en-IN')}`,
      dailyWater: `${Math.round(dailyWaterLitres)}L/day`,
      yearlyWater: `${(yearlyWaterLitres / 1000).toFixed(1)} kL/year`,
    },
  };
}
