import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, BookOpen, Target, ArrowRight, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CLASSES = ['9', '10', '11', '12', 'JEE', 'NEET'];
const STREAMS = ['Science', 'Commerce', 'Arts'];
const SUBJECTS = {
  Science: ['Physics', 'Chemistry', 'Maths', 'Biology', 'English'],
  Commerce: ['Accountancy', 'Business Studies', 'Economics', 'Maths', 'English'],
  Arts: ['History', 'Geography', 'Political Science', 'Economics', 'English', 'SST']
};
const GOALS = ['Revision', 'One-shot learning', 'Detailed lectures', 'Practice sessions'];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    class: '',
    stream: '',
    subjects: [] as string[],
    study_goal: ''
  });

  const handleComplete = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...formData,
        onboarded: true,
        updated_at: new Date().toISOString()
      });

    if (!error) onComplete();
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Step {step} of 4</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Personalize your study experience</h1>
          <p className="text-slate-500 mt-1">Focus2 adapts to your goals and curriculum.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <GraduationCap size={18} /> Select your Class
              </label>
              <div className="grid grid-cols-3 gap-4">
                {CLASSES.map(c => (
                  <motion.button
                    key={c}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setFormData({ ...formData, class: c }); nextStep(); }}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all text-center font-black text-lg",
                      formData.class === c 
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100" 
                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
                    )}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <BookOpen size={18} /> Select your Stream
              </label>
              <div className="space-y-4">
                {STREAMS.map(s => (
                  <motion.button
                    key={s}
                    whileHover={{ x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setFormData({ ...formData, stream: s }); nextStep(); }}
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 transition-all flex justify-between items-center font-black text-lg",
                      formData.stream === s 
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100" 
                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
                    )}
                  >
                    {s}
                    <ChevronRight size={20} />
                  </motion.button>
                ))}
              </div>
              <button onClick={prevStep} className="mt-6 text-sm text-slate-400 hover:text-slate-600 font-medium">Back</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <BookOpen size={18} /> Select your Subjects
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(SUBJECTS[formData.stream as keyof typeof SUBJECTS] || []).map(s => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const subjects = formData.subjects.includes(s)
                        ? formData.subjects.filter(item => item !== s)
                        : [...formData.subjects, s];
                      setFormData({ ...formData, subjects });
                    }}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-sm font-black",
                      formData.subjects.includes(s) 
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100" 
                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
                    )}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-between items-center mt-8">
                <button onClick={prevStep} className="text-sm text-slate-400 hover:text-slate-600 font-medium">Back</button>
                <button 
                  disabled={formData.subjects.length === 0}
                  onClick={nextStep}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Target size={18} /> What is your Study Goal?
              </label>
              <div className="space-y-4">
                {GOALS.map(g => (
                  <motion.button
                    key={g}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, study_goal: g })}
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 transition-all flex justify-between items-center font-black text-lg",
                      formData.study_goal === g 
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100" 
                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
                    )}
                  >
                    {g}
                    {formData.study_goal === g && <motion.div layoutId="goal-dot" className="w-3 h-3 rounded-full bg-blue-600" />}
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-between items-center mt-8">
                <button onClick={prevStep} className="text-sm text-slate-400 hover:text-slate-600 font-medium">Back</button>
                <button 
                  disabled={!formData.study_goal}
                  onClick={handleComplete}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
