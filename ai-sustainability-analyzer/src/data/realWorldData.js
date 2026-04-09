// src/data/realWorldData.js
// All constants sourced from verified Indian government and scientific data

const REAL_DATA = {
  // ═══ ELECTRICITY SLAB RATES (₹ per unit / kWh) ═══
  // Source: TANGEDCO (Tamil Nadu) & Puducherry Electricity Dept, 2024

  // Tamil Nadu (TANGEDCO) Domestic - Bimonthly billing
  TN_SLABS: [
    { upTo: 100, rate: 0 },         // Free up to 100 units (bimonthly)
    { upTo: 200, rate: 1.50 },      // 101-200 units
    { upTo: 500, rate: 2.00 },      // 201-500 units
    { upTo: 1000, rate: 3.50 },     // 501-1000 units
    { upTo: Infinity, rate: 4.60 }, // 1000+ units
  ],
  // Pondicherry (Puducherry Electricity Dept) - Monthly billing
  PY_SLABS: [
    { upTo: 100, rate: 1.25 },      // 0-100 units
    { upTo: 200, rate: 2.50 },      // 101-200 units
    { upTo: 300, rate: 3.25 },      // 201-300 units
    { upTo: Infinity, rate: 4.50 }, // 300+ units
  ],

  // Grid emission factor
  INDIA_GRID_CO2_INTENSITY: 0.716,   // CEA 2023: kg CO₂ per kWh

  // Average appliance consumption (BEE 2023)
  AC_1P5TON_3STAR_KWH_PER_HR: 1.55,
  GEYSER_15L_KWH_PER_USE: 1.0,      // ~30 min per use = 1 kWh (2 kW × 0.5 hr)
  CEILING_FAN_KWH_PER_HR: 0.075,
  REFRIGERATOR_KWH_PER_MONTH: 45,    // 250L 3-star ~1.5 kWh/day
  WASHING_MACHINE_KWH_PER_LOAD: 0.9,
  LED_BULB_KWH_PER_HR: 0.009,
  TV_LED_32_KWH_PER_HR: 0.06,

  // ═══ FUEL / TRANSPORT ═══
  // Source: IOCL, ARAI, MoEFCC 2024
  PETROL_PRICE_PER_LITRE: 102.63,    // Chennai/Pondy avg Apr 2024
  DIESEL_PRICE_PER_LITRE: 94.24,     // Chennai/Pondy avg Apr 2024
  CNG_PRICE_PER_KG: 85,              // Avg Indian metro

  // Mileage (avg km per litre) - ARAI certified
  MILEAGE_PETROL_2W: 50,             // 100-125cc scooter/bike
  MILEAGE_PETROL_CAR: 15,            // Hatchback/sedan avg
  MILEAGE_DIESEL_CAR: 20,            // Diesel sedan avg
  MILEAGE_EV_2W_KWH_PER_KM: 0.03,   // Electric 2-wheeler
  MILEAGE_EV_CAR_KWH_PER_KM: 0.15,  // Electric car

  // CO₂ per litre burned
  PETROL_CO2_PER_LITRE: 2.31,        // kg CO₂/litre (IPCC)
  DIESEL_CO2_PER_LITRE: 2.68,        // kg CO₂/litre (IPCC)
  CNG_CO2_PER_KG: 2.75,              // kg CO₂/kg (IPCC)

  // Public transport CO₂ per km per passenger
  BUS_CO2_PER_PKM: 0.018,            // 18g/pkm (DTC avg)
  METRO_CO2_PER_PKM: 0.015,          // 15g/pkm (DMRC 2023)
  TRAIN_CO2_PER_PKM: 0.012,          // 12g/pkm (Indian Railways)
  AUTO_CO2_PER_PKM: 0.055,           // 55g/pkm (CNG auto)

  // ═══ FOOD & DIET ═══
  // Source: IPCC AR6, ICAR, Swiggy/Zomato industry data
  VEG_MEAL_CO2E_KG: 0.7,             // Dal, rice, sabzi
  CHICKEN_MEAL_CO2E_KG: 2.4,
  MUTTON_MEAL_CO2E_KG: 5.2,
  FISH_MEAL_CO2E_KG: 1.8,
  EGG_CO2E_KG: 0.3,                  // Per egg
  FOOD_DELIVERY_CO2E_PER_ORDER: 0.4, // Packaging + last-mile
  PACKAGED_FOOD_MULTIPLIER: 1.4,     // 40% more CO₂ than fresh
  AVG_FOOD_ORDER_VALUE: 250,         // Avg Swiggy/Zomato order ₹
  FOOD_WASTE_INDIA_KG_PER_PERSON_YEAR: 68, // FAO 2021

  // ═══ WATER ═══
  // Source: BIS IS 1172, CWC, NITI Aayog
  INDIA_DAILY_WATER_PER_CAPITA_LITRES: 135, // BIS recommended
  BUCKET_BATH_LITRES: 15,
  SHOWER_5MIN_LITRES: 40,
  SHOWER_10MIN_LITRES: 75,
  TAP_RUNNING_LITRES_PER_MIN: 8,
  WASHING_MACHINE_LITRES_PER_LOAD: 100,
  COOKING_CLEANING_LITRES_PER_DAY: 30,
  FLUSHING_LITRES_PER_USE: 10,       // Avg toilet flush
  RO_WASTE_RATIO: 3,                 // 3L wasted per 1L purified
  DRIPPING_TAP_LITRES_PER_DAY: 17,

  // ═══ WASTE ═══
  // Source: CPCB 2022, MoEFCC
  INDIA_SOLID_WASTE_MT_PER_YEAR: 62,
  INDIA_SOLID_WASTE_PROCESSED_PERCENT: 24,
  INDIA_PLASTIC_WASTE_MT_PER_YEAR: 9.7,
  AVG_HOUSEHOLD_WASTE_KG_PER_DAY: 0.45, // Urban India avg per person
  CLOTH_BAG_REPLACEMENT_COUNT: 700,
  METHANE_FROM_LANDFILL_KG_CO2E_PER_KG: 1.2, // Wet waste in landfill
  E_WASTE_INDIA_MT_PER_YEAR: 3.2,

  // ═══ ONLINE SHOPPING / DELIVERY ═══
  DELIVERY_PACKAGING_CO2E_KG: 0.5,   // Per package (cardboard, bubble wrap, transport)
  RETURN_EXTRA_CO2E_KG: 0.8,         // Return shipping doubles transport
  FAST_FASHION_CO2E_PER_GARMENT: 6.5,// kg CO₂e per garment (UNEP)

  // ═══ INTERNET / DIGITAL ═══
  // Source: IEA, Shift Project
  DATA_CO2E_PER_GB: 0.028,           // kg CO₂ per GB of data transfer
  STREAMING_GB_PER_HOUR_HD: 3,       // HD video ~3 GB/hr
  STREAMING_GB_PER_HOUR_SD: 0.7,     // SD video
  PHONE_CHARGE_KWH: 0.01,            // Per full charge
  LAPTOP_KWH_PER_HR: 0.05,           // Avg laptop

  // ═══ PLANTS & TREES ═══
  TREE_CO2_ABSORPTION_KG_PER_YEAR: 22,     // Mature tree
  INDOOR_PLANT_CO2_ABSORPTION_KG_PER_YEAR: 0.5,  // Money plant, tulsi etc.
  BALCONY_GARDEN_CO2_OFFSET_KG_PER_YEAR: 5,

  // ═══ INDIA NATIONAL STATS ═══
  // Source: IEA, MoEFCC, WHO, NITI Aayog
  INDIA_CO2_BILLION_TONNES_2022: 2.88,
  INDIA_PER_CAPITA_CO2_TONNES: 1.9,   // IEA 2022
  GLOBAL_PER_CAPITA_CO2_TONNES: 4.7,  // IEA 2022
  INDIA_TRANSPORT_GHG_PERCENT: 12,
  INDIA_WATER_STRESS_POPULATION_M: 600,
  INDIA_RENEWABLE_ENERGY_PERCENT: 42,
  INDIA_EV_GROWTH_PERCENT_2023: 49,
  DELHI_AQI_BAD_DAYS_PER_YEAR: 210,
  INDIA_INTERNET_USERS_M: 820,        // TRAI 2024
  INDIA_AVG_DATA_GB_PER_MONTH: 19.5,  // Avg Indian mobile user
};

// Utility: Given monthly bill (₹), calculate units consumed
REAL_DATA.unitsFromBill = function(bill, state = 'TN') {
  const slabs = state === 'PY' ? REAL_DATA.PY_SLABS : REAL_DATA.TN_SLABS;
  const isBimonthly = state === 'TN';
  const targetBill = isBimonthly ? bill * 2 : bill; // TN is bimonthly

  let units = 0;
  let remaining = targetBill;
  let prevLimit = 0;

  for (const slab of slabs) {
    const slabRange = slab.upTo - prevLimit;
    if (slab.rate === 0) {
      units += slabRange;
      prevLimit = slab.upTo;
      continue;
    }
    const maxCostInSlab = slabRange * slab.rate;
    if (remaining <= maxCostInSlab) {
      units += remaining / slab.rate;
      break;
    }
    units += slabRange;
    remaining -= maxCostInSlab;
    prevLimit = slab.upTo;
  }

  return isBimonthly ? Math.round(units / 2) : Math.round(units); // Return monthly units
};

export default REAL_DATA;
