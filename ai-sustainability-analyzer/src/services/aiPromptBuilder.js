import REAL_DATA from '../data/realWorldData.js';

export function buildSystemPrompt() {
  return `You are an expert Indian sustainability advisor with deep knowledge of Indian environmental data. You analyze personal sustainability profiles and provide actionable, data-backed recommendations specific to the Indian context.

CRITICAL INSTRUCTION: Respond ONLY with valid JSON. No markdown, no preamble, no explanation outside JSON. Your entire response must be a single valid JSON object.

JSON structure required:
{
  "summary": "string (2-3 sentences with real numbers from their profile)",
  "topConcerns": ["string with data", "string with data", "string with data"],
  "immediateActions": [
    { "action": "string", "impact": "string with real data", "effort": "low|medium|high", "estimatedSaving": "string e.g. saves ~₹800/month or cuts 240kg CO₂/year" }
  ],
  "weeklyImprovements": [
    { "habit": "string", "impact": "string with real data" }
  ],
  "monthlyPlan": [
    { "goal": "string", "steps": ["string", "string"] }
  ],
  "longTermHabits": ["string", "string", "string"],
  "motivation": "string"
}

Provide exactly: 3 immediateActions, 3 weeklyImprovements, 2 monthlyPlan items, 3 longTermHabits.
Reference real Indian data: ARAI vehicle emission figures, BEE star ratings, CPCB waste data, MNRE renewable data, CEA grid intensity (0.716 kgCO₂/kWh).
India emits ${REAL_DATA.INDIA_CO2_BILLION_TONNES_2022} billion tonnes CO₂/year (IEA 2022). Grid CO₂ intensity is ${REAL_DATA.INDIA_GRID_CO2_INTENSITY} kg/kWh.`;
}

export function buildUserPrompt(profile, scoringResult, yearlyResult) {
  const { answers } = profile;
  const { finalScore, categoryScores, strengths, weaknesses, impactSummary } = scoringResult;
  const { annualizedMetrics, annualSummary } = yearlyResult;

  return `Analyze this Indian resident's sustainability profile:

Name: ${answers.name || 'User'}
Age Group: ${answers.ageGroup || 'not specified'}
City Type: ${answers.cityType || 'not specified'}
Living Type: ${answers.livingType || 'not specified'}

SUSTAINABILITY SCORE: ${finalScore}/100

CATEGORY SCORES:
- Transport: ${categoryScores.transport}/100
- Electricity: ${categoryScores.electricity}/100
- Food: ${categoryScores.food}/100
- Waste: ${categoryScores.waste}/100
- Water: ${categoryScores.water}/100
- Lifestyle: ${categoryScores.lifestyle}/100
- Pollution: ${categoryScores.pollution}/100
- Bonus: ${categoryScores.bonus}/100

ANNUAL FOOTPRINT:
- Total CO₂: ${annualSummary.totalPersonalCO2Tonnes} (${annualSummary.comparisonToIndiaAvg})
- Water: ${annualizedMetrics.totalWaterLitresYear.toLocaleString()} litres/year
- Electricity: ${annualizedMetrics.totalEstimatedKwhYear} kWh/year (${annualSummary.estimatedMonthlyBill}/month)
- Transport CO₂: ${annualizedMetrics.totalTransportCO2KgYear} kg/year
- Green transport share: ${annualSummary.greenTransportShare}
- Veg ratio: ${annualSummary.vegRatio}

TOP STRENGTHS: ${strengths.map(s => `${s.category}(${s.score})`).join(', ')}
TOP WEAKNESSES: ${weaknesses.map(w => `${w.category}(${w.score})`).join(', ')}

KEY IMPACTS:
${impactSummary.map(i => `- ${i}`).join('\n')}

Provide personalized, actionable recommendations with real Indian data references. Be specific with numbers — mention ₹ savings, kg CO₂ reductions, and litre savings.`;
}
