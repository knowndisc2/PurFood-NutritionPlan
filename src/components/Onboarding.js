import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

// Simple onboarding to capture basic metrics and compute calorie targets
// Assumptions:
// - Units: pounds (lb) for weight, inches (in) for height, years for age
// - Activity factor: 1.2 (sedentary) for initial estimate
// - Goal offset: -500 kcal/day if goal weight < current weight; +300 if gaining
// - If user supplies an explicit daily intake, use that instead
export default function Onboarding({ onComplete }) {
  const [user] = useAuthState(auth);
  const [heightIn, setHeightIn] = useState('68');
  const [weightLb, setWeightLb] = useState('160');
  const [age, setAge] = useState('20');
  const [gender, setGender] = useState('male'); // male | female
  const [activity, setActivity] = useState('sedentary'); // sedentary|light|moderate|active|very
  const [goalWeightLb, setGoalWeightLb] = useState('155');
  const [explicitDaily, setExplicitDaily] = useState(''); // optional override
  const [submitting, setSubmitting] = useState(false);

  const activityFactor = (lvl) => ({
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very: 1.9,
  }[lvl] || 1.2);

  const computeBMI = () => {
    const w = parseFloat(weightLb) || 0;
    const hIn = parseFloat(heightIn) || 0;
    if (!w || !hIn) return 0;
    const kg = w * 0.45359237;
    const m = (hIn * 2.54) / 100;
    return kg / (m * m);
  };

  const computeDailyCalories = () => {
    const h = parseFloat(heightIn) || 0;
    const w = parseFloat(weightLb) || 0;
    const a = parseFloat(age) || 0;
    const gw = parseFloat(goalWeightLb) || 0;

    // Convert to metric for Mifflin-St Jeor (male approximation; no gender captured)
    // Mifflin (male): 10*kg + 6.25*cm - 5*age + 5
    // Mifflin (female): 10*kg + 6.25*cm - 5*age - 161
    const kg = w * 0.45359237;
    const cm = h * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * a + (gender === 'female' ? -161 : 5);
    const tdee = Math.max(Math.round(bmr * activityFactor(activity)), 0);

    if (explicitDaily) {
      return Math.max(parseInt(explicitDaily, 10) || 0, 0);
    }

    // Goal adjustment
    let delta = 0;
    const bmi = computeBMI();
    // BMI-based adjustment: underweight -> surplus, overweight/obese -> deficit
    if (bmi && bmi < 18.5) delta = 300; // gentle surplus
    else if (bmi >= 30) delta = -500;   // stronger deficit for obesity
    else if (bmi >= 25) delta = -300;   // moderate deficit for overweight

    if (gw && w) {
      if (gw < w) delta = -500; // losing weight
      else if (gw > w) delta = 300; // gaining weight
    }
    return Math.max(tdee + delta, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const dailyGoal = computeDailyCalories();
    const mealTarget = Math.max(Math.round(dailyGoal / 3), 0); // simple 3-meals split
    const bmi = Number(computeBMI().toFixed(1));

    const userData = {
      height: String(parseFloat(heightIn) * 2.54), // Convert inches to cm for consistency
      weight: String(parseFloat(weightLb) * 0.453592), // Convert lbs to kg for consistency
      age: String(age),
      gender,
      activityLevel: activity,
      goalWeight: String(parseFloat(goalWeightLb) * 0.453592), // Convert to kg
      dailyGoalCalories: String(dailyGoal),
      mealCalories: String(mealTarget),
      bmi: bmi,
      explicitDaily: explicitDaily || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      email: user?.email || ''
    };

    try {
      // Save to localStorage for backward compatibility
      localStorage.setItem('onboarding.dailyGoalCalories', String(dailyGoal));
      localStorage.setItem('onboarding.mealCalories', String(mealTarget));
      localStorage.setItem('onboarding.height', userData.height);
      localStorage.setItem('onboarding.weight', userData.weight);
      localStorage.setItem('onboarding.age', userData.age);
      localStorage.setItem('onboarding.gender', userData.gender);
      localStorage.setItem('onboarding.activityLevel', userData.activityLevel);
      localStorage.setItem('onboarding.metrics', JSON.stringify({
        heightIn,
        weightLb,
        age,
        gender,
        activity,
        bmi,
        goalWeightLb,
        explicitDaily,
      }));

      // Save to Firestore if user is authenticated
      if (user?.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, userData, { merge: true });
        console.log('Onboarding data saved to Firestore');
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Continue anyway - don't block the user
    }

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
            <label className="block text-sm mb-1">Gender</label>
            <select className="w-full p-2 rounded-md bg-neutral-900 border border-gray-700 focus:ring-2 focus:ring-purdue-gold focus-glow" value={gender} onChange={(e)=>setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="animate-fade-in-up md:col-span-2">
            <label className="block text-sm mb-1">Activity Level</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                {label:'Sedentary', value:'sedentary'},
                {label:'Light', value:'light'},
                {label:'Moderate', value:'moderate'},
                {label:'Active', value:'active'},
                {label:'Very Active', value:'very'},
              ].map(opt => (
                <button type="button" key={opt.value} onClick={() => setActivity(opt.value)}
                  className={`py-2 px-3 rounded-md text-sm border hover-lift ${activity===opt.value ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border-gray-600 text-purdue-gold hover:bg-neutral-800'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
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

          <div className="md:col-span-2 mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-neutral-900 border border-gray-800 rounded-xl p-4 animate-scale-in">
              <div className="text-sm text-gray-400">Estimated Daily Goal</div>
              <div className="text-2xl font-semibold text-purdue-gold">{computeDailyCalories().toLocaleString()} kcal</div>
            </div>
            <div className="bg-neutral-900 border border-gray-800 rounded-xl p-4 animate-scale-in">
              <div className="text-sm text-gray-400">Per-Meal Target (x3)</div>
              <div className="text-2xl font-semibold text-purdue-gold">{Math.max(Math.round(computeDailyCalories()/3),0).toLocaleString()} kcal</div>
            </div>
            <div className="bg-neutral-900 border border-gray-800 rounded-xl p-4 animate-scale-in">
              <div className="text-sm text-gray-400">BMI</div>
              <div className="text-2xl font-semibold text-purdue-gold">{Number(computeBMI().toFixed(1))}</div>
              <div className="text-xs text-gray-400 mt-1">
                {(() => { const v = computeBMI(); if (!v) return '—'; if (v<18.5) return 'Underweight'; if (v<25) return 'Healthy'; if (v<30) return 'Overweight'; return 'Obese'; })()}
              </div>
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
