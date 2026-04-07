import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { simulateImprovedScore } from '../services/scoringEngine';
import { formatCO2, getCategoryLabel, getCategoryIcon, getReportDate } from '../services/helpers';
import REAL_DATA from '../data/realWorldData';
import ScoreGauge from '../components/ScoreGauge';
import CategoryBreakdown from '../components/CategoryBreakdown';
import AnnualProjectionCard from '../components/AnnualProjectionCard';
import RecommendationCard from '../components/RecommendationCard';
import { Download, RotateCcw, Loader2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export default function Results() {
  const { answers, scoringResult, yearlyResult, aiRecommendations, isAiLoading } = useApp();
  const navigate = useNavigate();
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (!scoringResult) navigate('/assessment');
  }, [scoringResult, navigate]);

  if (!scoringResult || !yearlyResult) return null;

  const { finalScore, scoreBand, categoryScores, strengths, weaknesses, impactSummary } = scoringResult;
  const { annualizedMetrics: m, annualSummary } = yearlyResult;

  const improvements = [
    { key: 'bucket_bath', label: 'Switch to bucket bath', saving: `Saves ~${Math.round((REAL_DATA.MEDIUM_SHOWER_10MIN_LITRES - REAL_DATA.BUCKET_BATH_LITRES) * 365)} litres/year` },
    { key: 'reduce_ac', label: 'Reduce AC usage by half', saving: `Cuts ~${Math.round((Number(answers.acHoursPerWeek) || 0) / 2 * REAL_DATA.AC_1P5TON_3STAR_KWH_PER_HR * REAL_DATA.INDIA_GRID_CO2_INTENSITY * 52)} kg CO₂/year` },
    { key: 'use_public_transport', label: 'Switch to public transport', saving: `Cuts ~${Math.round(m.totalTransportCO2KgYear * 0.6)} kg CO2/year` },
  ];

  const improvedResult = simulateImprovedScore(answers, improvements.map(i => i.key));

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const el = reportRef.current;
      if (!el) return;
      el.style.display = 'block';
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      el.style.display = 'none';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let position = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      if (pdfH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      } else {
        while (position < pdfH) {
          pdf.addImage(imgData, 'PNG', 0, -position, pdfW, pdfH);
          position += pageH;
          if (position < pdfH) pdf.addPage();
        }
      }
      const name = answers.name || 'user';
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`sustainability-report-${name.toLowerCase().replace(/\s+/g, '-')}-${date}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Score Hero */}
        <div className="text-center">
          <ScoreGauge score={finalScore} size="lg" />
          <div className="mt-2 text-sm text-gray-500">{getReportDate()}</div>
          {answers.name && <div className="text-lg font-semibold text-gray-800 mt-1">{answers.name}&apos;s Sustainability Profile</div>}
        </div>

        {/* Category Breakdown & Annual Projection */}
        <div className="grid lg:grid-cols-2 gap-8">
          <CategoryBreakdown categoryScores={categoryScores} />
          <AnnualProjectionCard yearlyResult={yearlyResult} weeklyScore={finalScore} />
        </div>

        {/* CO2 Footprint Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-display text-xl font-bold text-forest-900 mb-4">Carbon Footprint Summary</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-forest-800">{annualSummary.totalPersonalCO2Tonnes}</div>
              <div className="text-sm text-gray-500">Your CO2e/year</div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 w-24">You</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-600 rounded-full" style={{ width: `${Math.min(100, (m.totalCO2eKgYear / 4700) * 100)}%` }} />
                </div>
                <span className="text-xs font-medium w-20 text-right">{annualSummary.totalPersonalCO2Tonnes}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 w-24">India avg</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(1900 / 4700) * 100}%` }} />
                </div>
                <span className="text-xs font-medium w-20 text-right">1.90 tonnes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24">Global avg</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-xs font-medium w-20 text-right">4.70 tonnes</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">{annualSummary.comparisonToIndiaAvg}</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <h4 className="font-semibold text-green-900 flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5" /> Strengths</h4>
            {strengths.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-green-100 last:border-0">
                <span className="text-sm text-green-800">{getCategoryIcon(s.category)} {getCategoryLabel(s.category)}</span>
                <span className="font-bold text-green-700">{s.score}/100</span>
              </div>
            ))}
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
            <h4 className="font-semibold text-red-900 flex items-center gap-2 mb-3"><TrendingDown className="w-5 h-5" /> Areas to Improve</h4>
            {weaknesses.map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                <span className="text-sm text-red-800">{getCategoryIcon(w.category)} {getCategoryLabel(w.category)}</span>
                <span className="font-bold text-red-700">{w.score}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Statements */}
        {impactSummary.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-display text-xl font-bold text-forest-900 mb-3">Key Impacts</h3>
            <ul className="space-y-2">
              {impactSummary.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-forest-600 font-bold">&#8226;</span>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Simulation */}
        <div className="bg-gradient-to-r from-forest-50 to-white rounded-2xl border border-forest-200 p-6">
          <h3 className="font-display text-xl font-bold text-forest-900 mb-4">What If You Changed?</h3>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {improvements.map((imp, i) => (
              <div key={i} className="bg-white rounded-xl border border-forest-200 p-3">
                <div className="font-medium text-sm text-forest-900">{imp.label}</div>
                <div className="text-xs text-forest-600 mt-1">{imp.saving}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{finalScore}</div>
              <div className="text-xs text-gray-400">Current</div>
            </div>
            <ArrowRight className="w-6 h-6 text-forest-500" />
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-700">{improvedResult.finalScore}</div>
              <div className="text-xs text-forest-600">Projected</div>
            </div>
            <div className="text-sm text-forest-700 font-medium ml-2">
              +{improvedResult.finalScore - finalScore} points improvement possible!
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <RecommendationCard recommendations={aiRecommendations} isLoading={isAiLoading} source={aiRecommendations?.source} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleDownloadPDF} disabled={pdfLoading} className="flex items-center justify-center gap-2 bg-forest-800 text-white px-8 py-3 rounded-xl font-semibold hover:bg-forest-900 transition-colors disabled:opacity-60">
            {pdfLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {pdfLoading ? 'Generating PDF...' : 'Download Full Report (PDF)'}
          </button>
          <Link to="/assessment" className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-5 h-5" /> Retake Assessment
          </Link>
        </div>
      </div>

      {/* Hidden Report for PDF */}
      <div ref={reportRef} id="report-content" style={{ display: 'none', width: '800px', padding: '40px', background: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#14532d', margin: '0 0 5px' }}>AI Sustainability Analyzer Report</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>{getReportDate()} {answers.name ? `| ${answers.name}` : ''}</p>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '64px', fontWeight: '800', color: scoreBand.color }}>{finalScore}</div>
          <div style={{ fontSize: '20px', color: scoreBand.color, fontWeight: '600' }}>{scoreBand.label}</div>
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#14532d', borderBottom: '2px solid #dcfce7', paddingBottom: '8px', marginBottom: '15px' }}>Category Scores</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '13px' }}>
          <thead><tr style={{ background: '#f0fdf4' }}><th style={{ textAlign: 'left', padding: '8px', border: '1px solid #dcfce7' }}>Category</th><th style={{ textAlign: 'center', padding: '8px', border: '1px solid #dcfce7' }}>Score</th><th style={{ textAlign: 'center', padding: '8px', border: '1px solid #dcfce7' }}>Weight</th></tr></thead>
          <tbody>
            {Object.entries(categoryScores).map(([cat, score]) => (
              <tr key={cat}><td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{getCategoryIcon(cat)} {getCategoryLabel(cat)}</td><td style={{ textAlign: 'center', padding: '8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{score}/100</td><td style={{ textAlign: 'center', padding: '8px', border: '1px solid #e5e7eb' }}>{cat === 'transport' ? 20 : cat === 'bonus' ? 5 : cat === 'water' || cat === 'lifestyle' || cat === 'pollution' ? 10 : 15}%</td></tr>
            ))}
          </tbody>
        </table>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#14532d', borderBottom: '2px solid #dcfce7', paddingBottom: '8px', marginBottom: '15px' }}>Annual Footprint</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '13px' }}>
          <tbody>
            <tr><td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Total CO2e</td><td style={{ padding: '8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{annualSummary.totalPersonalCO2Tonnes}</td></tr>
            <tr><td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Electricity</td><td style={{ padding: '8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{m.totalEstimatedKwhYear} kWh/yr ({annualSummary.estimatedMonthlyBill}/mo)</td></tr>
            <tr><td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Water</td><td style={{ padding: '8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{m.totalWaterLitresYear.toLocaleString()} L/yr</td></tr>
            <tr><td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>Transport CO2</td><td style={{ padding: '8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{formatCO2(m.totalTransportCO2KgYear)}/yr</td></tr>
            <tr><td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>vs India Average</td><td style={{ padding: '8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{annualSummary.comparisonToIndiaAvg}</td></tr>
          </tbody>
        </table>
        {impactSummary.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#14532d', borderBottom: '2px solid #dcfce7', paddingBottom: '8px', marginBottom: '15px' }}>Key Impacts</h2>
            <ul style={{ fontSize: '13px', lineHeight: '1.8', marginBottom: '25px' }}>
              {impactSummary.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </>
        )}
        {aiRecommendations && (
          <>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#14532d', borderBottom: '2px solid #dcfce7', paddingBottom: '8px', marginBottom: '15px' }}>AI Recommendations</h2>
            <p style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '15px' }}>{aiRecommendations.summary}</p>
            {aiRecommendations.immediateActions && (
              <ul style={{ fontSize: '13px', lineHeight: '1.8' }}>
                {aiRecommendations.immediateActions.map((a, i) => <li key={i}><strong>{a.action}</strong> — {a.estimatedSaving}</li>)}
              </ul>
            )}
          </>
        )}
        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
          Generated by AI Sustainability Analyzer | Data: ARAI, BEE, CEA, CPCB, CWC, IEA | {getReportDate()}
        </div>
      </div>
    </div>
  );
}
