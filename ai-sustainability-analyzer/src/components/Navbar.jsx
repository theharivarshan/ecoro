import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Home, ClipboardList, BarChart3, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { scoringResult, resetAll } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleReset = () => {
    if (window.confirm('Reset all answers and start over?')) {
      resetAll();
      navigate('/');
    }
  };

  const linkClass = (path) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-forest-100 text-forest-800'
        : 'text-gray-600 hover:text-forest-700 hover:bg-forest-50'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-forest-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-forest-800 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-forest-900 text-lg hidden sm:block">
            AI Sustainability Analyzer
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/" className={linkClass('/')}>
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link to="/assessment" className={linkClass('/assessment')}>
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Assessment</span>
          </Link>
          {scoringResult && (
            <Link to="/results" className={linkClass('/results')}>
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
            </Link>
          )}
          {scoringResult && (
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-1">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
