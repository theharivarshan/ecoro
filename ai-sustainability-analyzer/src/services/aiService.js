import { buildSystemPrompt, buildUserPrompt } from './aiPromptBuilder.js';
import REAL_DATA from '../data/realWorldData.js';

function getTone(age) {
  if (age === 'under_18') return { addr: 'As a young person', style: 'fun and encouraging' };
  if (age === '18_25') return { addr: 'As a young adult', style: 'practical and motivating' };
  if (age === '26_35') return { addr: 'As a working professional', style: 'efficiency-focused' };
  if (age === '36_50') return { addr: 'As someone managing a household', style: 'family-oriented' };
  return { addr: 'With your experience', style: 'wisdom-based' };
}

function getStateTip(state) {
  if (state === 'TN') return 'Tamil Nadu provides free electricity up to 100 units bimonthly — make sure you stay within this slab to save both money and carbon.';
  if (state === 'PY') return 'Puducherry has competitive electricity rates — but every unit saved still prevents 0.716 kg CO₂ from entering the atmosphere.';
  return 'Your state has its own electricity tariff — reducing consumption saves both your bill and the environment.';
}

function generateMockRecommendations(scoringResult, yearlyResult, answers) {
  const { categoryScores, finalScore } = scoringResult;
  const { annualizedMetrics: m } = yearlyResult;
  const tone = getTone(answers.ageGroup);
  const stateTip = getStateTip(answers.state);

  const concerns = [];
  const actions = [];
  const habits = [];

  // Electricity
  if (categoryScores.electricity < 55) {
    concerns.push(`Your electricity uses ~${m.monthlyUnits} units/month → ${m.yearlyElectricityCO2Kg} kg CO₂/year`);
    if (answers.acUsage === 'daily_long' || answers.acUsage === 'daily_few') {
      actions.push({ action: 'Set AC to 24°C and use timer mode', impact: 'Each degree above 24°C saves 6% energy (BEE)', effort: 'low', estimatedSaving: `Cuts ~${Math.round(m.yearlyElectricityCO2Kg * 0.2)} kg CO₂/year` });
    }
    if (answers.ledBulbs !== 'yes' && answers.ledBulbs !== true) {
      actions.push({ action: 'Switch to LED bulbs everywhere', impact: 'LEDs use 85% less energy than incandescent (BEE)', effort: 'low', estimatedSaving: 'Saves ~₹500–₹1,000/year on electricity' });
    }
  }

  // Transport
  if (categoryScores.transport < 55) {
    concerns.push(`Fuel spend → ~${m.yearlyTransportCO2Kg} kg CO₂/year from personal transport`);
    if (answers.vehicleType?.includes('petrol') || answers.vehicleType?.includes('diesel')) {
      actions.push({ action: 'Use public transport for 50% of trips', impact: `Bus: 18g/pkm vs Car: 155g/km — 88% reduction per km (ARAI/DMRC)`, effort: 'medium', estimatedSaving: `Cuts ~${Math.round(m.yearlyTransportCO2Kg * 0.4)} kg CO₂/year` });
    }
    if (answers.publicTransportUsage === 'never' || answers.publicTransportUsage === 'rarely') {
      habits.push({ habit: 'Try bus or metro twice this week', impact: 'Public transport emits 80–90% less CO₂ per passenger than a private car' });
    }
  }

  // Food
  if (categoryScores.food < 55) {
    if (answers.dietType === 'non_veg_daily' || answers.dietType === 'non_veg_regular') {
      concerns.push(`Your diet produces ~${m.yearlyDietCO2Kg} kg CO₂e/year. Veg meals produce 71% less CO₂`);
      habits.push({ habit: 'Replace 2 non-veg meals/week with veg', impact: `Each veg meal saves ~${(REAL_DATA.CHICKEN_MEAL_CO2E_KG - REAL_DATA.VEG_MEAL_CO2E_KG).toFixed(1)} kg CO₂e (IPCC AR6)` });
    }
    if (answers.monthlyFoodOrdering === '10-20' || answers.monthlyFoodOrdering === '20+') {
      habits.push({ habit: 'Cook at home more — batch cooking saves time and emissions', impact: `Each delivery adds ${REAL_DATA.FOOD_DELIVERY_CO2E_PER_ORDER} kg CO₂e from packaging + transport` });
    }
  }

  // Water
  if (categoryScores.water < 55) {
    if (answers.bathingMethod === 'long_shower') {
      concerns.push(`Long showers use ~75L/bath vs bucket bath at 15L — ${Math.round((75 - 15) * 365)} extra litres/year`);
      actions.push({ action: 'Try bucket baths or shorter showers', impact: 'Saves up to 80% water per bath (BIS standard)', effort: 'low', estimatedSaving: `Saves ~${Math.round((75 - 15) * 365)} litres/year` });
    }
    if (answers.tapHabit !== 'yes' && answers.tapHabit !== true) {
      habits.push({ habit: 'Turn off taps while brushing/soaping', impact: 'Saves ~16 litres per session — 11,680 litres/year' });
    }
  }

  // Waste
  if (categoryScores.waste < 55) {
    if (answers.wasteSegregation !== 'yes' && answers.wasteSegregation !== true) {
      actions.push({ action: 'Start separating wet and dry waste today', impact: '76% of India\'s solid waste goes unprocessed (CPCB 2022)', effort: 'low', estimatedSaving: 'Enables recycling of 60%+ of your waste' });
    }
    if (answers.composting !== 'yes' && answers.composting !== true) {
      habits.push({ habit: 'Start composting kitchen waste', impact: 'Diverts 40–60% of waste from landfills, prevents methane' });
    }
  }

  // Shopping
  if (categoryScores.shopping < 55) {
    if (answers.onlineOrdersPerMonth === '8-15' || answers.onlineOrdersPerMonth === '15+') {
      concerns.push(`${m.yearlyOnlineOrders} online orders/year = ${m.yearlyShoppingCO2Kg} kg CO₂e from packaging + delivery`);
      actions.push({ action: 'Bundle online orders and reduce returns', impact: 'Returns double transport emissions per item', effort: 'low', estimatedSaving: `Cuts ~${Math.round(m.yearlyShoppingCO2Kg * 0.4)} kg CO₂e/year` });
    }
  }

  // Green
  if (categoryScores.green < 55 && answers.plantsAtHome === 'none') {
    habits.push({ habit: 'Start with 2–3 indoor plants (money plant, tulsi)', impact: 'Each plant absorbs ~0.5 kg CO₂/year and improves indoor air quality' });
  }

  // Fill remaining slots
  while (concerns.length < 3) {
    const fillers = [
      `Total footprint: ${(m.totalCO2KgYear / 1000).toFixed(2)} tonnes CO₂e/year — ${m.totalCO2KgYear > 1900 ? 'above' : 'below'} India's avg of 1.9 tonnes`,
      `Water usage: ~${m.dailyWaterLitres}L/day. BIS recommends 135L/person/day`,
      stateTip,
    ];
    concerns.push(fillers[concerns.length] || fillers[0]);
  }

  while (actions.length < 3) {
    const fillers = [
      { action: 'Carry reusable bags and water bottle', impact: `1 cloth bag replaces ${REAL_DATA.CLOTH_BAG_REPLACEMENT_COUNT} plastic bags`, effort: 'low', estimatedSaving: 'Prevents hundreds of plastic items/year' },
      { action: 'Switch to public transport for your commute', impact: 'Bus/metro emit 80–90% less per person than cars', effort: 'medium', estimatedSaving: 'Up to 90% emission reduction per trip' },
      { action: 'Fix any leaking taps at home', impact: `1 dripping tap = ${REAL_DATA.DRIPPING_TAP_LITRES_PER_DAY}L/day wasted (CWC)`, effort: 'low', estimatedSaving: 'Saves 6,200+ litres/year' },
    ];
    actions.push(fillers[actions.length] || fillers[0]);
  }

  while (habits.length < 3) {
    const fillers = [
      { habit: 'Prefer locally grown seasonal food', impact: 'Local food travels <100 km vs imported at 1,500+ km' },
      { habit: 'Repair before replacing — it extends product life 2–5x', impact: 'India\'s repair economy saves millions of tonnes of waste annually' },
      { habit: 'Reduce food waste — plan meals ahead', impact: `India wastes ${REAL_DATA.FOOD_WASTE_INDIA_KG_PER_PERSON_YEAR} kg food/person/year (FAO)` },
    ];
    habits.push(fillers[habits.length] || fillers[0]);
  }

  // Monthly plans (age-aware)
  const plans = [];
  if (answers.ageGroup === 'under_18' || answers.ageGroup === '18_25') {
    plans.push(
      { goal: 'Start a 30-day green challenge', steps: ['Pick one habit: no plastic bags, walk to college, etc.', 'Track it daily for 30 days', 'Share progress with friends to inspire them'] },
      { goal: 'Reduce your digital footprint', steps: ['Download videos on WiFi instead of streaming repeatedly', 'Reduce screen time by 30 min/day', 'Use dark mode to save battery'] },
    );
  } else if (answers.ageGroup === '26_35' || answers.ageGroup === '36_50') {
    plans.push(
      { goal: 'Green your household this month', steps: ['Switch remaining bulbs to LED', 'Set AC to 24°C with timer', 'Start wet-dry waste segregation'] },
      { goal: 'Optimize your commute', steps: ['Map public transport routes for regular trips', 'Try carpooling with colleagues', 'Consider an EV for your next vehicle'] },
    );
  } else {
    plans.push(
      { goal: 'Share sustainability with family', steps: ['Teach water conservation to younger members', 'Start a kitchen garden', 'Mentor neighbours on waste segregation'] },
      { goal: 'Make your home efficient', steps: ['Check all taps/pipes for leaks', 'Upgrade old appliances to BEE 5-star', 'Explore rooftop solar options'] },
    );
  }

  const longTerm = [
    `Explore rooftop solar — India has ${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity (MNRE 2024). PM Surya Ghar provides subsidies.`,
    `Consider an EV — sales grew ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% in 2023. Electric 2-wheelers emit 73% less CO₂ than petrol.`,
    `Grow more plants — ${plantMessage(answers)}. Every tree absorbs ~22 kg CO₂/year.`,
  ];

  const scoreLabel = finalScore >= 80 ? 'excellent' : finalScore >= 65 ? 'good' : finalScore >= 50 ? 'moderate' : 'concerning';
  const summary = `${tone.addr}, your sustainability score of ${finalScore}/100 is ${scoreLabel}. Your estimated annual carbon footprint is ${(m.totalCO2KgYear / 1000).toFixed(2)} tonnes CO₂e — ${yearlyResult.annualSummary.comparisonToIndiaAvg}. ${stateTip}`;

  const motivation = finalScore >= 65
    ? `You're making a real difference. India targets net-zero by 2070, and with ${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity already built, every sustainable choice adds to national momentum. Keep going!`
    : `Every journey starts with one step. India's ${REAL_DATA.INDIA_EV_GROWTH_PERCENT_2023}% EV growth and expanding metro networks show the country is moving toward sustainability. Pick one change from above and start this week.`;

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

function plantMessage(answers) {
  const count = Number(answers.plantCount) || 0;
  if (count > 10) return `your ${count} plants are offsetting about ${(count * 0.5).toFixed(0)} kg CO₂/year`;
  if (count > 0) return `your ${count} plants help, but adding more would increase your offset`;
  return `starting with even 3–5 indoor plants would improve your air quality and offset some CO₂`;
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
