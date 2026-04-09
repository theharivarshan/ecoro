import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, BarChart3, Sparkles, Droplets, Zap, Truck, Utensils, Trash2, ShoppingBag, Leaf, Globe } from 'lucide-react';
import REAL_DATA from '../data/realWorldData';

const stats = [
  { value: `${REAL_DATA.INDIA_CO2_BILLION_TONNES_2022}B tonnes`, label: 'CO₂/year (IEA 2022)', icon: Globe },
  { value: `${REAL_DATA.INDIA_WATER_STRESS_POPULATION_M}M`, label: 'Indians face water scarcity', icon: Droplets },
  { value: `${REAL_DATA.INDIA_SOLID_WASTE_PROCESSED_PERCENT}%`, label: 'solid waste processed', icon: Trash2 },
  { value: `${REAL_DATA.INDIA_PER_CAPITA_CO2_TONNES}t`, label: 'CO₂ per person/year', icon: Zap },
];

const categories = [
  { icon: Zap, name: 'Electricity', weight: 18, stat: `Grid CO₂: ${REAL_DATA.INDIA_GRID_CO2_INTENSITY} kg/kWh (CEA 2023)` },
  { icon: Truck, name: 'Transportation', weight: 18, stat: `Transport = ${REAL_DATA.INDIA_TRANSPORT_GHG_PERCENT}% of India's GHG` },
  { icon: Utensils, name: 'Food & Diet', weight: 16, stat: 'Veg: 0.7 kg CO₂e vs Chicken: 2.4 kg (IPCC)' },
  { icon: Droplets, name: 'Water Usage', weight: 14, stat: `BIS standard: ${REAL_DATA.INDIA_DAILY_WATER_PER_CAPITA_LITRES}L/person/day` },
  { icon: Trash2, name: 'Waste & Recycling', weight: 14, stat: `India generates ${REAL_DATA.INDIA_SOLID_WASTE_MT_PER_YEAR}MT solid waste/yr` },
  { icon: ShoppingBag, name: 'Shopping & Digital', weight: 10, stat: `${REAL_DATA.INDIA_INTERNET_USERS_M}M internet users, ${REAL_DATA.INDIA_AVG_DATA_GB_PER_MONTH} GB/month avg` },
  { icon: Leaf, name: 'Green Habits', weight: 10, stat: `${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity (MNRE 2024)` },
];

const steps = [
  { num: 1, icon: ClipboardList, title: 'Answer Simple Questions', desc: 'Monthly bills, daily habits, food preferences — things you already know' },
  { num: 2, icon: BarChart3, title: 'Get Your Score', desc: 'Science-backed scoring using real Indian data from ARAI, BEE, CEA, CPCB' },
  { num: 3, icon: Sparkles, title: 'AI Recommendations', desc: 'Personalized action plan with real impact estimates for your lifestyle' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-forest-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-xs tracking-widest text-forest-400 uppercase mb-4">// sustainability.analyze()</div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight">Know Your Environmental Impact.</h1>
          <p className="text-forest-200 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Answer simple questions about your monthly bills, food habits, and daily choices. Get your sustainability score, CO₂ footprint, and personalized recommendations.
          </p>
          <Link to="/assessment" className="inline-flex items-center gap-2 bg-white text-forest-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-forest-100 transition-all hover:scale-105 shadow-lg">
            Start Free Assessment <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-forest-400 text-sm mt-4 font-mono tracking-wide">5–8 min · No login · Real Indian environmental data</p>
        </div>
      </section>

      {/* India Stats Bar */}
      <section className="bg-forest-800 py-4 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-white">
              <s.icon className="w-5 h-5 text-forest-300 flex-shrink-0" />
              <div>
                <div className="font-mono font-bold text-sm">{s.value}</div>
                <div className="text-forest-300 text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-forest-900 mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(s => (
              <div key={s.num} className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-forest-700" />
                </div>
                <div className="text-xs text-forest-600 font-mono font-bold mb-1">STEP {s.num}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-forest-900 mb-10">What We Analyze</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:-translate-y-1 hover:shadow-md transition-all">
                <c.icon className="w-8 h-8 text-forest-600 mb-2" />
                <h4 className="font-semibold text-gray-900 text-sm">{c.name}</h4>
                <div className="text-xs text-forest-600 font-mono font-medium mb-1">Weight: {c.weight}%</div>
                <p className="text-xs text-gray-500">{c.stat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-forest-800 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to know your sustainability score?</h2>
          <p className="text-forest-200 mb-8">Simple questions a common person can answer. Real data. Real impact.</p>
          <Link to="/assessment" className="inline-flex items-center gap-2 bg-white text-forest-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-forest-100 transition-all hover:scale-105 shadow-lg">
            Start Assessment <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
