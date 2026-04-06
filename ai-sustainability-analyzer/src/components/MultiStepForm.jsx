import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SECTIONS, questions } from '../data/questions';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import { ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, Edit3 } from 'lucide-react';

export default function MultiStepForm() {
  const { answers, updateAnswer, runAnalysis } = useApp();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const sectionQuestions = useMemo(() => {
    return SECTIONS.map(s => questions.filter(q => q.section === s.id));
  }, []);

  const validateSection = (sIdx) => {
    const qs = sectionQuestions[sIdx];
    const newErrors = {};
    qs.forEach(q => {
      if (q.required && (answers[q.id] === undefined || answers[q.id] === '')) {
        newErrors[q.id] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateSection(currentSection)) return;
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowReview(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (showReview) { setShowReview(false); return; }
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await runAnalysis();
      navigate('/results');
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editSection = (idx) => {
    setShowReview(false);
    setCurrentSection(idx);
  };

  const getDisplayValue = (q, val) => {
    if (val === undefined || val === '') return '—';
    if (q.type === 'toggle') return val === 'yes' || val === true ? 'Yes' : 'No';
    if (q.type === 'radio' && q.options) {
      const opt = q.options.find(o => String(o.value) === String(val));
      return opt ? opt.label : val;
    }
    return `${val}${q.unit ? ' ' + q.unit : ''}`;
  };

  if (showReview) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="font-display text-2xl font-bold text-forest-900 mb-6 text-center">Review Your Answers</h2>
        <p className="text-center text-gray-500 mb-8">Check your answers before we analyze your sustainability profile.</p>
        {SECTIONS.map((sec, sIdx) => (
          <div key={sec.id} className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-forest-50 border-b border-forest-100">
              <div className="flex items-center gap-2">
                <span>{sec.icon}</span>
                <span className="font-semibold text-forest-900">{sec.title}</span>
              </div>
              <button onClick={() => editSection(sIdx)} className="text-forest-700 hover:text-forest-900 text-sm flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="px-5 py-3 space-y-2">
              {sectionQuestions[sIdx].map(q => (
                <div key={q.id} className="flex justify-between py-1.5 text-sm border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 flex-1">{q.question}</span>
                  <span className="font-medium text-gray-900 ml-4 text-right">{getDisplayValue(q, answers[q.id])}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-3 mt-8">
          <button onClick={handlePrev} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] py-3 rounded-xl bg-forest-800 text-white font-semibold hover:bg-forest-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing your profile...</>
            ) : (
              <><Send className="w-5 h-5" /> Get My Sustainability Score</>
            )}
          </button>
        </div>
      </div>
    );
  }

  const sec = SECTIONS[currentSection];
  const qs = sectionQuestions[currentSection];

  return (
    <div>
      <ProgressBar currentStep={currentSection + 1} totalSteps={SECTIONS.length} sectionTitle={sec.title} sectionIcon={sec.icon} />
      <h2 className="font-display text-2xl font-bold text-forest-900 mb-1">{sec.icon} {sec.title}</h2>
      <p className="text-gray-500 mb-6 text-sm">{sec.description}</p>
      {qs.map(q => (
        <QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={updateAnswer} error={errors[q.id]} />
      ))}
      <div className="flex gap-3 mt-8">
        {currentSection > 0 && (
          <button onClick={handlePrev} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>
        )}
        <button onClick={handleNext} className="flex-[2] py-3 rounded-xl bg-forest-800 text-white font-semibold hover:bg-forest-900 transition-colors flex items-center justify-center gap-2">
          {currentSection < SECTIONS.length - 1 ? (
            <>Next <ChevronRight className="w-5 h-5" /></>
          ) : (
            <><CheckCircle2 className="w-5 h-5" /> Review Answers</>
          )}
        </button>
      </div>
    </div>
  );
}
