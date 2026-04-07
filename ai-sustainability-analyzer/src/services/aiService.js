import { buildSystemPrompt, buildUserPrompt } from './aiPromptBuilder.js';
import REAL_DATA from '../data/realWorldData.js';

// Age-aware tone helpers
function getTone(age) {
  if (age === 'under_18') return { addr: 'As a young person', style: 'fun and encouraging' };
  if (age === '18_25') return { addr: 'As a college-age adult', style: 'practical and motivating' };
  if (age === '26_35') return { addr: 'As a working professional', style: 'efficiency-focused' };
  if (age === '36_50') return { addr: 'As someone managing a household', style: 'family-oriented' };
  return { addr: 'With your experience', style: 'wisdom-based' };
}

// City-aware context
function getCityTip(city) {
  if (city === 'metro') return 'Your metro city has great public transport — use it more.';
  if (city === 'tier2') return 'Tier 2 cities are growing fast — adopting green habits now sets a great example.';
  if (city === 'tier3') return 'Smaller cities often have cleaner air — help keep it that way.';
  return 'Rural living is naturally sustainable — your connection to nature is an advantage.';
}

function generateMockRecommendations(scoringResult, yearlyResult, answers) {
  const { categoryScores, weaknesses, strengths, finalScore } = scoringResult;
  const { annualizedMetrics: m } = yearlyResult;
  const tone = getTone(answers.ageGroup);
  const cityTip = getCityTip(answers.cityType);

  // Build concerns dynamically from weak categories
  const concerns = [];
  const actions = [];
  const habits = [];

  // Transport
  if (categoryScores.transport < 55) {
    concerns.push(`Transport emits ${m.totalTransportCO2KgYear} kg CO₂/year — ${Math.round(m.totalTransportCO2KgYear / 350 * 100)}% of India's avg transport emissions`);
    if (Number(answers.petrolCarKm) > 50) {
      actions.push({ action: 'Replace 50% of car trips with metro/bus', impact: `Car: ${REAL_DATA.PETROL_CAR_CO2_PER_KM}g/km vs Metro: ${REAL_DATA.METRO_CO2_PER_KM_PER_PASSENGER}g/km`, effort: 'medium', estimatedSaving: `Cuts ~${Math.round(m.totalTransportCO2KgYear * 0.4)} kg CO₂/year` });
    } else if (Number(answers.petrolTwoWheelerKm) > 30) {
      actions.push({ action: 'Try cycling or walking for short trips under 3 km', impact: `Two-wheeler: ${REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM}g/km vs walking: 0g/km`, effort: 'low', estimatedSaving: `Cuts ~${Math.round(Number(answers.petrolTwoWheelerKm) * 0.3 * REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM / 1000 * 52)} kg CO₂/year` });
    }
  } else if (categoryScores.transport >= 75) {
    habits.push({ habit: 'Keep up your green commute', impact: `You save ~${m.co2AvoidedByGreenTransportKgYear} kg CO₂/year by using green transport` });
  }

  // Electricity
  if (categoryScores.electricity < 55) {
    const acHrs = Number(answers.acHoursPerWeek) || 0;
    if (acHrs > 20) {
      concerns.push(`AC runs ${acHrs} hrs/week → ${m.acKwhPerYear} kWh/year → ${Math.round(m.acKwhPerYear * REAL_DATA.INDIA_GRID_CO2_INTENSITY)} kg CO₂`);
      actions.push({ action: 'Set AC to 24°C and use timer mode', impact: 'Each degree above 24°C saves 6% energy (BEE guideline)', effort: 'low', estimatedSaving: `Cuts ~${Math.round(m.acKwhPerYear * 0.3 * REAL_DATA.INDIA_GRID_CO2_INTENSITY)} kg CO₂/year` });
    }
    if (answers.ledBulbsUsed !== 'yes' && answers.ledBulbsUsed !== true) {
      actions.push({ action: 'Switch all bulbs to LED', impact: 'LEDs use 85% less energy than incandescent bulbs (BEE)', effort: 'low', estimatedSaving: 'Reduces lighting energy by 85%' });
    }
  }

  // Water
  if (categoryScores.water < 55) {
    const bath = answers.bathType;
    if (bath === 'long_shower' || bath === 'bath_tub' || bath === 'medium_shower') {
      concerns.push(`Bathing uses ${m.bathWaterLitresYear.toLocaleString()} litres/year — bucket bath would use only ${REAL_DATA.BUCKET_BATH_LITRES * 365} L`);
      actions.push({ action: 'Switch to bucket baths or shorter showers', impact: `Bucket: ${REAL_DATA.BUCKET_BATH_LITRES}L vs your method: much more (BIS)`, effort: 'low', estimatedSaving: `Saves ~${Math.round(m.bathWaterLitresYear - REAL_DATA.BUCKET_BATH_LITRES * 365)} litres/year` });
    }
    if (answers.rainwaterHarvesting !== 'yes') {
      habits.push({ habit: 'Explore rainwater harvesting for your home', impact: `600M Indians face water stress (NITI Aayog). A rooftop system can collect 60,000L/year` });
    }
  }

  // Food
  if (categoryScores.food < 55) {
    const nvMeals = Number(answers.nonVegMealsPerWeek) || 0;
    if (nvMeals > 7) {
      concerns.push(`${nvMeals} non-veg meals/week = ${m.nonVegMealsCO2eKgYear} kg CO₂e/year. Veg meals produce 71% less CO₂`);
      habits.push({ habit: 'Try 2 more veg meals per week', impact: `Each veg meal saves ~${(REAL_DATA.CHICKEN_MEAL_CO2E_KG - REAL_DATA.VEG_MEAL_CO2E_KG).toFixed(1)} kg CO₂e vs chicken (IPCC AR6)` });
    }
    if (answers.foodDeliveryPerWeek === 'daily' || answers.foodDeliveryPerWeek === '5-7') {
      habits.push({ habit: 'Cook at home more — reduce delivery orders', impact: `Each delivery adds ${REAL_DATA.FOOD_DELIVERY_EXTRA_CO2E_KG} kg CO₂e from packaging + transport` });
    }
  }

  // Waste
  if (categoryScores.waste < 55) {
    if (answers.segregationPracticed !== 'yes') {
      actions.push({ action: 'Start segregating waste into wet and dry', impact: `76% of India's solid waste goes unprocessed (CPCB 2022)`, effort: 'low', estimatedSaving: 'Enables recycling of 60%+ of your household waste' });
    }
    if (answers.compostingPracticed !== 'yes') {
      habits.push({ habit: 'Start composting kitchen waste', impact: 'Diverts 40-60% of waste from landfills, prevents methane generation' });
    }
  }

  // Pollution
  if (categoryScores.pollution < 60 && answers.wasteBurning !== 'never') {
    concerns.push('Waste burning in your area releases toxic PM2.5 particles — 8.5 kg per tonne burned (TERI 2019)');
  }

  // Lifestyle
  if (categoryScores.lifestyle < 55) {
    if (answers.fastFashionFrequency === 'frequent' || answers.fastFashionFrequency === 'monthly') {
      habits.push({ habit: 'Buy fewer, better-quality clothes', impact: 'Fashion industry = 10% of global carbon emissions (UNEP). Quality lasts longer.' });
    }
  }

  // Fill remaining slots with context-aware defaults
  while (concerns.length < 3) {
    const fillers = [
      `Your total footprint is ${(m.totalCO2eKgYear / 1000).toFixed(2)} tonnes CO₂e/year — ${m.totalCO2eKgYear > 1900 ? 'above' : 'below'} India's average of 1.9 tonnes`,
      `Water usage: ${m.totalWaterLitresYear.toLocaleString()} litres/year. India has only ${REAL_DATA.INDIA_WATER_PER_CAPITA_CUBIC_M} m³ per capita (CWC)`,
      `${REAL_DATA.INDIA_SOLID_WASTE_PROCESSED_PERCENT}% of India's waste is processed. Your waste habits directly affect this statistic`,
    ];
    concerns.push(fillers[concerns.length] || fillers[0]);
  }

  while (actions.length < 3) {
    const fillers = [
      { action: 'Carry a reusable bag and bottle everywhere', impact: `1 cloth bag replaces ${REAL_DATA.CLOTH_BAG_REPLACEMENT_COUNT} plastic bags (CPCB)`, effort: 'low', estimatedSaving: 'Prevents hundreds of plastic items from waste annually' },
      { action: 'Use public transport for your next outing', impact: `Bus: ${REAL_DATA.CITY_BUS_CO2_PER_KM_PER_PASSENGER}g/km per person vs car: ${REAL_DATA.PETROL_CAR_CO2_PER_KM}g/km`, effort: 'low', estimatedSaving: 'Up to 90% emission reduction per trip' },
      { action: 'Fix any leaking taps at home this week', impact: `One dripping tap wastes ${REAL_DATA.DRIPPING_TAP_LITRES_PER_DAY}L/day = 6,200L/year (CWC)`, effort: 'low', estimatedSaving: 'Saves thousands of litres of water per year' },
    ];
    actions.push(fillers[actions.length] || fillers[0]);
  }

  while (habits.length < 3) {
    const fillers = [
      { habit: 'Walk or cycle for trips under 2 km', impact: `Saves ${REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM * 2}g CO₂ per trip and improves your fitness` },
      { habit: 'Prefer locally grown seasonal food', impact: 'Local food travels under 100 km vs imported food at 1,500+ km, cutting transport emissions' },
      { habit: 'Reduce food waste — plan meals ahead', impact: `India wastes ${REAL_DATA.FOOD_WASTE_INDIA_KG_PER_PERSON_YEAR} kg food/person/year (FAO). Small changes at home matter.` },
    ];
    habits.push(fillers[habits.length] || fillers[0]);
  }

  // Age-aware monthly plans
  const plans = [];
  if (answers.ageGroup === 'under_18' || answers.ageGroup === '18_25') {
    plans.push(
      { goal: 'Start a green challenge with friends', steps: ['Pick one habit (no plastic, walk to college, etc.)', 'Track it for 30 days', 'Share progress on social media to inspire others'] },
      { goal: 'Reduce your digital carbon footprint', steps: ['Download videos on WiFi instead of streaming repeatedly', 'Unsubscribe from unused services', 'Use dark mode to save phone battery'] },
    );
  } else if (answers.ageGroup === '26_35' || answers.ageGroup === '36_50') {
    plans.push(
      { goal: 'Green your household this month', steps: ['Switch remaining bulbs to LED', 'Set AC to 24°C with timer', 'Start wet-dry waste segregation'] },
      { goal: 'Optimize your commute', steps: ['Map public transport routes for regular trips', 'Try carpooling with colleagues twice this week', 'Consider an EV for your next vehicle purchase'] },
    );
  } else {
    plans.push(
      { goal: 'Share your sustainability wisdom', steps: ['Teach younger family members about water conservation', 'Start a kitchen garden or balcony plants', 'Mentor neighbours on waste segregation'] },
      { goal: 'Make your home more efficient', steps: ['Check all taps and pipes for leaks', 'Upgrade old appliances to BEE 5-star', 'Explore rooftop solar options'] },
    );
  }

  // City-aware long-term habits
  const longTerm = [];
  if (answers.cityType === 'metro') {
    longTerm.push(
      `Use your city's metro and bus network more — India's metros cover 800+ km and are expanding rapidly`,
      `Consider an EV two-wheeler — EV sales grew ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% in 2022-23. Emits only ${REAL_DATA.EV_TWO_WHEELER_CO2_PER_KM}g/km vs ${REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM}g/km petrol`,
      `Join or start a Resident Welfare Association green initiative — community action scales impact`,
    );
  } else if (answers.cityType === 'rural') {
    longTerm.push(
      `Your rural lifestyle is naturally low-carbon. Focus on preserving local water bodies and green cover`,
      `Adopt rainwater harvesting — ${REAL_DATA.INDIA_WATER_STRESS_POPULATION_M}M Indians face water stress`,
      `Solar energy is increasingly accessible — a small rooftop system can make a big difference`,
    );
  } else {
    longTerm.push(
      `Explore rooftop solar — India has ${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity and growing (MNRE 2024)`,
      `Transition to an EV — sales grew ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% last year, with more charging stations coming`,
      `Advocate for better public transport and cycling infrastructure in your city`,
    );
  }

  const scoreLabel = finalScore >= 80 ? 'excellent' : finalScore >= 65 ? 'good' : finalScore >= 50 ? 'moderate' : 'concerning';
  const summary = `${tone.addr}, your sustainability score of ${finalScore}/100 is ${scoreLabel}. Your estimated carbon footprint is ${(m.totalCO2eKgYear / 1000).toFixed(2)} tonnes CO₂e/year — ${m.comparedToIndiaAverage}. ${cityTip}`;

  const motivation = finalScore >= 65
    ? `You're already making a real difference. India is targeting net-zero by 2070, and with ${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity already built, every sustainable choice you make adds to the national momentum. Keep going!`
    : `Every journey starts with a single step. India's ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% EV growth and expanding metro networks show the country is moving toward sustainability. Pick one change from above and start this week — small habits build big results.`;

  return {
    summary,
    topConcerns: concerns.slice(0, 3),
    immediateActions: actions.slice(0, 3),
    weeklyImprovements: habits.slice(0, 3),
    monthlyPlan: plans.slice(0, 2),
    longTermHabits: longTerm.slice(0, 3),
    motivation,
  };
}

export async function getAIRecommendations(profile, scoringResult, yearlyResult) {
  const aiMode = import.meta.env.VITE_AI_MODE;
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (aiMode === 'mock' || !apiKey) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { ...generateMockRecommendations(scoringResult, yearlyResult, profile.answers), source: 'mock' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserPrompt(profile, scoringResult, yearlyResult) }],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    let text = data.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return { ...JSON.parse(text), source: 'live' };
  } catch (error) {
    console.warn('AI API failed, using smart analysis:', error.message);
    await new Promise(resolve => setTimeout(resolve, 800));
    return { ...generateMockRecommendations(scoringResult, yearlyResult, profile.answers), source: 'mock' };
  }
}
