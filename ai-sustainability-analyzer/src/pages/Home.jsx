import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, BarChart3, Sparkles, Droplets, Zap, Truck, Utensils, Trash2, ShoppingBag, Wind, Leaf } from 'lucide-react';
import REAL_DATA from '../data/realWorldData';

const stats = [
  { value: `${REAL_DATA.INDIA_CO2_BILLION_TONNES_2022}B tonnes`, label: 'CO2/year (IEA 2022)', icon: Wind },
  { value: `${REAL_DATA.INDIA_WATER_STRESS_POPULATION_M}M`, label: 'Indians face water scarcity', icon: Droplets },
  { value: `${REAL_DATA.INDIA_SOLID_WASTE_PROCESSED_PERCENT}%`, label: 'solid waste processed', icon: Trash2 },
  { value: `${REAL_DATA.INDIA_PLASTIC_WASTE_MT_PER_YEAR}MT`, label: 'plastic waste/year', icon: ShoppingBag },
];

const categories = [
  { icon: Truck, name: 'Transportation', weight: 20, stat: `Transport = ${REAL_DATA.INDIA_TRANSPORT_GHG_PERCENT}% of India's GHG (MoEFCC)` },
  { icon: Zap, name: 'Electricity', weight: 15, stat: `Grid CO2: ${REAL_DATA.INDIA_GRID_CO2_INTENSITY} kg/kWh (CEA 2023)` },
  { icon: Utensils, name: 'Food & Diet', weight: 15, stat: `Veg meal: 0.7 kg CO2e vs chicken: 2.4 kg (IPCC)` },
  { icon: Trash2, name: 'Waste', weight: 15, stat: `India generates ${REAL_DATA.INDIA_SOLID_WASTE_MT_PER_YEAR}MT solid waste/yr` },
  { icon: Droplets, name: 'Water', weight: 10, stat: `Per capita: ${REAL_DATA.INDIA_WATER_PER_CAPITA_CUBIC_M} m3/yr (stress: 1,700)` },
  { icon: ShoppingBag, name: 'Lifestyle', weight: 10, stat: 'Fashion = 10% of global carbon (UNEP)' },
  { icon: Wind, name: 'Pollution', weight: 10, stat: `Delhi: ${REAL_DATA.DELHI_AQI_BAD_DAYS_PER_YEAR} days/yr AQI>200 (CPCB)` },
  { icon: Leaf, name: 'Green Bonus', weight: 5, stat: `${REAL_DATA.INDIA_RENEWABLE_ENERGY_PERCENT}% renewable capacity (MNRE 2024)` },
];

const steps = [
  { num: 1, icon: ClipboardList, title: 'Answer Questions', desc: '55 questions across 9 categories about your daily habits' },
  { num: 2, icon: BarChart3, title: 'Get Your Score', desc: 'Science-backed scoring using real Indian environmental data' },
  { num: 3, icon: Sparkles, title: 'AI Action Plan', desc: 'Personalized recommendations with real savings estimates' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-forest-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Know Your Environmental Impact.</h1>
          <p className="text-forest-200 text-lg mb-8 max-w-2xl mx-auto">
            Answer 55 questions. Get a science-backed sustainability score, real CO2 footprint calculation, and AI-powered Indian lifestyle recommendations.
          </p>
          <Link to="/assessment" className="inline-flex items-center gap-2 bg-white text-forest-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-forest-100 transition-colors">
            Start Free Assessment <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-forest-400 text-sm mt-4">Takes 5-8 minutes · No login required · Powered by real Indian environmental data</p>
        </div>
      </section>

      {/* India Stats Bar */}
      <section className="bg-forest-800 py-4 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-white">
              <s.icon className="w-5 h-5 text-forest-300 flex-shrink-0" />
              <div>
                <div className="font-bold text-sm">{s.value}</div>
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
                <div className="text-xs text-forest-600 font-bold mb-1">STEP {s.num}</div>
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
                <div className="text-xs text-forest-600 font-medium mb-1">Weight: {c.weight}%</div>
                <p className="text-xs text-gray-500">{c.stat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-forest-800 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to calculate your sustainability score?</h2>
          <p className="text-forest-200 mb-8">Join thousands taking action for a greener India.</p>
          <Link to="/assessment" className="inline-flex items-center gap-2 bg-white text-forest-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-forest-100 transition-colors">
            Start Assessment <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
