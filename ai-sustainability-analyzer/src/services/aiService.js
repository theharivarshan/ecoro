import { buildSystemPrompt, buildUserPrompt } from './aiPromptBuilder.js';
import REAL_DATA from '../data/realWorldData.js';

function generateMockRecommendations(scoringResult, yearlyResult, answers) {
  const { categoryScores, weaknesses, finalScore } = scoringResult;
  const { annualizedMetrics } = yearlyResult;

  const concerns = [];
  const actions = [];
  const habits = [];
  const plans = [];
  const longTerm = [];

  // Transport-based recommendations
  if (categoryScores.transport < 60) {
    concerns.push(`Your transport CO₂ is ${annualizedMetrics.totalTransportCO2KgYear} kg/year — ${Math.round(annualizedMetrics.totalTransportCO2KgYear / 350 * 100)}% of India's average transport emissions`);
    actions.push({
      action: 'Switch 50% of car trips to metro/bus',
      impact: `Metro emits just ${REAL_DATA.METRO_CO2_PER_KM_PER_PASSENGER}g CO₂/km vs car's ${REAL_DATA.PETROL_CAR_CO2_PER_KM}g/km (ARAI/DMRC)`,
      effort: 'medium',
      estimatedSaving: `Cuts ~${Math.round(annualizedMetrics.totalTransportCO2KgYear * 0.4)} kg CO₂/year`,
    });
  }

  // Electricity-based recommendations
  if (categoryScores.electricity < 60) {
    const acKwh = annualizedMetrics.acKwhPerYear;
    concerns.push(`AC uses ${acKwh} kWh/year costing ₹${Math.round(acKwh * REAL_DATA.ELECTRICITY_TARIFF_INR_PER_KWH).toLocaleString('en-IN')}/year — consider a BEE 5-star inverter AC`);
    actions.push({
      action: 'Reduce AC usage by 50% and set temperature to 24°C',
      impact: `Each degree above 24°C saves 6% energy (BEE). Your AC emits ${Math.round(acKwh * REAL_DATA.INDIA_GRID_CO2_INTENSITY)} kg CO₂/year`,
      effort: 'low',
      estimatedSaving: `Saves ~₹${Math.round(acKwh * 0.5 * REAL_DATA.ELECTRICITY_TARIFF_INR_PER_KWH).toLocaleString('en-IN')}/year + ${Math.round(acKwh * 0.5 * REAL_DATA.INDIA_GRID_CO2_INTENSITY)} kg CO₂`,
    });
  }

  // Water-based recommendations
  if (categoryScores.water < 60) {
    concerns.push(`Water usage at ${annualizedMetrics.totalWaterLitresYear.toLocaleString()} L/year — ${annualizedMetrics.waterComparedToPerCapitaPercent.toFixed(1)}% of India's per capita allocation`);
    actions.push({
      action: 'Switch to bucket baths (saves 83% water vs 10-min shower)',
      impact: `Bucket uses ${REAL_DATA.BUCKET_BATH_LITRES}L vs shower's ${REAL_DATA.MEDIUM_SHOWER_10MIN_LITRES}L (BIS standard)`,
      effort: 'low',
      estimatedSaving: `Saves ~${Math.round((REAL_DATA.MEDIUM_SHOWER_10MIN_LITRES - REAL_DATA.BUCKET_BATH_LITRES) * 365)} litres/year`,
    });
  }

  // Food recommendations
  if (categoryScores.food < 60) {
    concerns.push(`Non-veg meals contribute ${annualizedMetrics.nonVegMealsCO2eKgYear} kg CO₂e/year — veg meals are ${Math.round((1 - REAL_DATA.VEG_MEAL_CO2E_KG / REAL_DATA.CHICKEN_MEAL_CO2E_KG) * 100)}% lower carbon`);
  }

  // Waste recommendations
  if (categoryScores.waste < 60) {
    habits.push({
      habit: 'Start wet-dry waste segregation at home',
      impact: `Only ${REAL_DATA.INDIA_SOLID_WASTE_PROCESSED_PERCENT}% of India's ${REAL_DATA.INDIA_SOLID_WASTE_MT_PER_YEAR}MT solid waste is processed (CPCB 2022)`,
    });
  }

  // Fill remaining slots
  while (actions.length < 3) {
    const fillers = [
      { action: 'Switch to LED bulbs throughout home', impact: `LEDs use ${REAL_DATA.LED_BULB_9W_KWH_PER_HR * 1000}W vs incandescent ${REAL_DATA.INCANDESCENT_60W_KWH_PER_HR * 1000}W — 85% energy saving (BEE)`, effort: 'low', estimatedSaving: 'Saves ~₹1,200/year for 10 bulbs' },
      { action: 'Carry reusable bags for all shopping', impact: `1 cloth bag replaces ${REAL_DATA.CLOTH_BAG_REPLACEMENT_COUNT} plastic bags over its lifetime (CPCB)`, effort: 'low', estimatedSaving: 'Prevents ~700 plastic bags from waste stream' },
      { action: 'Use a reusable water bottle', impact: 'Prevents ~156 plastic bottles/year per person from entering landfills', effort: 'low', estimatedSaving: 'Saves ~₹2,400/year on bottled water' },
    ];
    actions.push(fillers[actions.length]);
  }

  while (concerns.length < 3) {
    concerns.push(`India generates ${REAL_DATA.INDIA_PLASTIC_WASTE_MT_PER_YEAR} million tonnes of plastic waste annually (CPCB 2022) — individual reduction matters`);
  }

  while (habits.length < 3) {
    const habitFillers = [
      { habit: 'Walk or cycle for trips under 2 km', impact: `Saves ${REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM * 2}g CO₂ per trip (ARAI) and improves fitness` },
      { habit: 'Reduce food delivery to once a week', impact: `Each delivery adds ~${REAL_DATA.FOOD_DELIVERY_EXTRA_CO2E_KG} kg CO₂e from packaging + last-mile (Swiggy ESG 2022)` },
      { habit: 'Compost kitchen waste daily', impact: `Diverts organic waste from landfills where it generates methane — 28x more potent than CO₂` },
    ];
    habits.push(habitFillers[habits.length]);
  }

  plans.push(
    { goal: 'Green your commute', steps: ['Map public transport routes for regular destinations', 'Try bus/metro for 2 trips this week', 'Track fuel savings in a simple diary'] },
    { goal: 'Reduce household electricity by 20%', steps: ['Get a BEE 5-star rated appliance for your next purchase', 'Set AC to 24°C and use timer mode', 'Switch off standby devices at the power strip'] },
  );

  longTerm.push(
    `Install rooftop solar — India's ${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity (MNRE 2024) shows the trend. A 3kW system offsets ~3,500 kWh/year`,
    `Transition to an EV two-wheeler — EV sales grew ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% in 2022-23 (SIAM). Emits only ${REAL_DATA.EV_TWO_WHEELER_CO2_PER_KM}g/km vs ${REAL_DATA.PETROL_TWO_WHEELER_CO2_PER_KM}g/km for petrol`,
    `Adopt rainwater harvesting — with ${REAL_DATA.INDIA_WATER_STRESS_POPULATION_M}M Indians facing water stress (NITI Aayog), every drop saved counts`,
  );

  const scoreLabel = finalScore >= 80 ? 'excellent' : finalScore >= 65 ? 'good' : finalScore >= 50 ? 'moderate' : 'concerning';
  const summary = `Your sustainability score of ${finalScore}/100 is ${scoreLabel}. Your annual carbon footprint is approximately ${(annualizedMetrics.totalCO2eKgYear / 1000).toFixed(2)} tonnes CO₂e — ${annualizedMetrics.comparedToIndiaAverage}. Key areas for improvement: ${weaknesses.map(w => w.category).join(', ')}.`;

  const motivation = finalScore >= 65
    ? `You're already making a positive difference! With India targeting net-zero by 2070 and ${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity already installed, your sustainable choices amplify the national effort. Keep inspiring others!`
    : `Every small change adds up. India's ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% EV growth and expanding metro networks show the country is moving toward sustainability. Start with one change this week — you'll be surprised how quickly it becomes a habit!`;

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
    return {
      ...generateMockRecommendations(scoringResult, yearlyResult, profile.answers),
      source: 'mock',
    };
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(profile, scoringResult, yearlyResult);

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.content[0].text;

    // Strip markdown fences if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(text);
    return { ...parsed, source: 'live' };
  } catch (error) {
    console.warn('AI API failed, using mock recommendations:', error.message);
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      ...generateMockRecommendations(scoringResult, yearlyResult, profile.answers),
      source: 'mock',
    };
  }
}
