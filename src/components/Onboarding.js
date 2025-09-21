import React, { useState } from 'react';

// Simple onboarding to capture basic metrics and compute calorie targets
// Assumptions:
// - Units: pounds (lb) for weight, inches (in) for height, years for age
// - Activity factor: 1.2 (sedentary) for initial estimate
// - Goal offset: -500 kcal/day if goal weight < current weight; +300 if gaining
// - If user supplies an explicit daily intake, use that instead
export default function Onboarding({ onComplete }) {
  const [heightIn, setHeightIn] = useState('68');
  const [weightLb, setWeightLb] = useState('160');
  const [age, setAge] = useState('20');
  const [goalWeightLb, setGoalWeightLb] = useState('155');
  const [explicitDaily, setExplicitDaily] = useState(''); // optional override
  const [submitting, setSubmitting] = useState(false);

  const computeDailyCalories = () => {
    const h = parseFloat(heightIn) || 0;
    const w = parseFloat(weightLb) || 0;
    const a = parseFloat(age) || 0;
    const gw = parseFloat(goalWeightLb) || 0;

    // Convert to metric for Mifflin-St Jeor (male approximation; no gender captured)
    // Mifflin (male): 10*kg + 6.25*cm - 5*age + 5
    // Use neutral offset of +5; this is a simplification
    const kg = w * 0.45359237;
    const cm = h * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * a + 5;
    const activity = 1.2; // sedentary default
    const tdee = Math.max(Math.round(bmr * activity), 0);

    if (explicitDaily) {
      return Math.max(parseInt(explicitDaily, 10) || 0, 0);
    }

    // Goal adjustment
    let delta = 0;
    if (gw && w) {
      if (gw < w) delta = -500; // losing weight
      else if (gw > w) delta = 300; // gaining weight
    }
    return Math.max(tdee + delta, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const dailyGoal = computeDailyCalories();
    const mealTarget = Math.max(Math.round(dailyGoal / 3), 0); // simple 3-meals split

    try {
      localStorage.setItem('onboarding.dailyGoalCalories', String(dailyGoal));
      localStorage.setItem('onboarding.mealCalories', String(mealTarget));
      localStorage.setItem('onboarding.metrics', JSON.stringify({
        heightIn,
        weightLb,
        age,
        goalWeightLb,
        explicitDaily,
      }));
    } catch {}

    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-purdue-gold p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-black rounded-2xl shadow-lg border border-gray-800 p-6 md:p-8 card-elevate animate-scale-in">
        <h1 className="text-3xl font-bold mb-2 animate-fade-in-up">Tell us about you</h1>
        <p className="text-gray-300 mb-6 animate-fade-in-up">We'll estimate your daily calories and a per-meal target. You can change these later.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="animate-fade-in-up">
            <label className="block text-sm mb-1">Height (inches)</label>
            <input type="number" inputMode="numeric" className="w-full p-2 rounded-md bg-neutral-900 border border-gray-700 focus:ring-2 focus:ring-purdue-gold focus-glow" 
              value={heightIn} onChange={(e)=>setHeightIn(e.target.value)} />
          </div>
          <div className="animate-fade-in-up">
            <label className="block text-sm mb-1">Weight (lb)</label>
            <input type="number" inputMode="numeric" className="w-full p-2 rounded-md bg-neutral-900 border border-gray-700 focus:ring-2 focus:ring-purdue-gold focus-glow" 
              value={weightLb} onChange={(e)=>setWeightLb(e.target.value)} />
          </div>
          <div className="animate-fade-in-up">
            <label className="block text-sm mb-1">Age (years)</label>
            <input type="number" inputMode="numeric" className="w-full p-2 rounded-md bg-neutral-900 border border-gray-700 focus:ring-2 focus:ring-purdue-gold focus-glow" 
              value={age} onChange={(e)=>setAge(e.target.value)} />
          </div>
          <div className="animate-fade-in-up">
            <label className="block text-sm mb-1">Goal Weight (lb)</label>
            <input type="number" inputMode="numeric" className="w-full p-2 rounded-md bg-neutral-900 border border-gray-700 focus:ring-2 focus:ring-purdue-gold focus-glow" 
              value={goalWeightLb} onChange={(e)=>setGoalWeightLb(e.target.value)} />
          </div>

          <div className="md:col-span-2 animate-fade-in-up">
            <label className="block text-sm mb-1">Caloric Intake (Optional override, kcal/day)</label>
            <input type="number" inputMode="numeric" placeholder="e.g., 2200" className="w-full p-2 rounded-md bg-neutral-900 border border-gray-700 focus:ring-2 focus:ring-purdue-gold focus-glow" 
              value={explicitDaily} onChange={(e)=>setExplicitDaily(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">If provided, we'll use this as your daily goal instead of our estimate.</p>
          </div>

          <div className="md:col-span-2 mt-2 flex items-center justify-between bg-neutral-900 border border-gray-800 rounded-xl p-4 animate-scale-in">
            <div>
              <div className="text-sm text-gray-400">Estimated Daily Goal</div>
              <div className="text-2xl font-semibold text-purdue-gold">{computeDailyCalories().toLocaleString()} kcal</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Per-Meal Target (x3)</div>
              <div className="text-2xl font-semibold text-purdue-gold">{Math.max(Math.round(computeDailyCalories()/3),0).toLocaleString()} kcal</div>
            </div>
          </div>

          <div className="md:col-span-2 mt-3">
            <button type="submit" disabled={submitting} className="w-full bg-purdue-gold text-purdue-black font-bold py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-60 btn-animate">
              {submitting ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
