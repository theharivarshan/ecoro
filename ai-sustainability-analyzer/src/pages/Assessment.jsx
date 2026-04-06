import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MultiStepForm from '../components/MultiStepForm';

export default function Assessment() {
  const { answers } = useApp();

  useEffect(() => {
    const filledCount = Object.values(answers).filter(v => v !== undefined && v !== '').length;
    if (filledCount < 5) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved answers. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [answers]);

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <MultiStepForm />
      </div>
    </div>
  );
}
