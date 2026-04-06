import { createContext, useContext, useState, useCallback } from 'react';
import { calculateScore } from '../services/scoringEngine.js';
import { estimateYearly } from '../services/yearlyEstimator.js';
import { getAIRecommendations } from '../services/aiService.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [answers, setAnswers] = useState({});
  const [scoringResult, setScoringResult] = useState(null);
  const [yearlyResult, setYearlyResult] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const updateAnswer = useCallback((id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const updateAnswers = useCallback((obj) => {
    setAnswers(prev => ({ ...prev, ...obj }));
  }, []);

  const getProfile = useCallback(() => {
    return { answers };
  }, [answers]);

  const runAnalysis = useCallback(async () => {
    try {
      setAnalysisError(null);
      setIsAiLoading(true);

      const scoring = calculateScore(answers);
      setScoringResult(scoring);

      const yearly = estimateYearly(answers, scoring.finalScore);
      setYearlyResult(yearly);

      const profile = { answers };
      const recommendations = await getAIRecommendations(profile, scoring, yearly);
      setAiRecommendations(recommendations);

      setIsComplete(true);
      return { scoring, yearly, recommendations };
    } catch (error) {
      setAnalysisError(error.message);
      throw error;
    } finally {
      setIsAiLoading(false);
    }
  }, [answers]);

  const resetAll = useCallback(() => {
    setAnswers({});
    setScoringResult(null);
    setYearlyResult(null);
    setAiRecommendations(null);
    setIsAiLoading(false);
    setAnalysisError(null);
    setIsComplete(false);
  }, []);

  return (
    <AppContext.Provider value={{
      answers,
      scoringResult,
      yearlyResult,
      aiRecommendations,
      isAiLoading,
      analysisError,
      isComplete,
      updateAnswer,
      updateAnswers,
      getProfile,
      runAnalysis,
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
