import REAL_DATA from '../data/realWorldData.js';

function getBathLitres(bathType) {
  switch (bathType) {
    case 'bucket': return REAL_DATA.BUCKET_BATH_LITRES;
    case 'short_shower': return REAL_DATA.SHORT_SHOWER_5MIN_LITRES;
    case 'medium_shower': return REAL_DATA.MEDIUM_SHOWER_10MIN_LITRES;
    case 'long_shower': return REAL_DATA.LONG_SHOWER_15MIN_LITRES;
    case 'bath_tub': return REAL_DATA.BATH_TUB_LITRES;
    default: return REAL_DATA.BUCKET_BATH_LITRES;
  }
}

function getDeliveryCount(val) {
  switch (val) {
    case 'daily': return 7;
    case '5-7': return 6;
    case '3-4': return 3.5;
    case '1-2': return 1.5;
    default: return 0;
  }
}

export function estimateYearly(answers, weeklyScore) {
  const a = answers;
  const acHrs = Number(a.acHoursPerWeek) || 0;
  const geyserHrs = Number(a.geyserHoursPerWeek) || 0;
  const tvHrs = Number(a.tvHoursPerWeek) || 0;
  const fanHrs = Number(a.fanHoursPerDay) || 0;
  const washLoads = Number(a.washingLoadsPerWeek) || 0;

  // Electricity annualized
  const acKwhPerYear = acHrs * REAL_DATA.AC_1P5TON_3STAR_KWH_PER_HR * 52;
  const geyserKwhPerYear = geyserHrs * REAL_DATA.GEYSER_15L_KWH_PER_HR * 52;
  const tvKwhPerYear = tvHrs * REAL_DATA.TELEVISION_LED_32IN_KWH_PER_HR * 52;
  const fanKwhPerYear = fanHrs * REAL_DATA.CEILING_FAN_KWH_PER_HR * 365;
  const washKwhPerYear = washLoads * REAL_DATA.WASHING_MACHINE_TOP_LOAD_KWH * 52;
  const fridgeKwhPerYear = REAL_DATA.REFRIGERATOR_250L_3STAR_KWH_PER_DAY * 365;
  const totalEstimatedKwhYear = acKwhPerYear + geyserKwhPerYear + tvKwhPerYear + fanKwhPerYear + washKwhPerYear + fridgeKwhPerYear;
  const totalElectricityBillINR = totalEstimatedKwhYear * REAL_DATA.ELECTRICITY_TARIFF_INR_PER_KWH;
  const totalElectricityCO2KgYear = totalEstimatedKwhYear * REAL_DATA.INDIA_GRID_CO2_INTENSITY;

  // Transport annualized
  const petrol2wKm = Number(a.petrolTwoWheelerKm) || 0;
  const petrolCarKm = Number(a.petrolCarKm) || 0;
  const dieselCarKm = Number(a.dieselCarKm) || 0;
  const busKm = Number(a.busMetroTrainKm) || 0;
  const walkCycleKm = Number(a.walkingCyclingKm) || 0;

  const co2FromPetrol2WheelerKgYear = petrol2wKm * REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM / 1000 * 52;
  const co2FromPetrolCarKgYear = petrolCarKm * REAL_DATA.PETROL_CAR_CO2_PER_KM / 1000 * 52;
  const co2FromDieselCarKgYear = dieselCarKm * REAL_DATA.DIESEL_CAR_CO2_PER_KM / 1000 * 52;
  const totalTransportCO2KgYear = co2FromPetrol2WheelerKgYear + co2FromPetrolCarKgYear + co2FromDieselCarKgYear;
  const totalGreenKmYear = (walkCycleKm + busKm) * 52;
  const totalFossilKmYear = (petrol2wKm + petrolCarKm + dieselCarKm) * 52;
  const avgFossilCO2PerKm = totalFossilKmYear > 0
    ? (totalTransportCO2KgYear * 1000 / totalFossilKmYear)
    : REAL_DATA.PETROL_CAR_CO2_PER_KM;
  const co2AvoidedByGreenTransportKgYear = totalGreenKmYear * avgFossilCO2PerKm / 1000;

  // Water annualized
  const bathLitres = getBathLitres(a.bathType);
  const bathWaterLitresYear = bathLitres * 365;
  const laundryLoads = Number(a.laundryLoadsPerWeek) || 0;
  const laundryWaterLitresYear = laundryLoads * REAL_DATA.TOP_LOAD_WASHING_LITRES * 52;
  const vehicleWashLitresYear = (() => {
    const vw = a.vehicleWashFrequency;
    const litresPerWash = REAL_DATA.VEHICLE_HOSE_WASH_LITRES;
    if (vw === 'multiple_week') return litresPerWash * 104;
    if (vw === 'weekly') return litresPerWash * 52;
    if (vw === 'biweekly') return litresPerWash * 26;
    if (vw === 'monthly') return litresPerWash * 12;
    return 0;
  })();
  const totalWaterLitresYear = bathWaterLitresYear + laundryWaterLitresYear + vehicleWashLitresYear;
  const waterComparedToPerCapitaPercent = (totalWaterLitresYear / (REAL_DATA.INDIA_WATER_PER_CAPITA_CUBIC_M * 1000)) * 100;

  // Food CO2e
  const vegMeals = Number(a.vegMealsPerWeek) || 0;
  const nonVegMeals = Number(a.nonVegMealsPerWeek) || 0;
  const vegMealsCO2eKgYear = vegMeals * REAL_DATA.VEG_MEAL_CO2E_KG * 52;
  const nonVegMealsCO2eKgYear = nonVegMeals * REAL_DATA.CHICKEN_MEAL_CO2E_KG * 52;
  const deliveryCount = getDeliveryCount(a.foodDeliveryPerWeek);
  const foodDeliveryCO2eKgYear = deliveryCount * REAL_DATA.FOOD_DELIVERY_EXTRA_CO2E_KG * 52;

  // Total personal carbon footprint
  const wasteCO2Estimate = 150; // avg waste-related CO2 per person in India (kg/year)
  const totalCO2eKgYear = totalTransportCO2KgYear + totalElectricityCO2KgYear + vegMealsCO2eKgYear + nonVegMealsCO2eKgYear + foodDeliveryCO2eKgYear + wasteCO2Estimate;
  const indiaAvgCO2eKgPerPersonYear = 1900; // IEA 2022: ~1.9 tonnes/person/year
  const diffPercent = ((totalCO2eKgYear - indiaAvgCO2eKgPerPersonYear) / indiaAvgCO2eKgPerPersonYear * 100).toFixed(1);
  const comparedToIndiaAverage = `${diffPercent > 0 ? '+' : ''}${diffPercent}% vs national average of 1.9 tonnes`;

  // Seasonal adjustment for projected annual score
  const isACUser = acHrs > 7;
  const isGeyserUser = geyserHrs > 2;
  const summerAdj = isACUser ? -3 : 0;
  const monsoonAdj = 2;
  const winterAdj = isGeyserUser ? -1 : 0;
  const seasonalAdj = ((summerAdj * 4 + monsoonAdj * 3 + winterAdj * 5) / 12);
  const projectedAnnualScore = Math.round(Math.min(100, Math.max(0, weeklyScore + Math.max(-2, Math.min(2, seasonalAdj)))));

  // Risk patterns
  const riskPatterns = [];
  if (totalTransportCO2KgYear > 1200) riskPatterns.push({ area: 'Transport CO₂', level: 'HIGH', detail: `${Math.round(totalTransportCO2KgYear)} kg/year (India avg transport ~350 kg/year)` });
  else if (totalTransportCO2KgYear > 600) riskPatterns.push({ area: 'Transport CO₂', level: 'MEDIUM', detail: `${Math.round(totalTransportCO2KgYear)} kg/year` });
  if (acKwhPerYear > 800) riskPatterns.push({ area: 'AC Energy', level: 'HIGH', detail: `${Math.round(acKwhPerYear)} kWh/year (avg Indian home ~200 kWh AC/year)` });
  else if (acKwhPerYear > 400) riskPatterns.push({ area: 'AC Energy', level: 'MEDIUM', detail: `${Math.round(acKwhPerYear)} kWh/year` });
  if (totalWaterLitresYear > 50000) riskPatterns.push({ area: 'Water Usage', level: 'MEDIUM', detail: `${Math.round(totalWaterLitresYear).toLocaleString()} L/year` });
  if (deliveryCount * 52 > 150) riskPatterns.push({ area: 'Food Delivery', level: 'MEDIUM', detail: `${Math.round(deliveryCount * 52)} orders/year` });
  if (nonVegMeals * 52 > 260) riskPatterns.push({ area: 'Non-Veg Diet', level: 'LOW-MEDIUM', detail: `${nonVegMeals * 52} meals/year` });

  // Annual summary
  const greenTransportShare = (totalGreenKmYear + totalFossilKmYear) > 0
    ? ((totalGreenKmYear / (totalGreenKmYear + totalFossilKmYear)) * 100).toFixed(1)
    : '100';
  const estimatedMonthlyBill = `₹${Math.round(totalElectricityBillINR / 12).toLocaleString('en-IN')}`;
  const totalPersonalCO2Tonnes = (totalCO2eKgYear / 1000).toFixed(2);

  return {
    annualizedMetrics: {
      acKwhPerYear: Math.round(acKwhPerYear),
      geyserKwhPerYear: Math.round(geyserKwhPerYear),
      totalEstimatedKwhYear: Math.round(totalEstimatedKwhYear),
      totalElectricityBillINR: Math.round(totalElectricityBillINR),
      totalElectricityCO2KgYear: Math.round(totalElectricityCO2KgYear),
      co2FromPetrol2WheelerKgYear: Math.round(co2FromPetrol2WheelerKgYear),
      co2FromPetrolCarKgYear: Math.round(co2FromPetrolCarKgYear),
      co2FromDieselCarKgYear: Math.round(co2FromDieselCarKgYear),
      totalTransportCO2KgYear: Math.round(totalTransportCO2KgYear),
      totalGreenKmYear: Math.round(totalGreenKmYear),
      totalFossilKmYear: Math.round(totalFossilKmYear),
      co2AvoidedByGreenTransportKgYear: Math.round(co2AvoidedByGreenTransportKgYear),
      bathWaterLitresYear: Math.round(bathWaterLitresYear),
      laundryWaterLitresYear: Math.round(laundryWaterLitresYear),
      totalWaterLitresYear: Math.round(totalWaterLitresYear),
      waterComparedToPerCapitaPercent: Number(waterComparedToPerCapitaPercent.toFixed(1)),
      vegMealsCO2eKgYear: Math.round(vegMealsCO2eKgYear),
      nonVegMealsCO2eKgYear: Math.round(nonVegMealsCO2eKgYear),
      foodDeliveryCO2eKgYear: Math.round(foodDeliveryCO2eKgYear),
      totalCO2eKgYear: Math.round(totalCO2eKgYear),
      indiaAvgCO2eKgPerPersonYear,
      comparedToIndiaAverage,
      deliveriesPerYear: Math.round(deliveryCount * 52),
    },
    projectedAnnualScore,
    riskPatterns,
    annualSummary: {
      greenTransportShare: `${greenTransportShare}%`,
      estimatedMonthlyBill,
      totalPersonalCO2Tonnes: `${totalPersonalCO2Tonnes} tonnes`,
      comparisonToIndiaAvg: `${diffPercent > 0 ? '' : ''}${Math.abs(diffPercent)}% ${diffPercent > 0 ? 'above' : 'below'} India's average of 1.9t CO₂/person/year`,
      vegRatio: (vegMeals + nonVegMeals) > 0
        ? `${((vegMeals / (vegMeals + nonVegMeals)) * 100).toFixed(0)}%`
        : 'N/A',
    },
  };
}
