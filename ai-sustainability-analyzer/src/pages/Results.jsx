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
import { Download, RotateCcw, Loader2, TrendingUp, TrendingDown, ArrowRight, Award } from 'lucide-react';

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
            {pdfLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
            {pdfLoading ? 'Generating Certificate...' : 'Download Certificate (PDF)'}
          </button>
          <Link to="/assessment" className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-5 h-5" /> Retake Assessment
          </Link>
        </div>
      </div>

      {/* Hidden A4 Certificate for PDF */}
      <div ref={reportRef} id="report-content" style={{ display: 'none', width: '794px', minHeight: '1123px', background: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '12px solid #14532d', borderRadius: '4px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '12px', border: '2px solid #86efac', borderRadius: '2px', pointerEvents: 'none' }} />

        {/* Corner leaf decorations */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '28px', opacity: 0.3 }}>🌿</div>
        <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '28px', opacity: 0.3 }}>🌿</div>
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '28px', opacity: 0.3 }}>🌱</div>
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '28px', opacity: 0.3 }}>🌱</div>

        <div style={{ padding: '50px 45px 40px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', letterSpacing: '4px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>AI Sustainability Analyzer</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#14532d', margin: '0 0 4px', fontWeight: '700' }}>Certificate of Assessment</h1>
            <div style={{ width: '80px', height: '3px', background: 'linear-gradient(to right, #16a34a, #14532d)', margin: '10px auto', borderRadius: '2px' }} />
          </div>

          {/* Name & Date */}
          <div style={{ textAlign: 'center', margin: '18px 0' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>This certifies that</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '30px', color: '#14532d', fontWeight: '700', margin: '0 0 4px' }}>{answers.name || 'Participant'}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>has completed the sustainability assessment on {getReportDate()}</p>
          </div>

          {/* Score Circle */}
          <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
            <div style={{ display: 'inline-block', width: '120px', height: '120px', borderRadius: '50%', border: `6px solid ${scoreBand.color}`, background: '#f0fdf4', lineHeight: '108px', position: 'relative' }}>
              <span style={{ fontSize: '44px', fontWeight: '800', color: scoreBand.color }}>{finalScore}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: scoreBand.color, marginTop: '6px' }}>{scoreBand.label}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>out of 100</div>
          </div>

          {/* Category Scores - compact grid */}
          <div style={{ margin: '16px 0', padding: '14px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: '#14532d', margin: '0 0 10px', textAlign: 'center' }}>Category Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              {Object.entries(categoryScores).map(([cat, score]) => (
                <div key={cat} style={{ textAlign: 'center', padding: '6px 4px', background: 'white', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{getCategoryIcon(cat)}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>{getCategoryLabel(cat)}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: score >= 65 ? '#16a34a' : score >= 50 ? '#84cc16' : score >= 35 ? '#d97706' : '#dc2626' }}>{score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Annual Footprint Summary */}
          <div style={{ margin: '14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Carbon Footprint</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#14532d' }}>{annualSummary.totalPersonalCO2Tonnes}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>India avg: 1.9 tonnes</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Water Usage</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#14532d' }}>{(m.totalWaterLitresYear / 1000).toFixed(1)} kL</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>per year</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Green Transport</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#14532d' }}>{annualSummary.greenTransportShare}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>of your travel</div>
            </div>
          </div>

          {/* AI Recommendations */}
          {aiRecommendations && (
            <div style={{ margin: '14px 0', padding: '14px 16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: '#92400e', margin: '0 0 8px' }}>Personalized Recommendations</h3>
              <p style={{ fontSize: '11px', color: '#78716c', lineHeight: '1.5', margin: '0 0 8px' }}>{aiRecommendations.summary}</p>
              {aiRecommendations.immediateActions && (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {aiRecommendations.immediateActions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px' }}>
                      <span style={{ color: '#16a34a', fontWeight: '800', flexShrink: 0 }}>{i + 1}.</span>
                      <div>
                        <strong style={{ color: '#14532d' }}>{a.action}</strong>
                        <span style={{ color: '#6b7280' }}> — {a.estimatedSaving}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {aiRecommendations.weeklyImprovements && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Weekly Habits to Build</div>
                  {aiRecommendations.weeklyImprovements.map((h, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#78716c', marginBottom: '3px' }}>• {h.habit}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Impacts */}
          {impactSummary.length > 0 && (
            <div style={{ margin: '10px 0', padding: '10px 16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '13px', color: '#991b1b', margin: '0 0 6px' }}>Key Environmental Impacts</h3>
              {impactSummary.slice(0, 3).map((s, i) => (
                <p key={i} style={{ fontSize: '10px', color: '#78716c', margin: '0 0 3px', lineHeight: '1.4' }}>• {s}</p>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>Certificate ID: SA-{Date.now().toString(36).toUpperCase()}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>Data: ARAI, BEE, CEA, CPCB, CWC, IEA</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '14px', color: '#14532d', fontWeight: '600' }}>AI Sustainability Analyzer</div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>Powered by verified Indian environmental data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
