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
  const { annualizedMetrics: m, annualSummary, earthImpactPercent } = yearlyResult;

  const improvements = [
    { key: 'reduce_electricity', label: 'Reduce electricity by one slab', saving: `Cuts ~${Math.round(m.yearlyElectricityCO2Kg * 0.25)} kg CO₂/year` },
    { key: 'switch_public_transport', label: 'Switch to public transport', saving: `Cuts ~${Math.round(m.yearlyTransportCO2Kg * 0.8)} kg CO₂/year` },
    { key: 'bucket_bath', label: 'Switch to bucket baths', saving: `Saves ~${Math.round((75 - 15) * 365)} litres water/year` },
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
      // A4 Landscape: 297mm × 210mm
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pdfW - w) / 2;
      const y = (pdfH - h) / 2;
      pdf.addImage(imgData, 'PNG', x, y, w, h);
      const name = answers.name || 'user';
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`sustainability-certificate-${name.toLowerCase().replace(/\s+/g, '-')}-${date}.pdf`);
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
          {earthImpactPercent && (
            <div className="mt-2 text-xs font-mono text-gray-400">You contribute {earthImpactPercent}% of India&apos;s annual CO₂ emissions</div>
          )}
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
              <div className="text-4xl font-mono font-extrabold text-forest-800">{annualSummary.totalPersonalCO2Tonnes}</div>
              <div className="text-sm text-gray-500">Your CO₂e/year</div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 w-24">You</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-600 rounded-full" style={{ width: `${Math.min(100, (m.totalCO2KgYear / 4700) * 100)}%` }} />
                </div>
                <span className="text-xs font-mono font-medium w-20 text-right">{annualSummary.totalPersonalCO2Tonnes}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 w-24">India avg</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(1900 / 4700) * 100}%` }} />
                </div>
                <span className="text-xs font-mono font-medium w-20 text-right">1.90 tonnes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24">Global avg</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-xs font-mono font-medium w-20 text-right">4.70 tonnes</span>
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
                <span className="font-mono font-bold text-green-700">{s.score}/100</span>
              </div>
            ))}
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
            <h4 className="font-semibold text-red-900 flex items-center gap-2 mb-3"><TrendingDown className="w-5 h-5" /> Areas to Improve</h4>
            {weaknesses.map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                <span className="text-sm text-red-800">{getCategoryIcon(w.category)} {getCategoryLabel(w.category)}</span>
                <span className="font-mono font-bold text-red-700">{w.score}/100</span>
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
              <div className="text-2xl font-mono font-bold text-gray-400">{finalScore}</div>
              <div className="text-xs text-gray-400">Current</div>
            </div>
            <ArrowRight className="w-6 h-6 text-forest-500" />
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-forest-700">{improvedResult.finalScore}</div>
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

      {/* ═══ Hidden A4 LANDSCAPE Certificate for PDF ═══ */}
      <div ref={reportRef} id="report-content" style={{ display: 'none', width: '1123px', height: '794px', background: 'white', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '10px solid #14532d', borderRadius: '4px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '2px solid #86efac', borderRadius: '2px', pointerEvents: 'none' }} />

        {/* Corner leaf decorations */}
        <div style={{ position: 'absolute', top: '18px', left: '18px', fontSize: '24px', opacity: 0.3 }}>🌿</div>
        <div style={{ position: 'absolute', top: '18px', right: '18px', fontSize: '24px', opacity: 0.3 }}>🌿</div>
        <div style={{ position: 'absolute', bottom: '18px', left: '18px', fontSize: '24px', opacity: 0.3 }}>🌱</div>
        <div style={{ position: 'absolute', bottom: '18px', right: '18px', fontSize: '24px', opacity: 0.3 }}>🌱</div>

        <div style={{ padding: '35px 40px 25px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          {/* Top Row: Header + Score Circle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            {/* Left: Title */}
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>AI Sustainability Analyzer</div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', color: '#14532d', margin: 0, fontWeight: '700' }}>Sustainability Certificate</h1>
              <div style={{ width: '60px', height: '3px', background: 'linear-gradient(to right, #16a34a, #14532d)', margin: '6px 0', borderRadius: '2px' }} />
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>This certifies that</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', color: '#14532d', fontWeight: '700', margin: '2px 0 0' }}>{answers.name || 'Participant'}</p>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>Assessed on {getReportDate()}</p>
            </div>

            {/* Right: Score Circle */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: '110px', height: '110px', borderRadius: '50%', border: `6px solid ${scoreBand.color}`, background: '#f0fdf4', lineHeight: '98px', position: 'relative' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '40px', fontWeight: '800', color: scoreBand.color }}>{finalScore}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: '700', color: scoreBand.color, marginTop: '4px' }}>{scoreBand.label}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>out of 100</div>
            </div>
          </div>

          {/* Middle Section: 3 columns */}
          <div style={{ display: 'flex', gap: '14px', flex: 1 }}>
            {/* Column 1: Category Scores */}
            <div style={{ flex: '1', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', padding: '12px' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', color: '#14532d', margin: '0 0 8px', textAlign: 'center', fontWeight: '600' }}>Category Performance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {Object.entries(categoryScores).map(([cat, score]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', background: 'white', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '13px' }}>{getCategoryIcon(cat)}</span>
                      <span style={{ fontSize: '10px', color: '#374151' }}>{getCategoryLabel(cat)}</span>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700', color: score >= 65 ? '#16a34a' : score >= 50 ? '#84cc16' : score >= 35 ? '#d97706' : '#dc2626' }}>{score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Annual Footprint */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', padding: '10px', flex: 1 }}>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', color: '#14532d', margin: '0 0 8px', textAlign: 'center', fontWeight: '600' }}>Annual Footprint</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Carbon</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: '800', color: '#14532d' }}>{annualSummary.totalPersonalCO2Tonnes}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Water</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: '800', color: '#14532d' }}>{annualSummary.yearlyWater}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Electricity</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: '800', color: '#14532d' }}>{m.yearlyUnits} kWh</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '6px', background: 'white', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>vs India Avg</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: '700', color: m.totalCO2KgYear > 1900 ? '#dc2626' : '#16a34a' }}>{annualSummary.vsGlobalAvg}</div>
                  </div>
                </div>
              </div>
              {earthImpactPercent && (
                <div style={{ textAlign: 'center', padding: '8px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Earth Impact</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: '800', color: '#1e40af' }}>{earthImpactPercent}%</div>
                  <div style={{ fontSize: '8px', color: '#6b7280' }}>of India&apos;s total CO₂</div>
                </div>
              )}
            </div>

            {/* Column 3: Recommendations */}
            <div style={{ flex: '1.2' }}>
              {aiRecommendations && (
                <div style={{ background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', padding: '12px', height: '100%' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', color: '#92400e', margin: '0 0 8px', fontWeight: '600' }}>Key Recommendations</h3>
                  {aiRecommendations.immediateActions && aiRecommendations.immediateActions.slice(0, 4).map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '10px', marginBottom: '6px' }}>
                      <span style={{ color: '#16a34a', fontWeight: '800', flexShrink: 0 }}>{i + 1}.</span>
                      <div>
                        <strong style={{ color: '#14532d' }}>{a.action}</strong>
                        <span style={{ color: '#6b7280' }}> — {a.estimatedSaving}</span>
                      </div>
                    </div>
                  ))}
                  {aiRecommendations.weeklyImprovements && (
                    <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '3px' }}>Weekly Habits</div>
                      {aiRecommendations.weeklyImprovements.slice(0, 3).map((h, i) => (
                        <div key={i} style={{ fontSize: '9px', color: '#78716c', marginBottom: '2px' }}>• {h.habit}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '2px solid #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Certificate ID: SA-{Date.now().toString(36).toUpperCase()}</div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Data sources: ARAI, BEE, CEA, CPCB, CWC, IEA, TANGEDCO, IPCC</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', color: '#14532d', fontWeight: '600' }}>AI Sustainability Analyzer</div>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Powered by verified Indian environmental data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
