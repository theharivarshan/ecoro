import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-gray-400 py-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Leaf className="w-5 h-5 text-forest-400" />
          <span className="font-display font-semibold text-white">AI Sustainability Analyzer</span>
        </div>
        <p className="text-sm max-w-xl mx-auto mb-4">
          Scores calculated using verified Indian environmental data from ARAI, BEE, CEA, CPCB, CWC, and IEA.
          AI provides interpretation, not scores.
        </p>
        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} AI Sustainability Analyzer. For educational purposes.</p>
      </div>
    </footer>
  );
}
