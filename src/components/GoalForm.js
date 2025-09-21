import React, { useState } from 'react';
import { authenticatedFetch } from '../api';

// The props ({ onGeneratePlan, isLoading }) are passed down from App.js
function GoalForm({ onGeneratePlan, isLoading }) {
    // State for each form input
    const [calories, setCalories] = useState(() => {
        try { return localStorage.getItem('onboarding.mealCalories') || '2000'; } catch { return '2000'; }
    });
    const [goalCalories, setGoalCalories] = useState(() => {
        try {
            const baselineStr = localStorage.getItem('onboarding.dailyGoalCalories');
            const baseline = baselineStr ? parseInt(baselineStr, 10) : 2000;
            const currentStr = localStorage.getItem('dailyGoal.current');
            const current = currentStr ? parseInt(currentStr, 10) : baseline;
            return Number.isFinite(current) ? current : baseline;
        } catch { return 2000; }
    }); // internal daily goal for remaining ring (auto-resets daily)
    const [macros, setMacros] = useState({ protein: 0, carbs: 0, fats: 0 });
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [mealTime, setMealTime] = useState('lunch'); // breakfast | lunch | dinner | brunch | late lunch
    const [date, setDate] = useState(''); // optional YYYY-MM-DD (converted internally)
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });

    // Helper component: circular remaining calories ring
    const CaloriesRing = ({ goal = 0, food = 0, exercise = 0 }) => {
        const g = Math.max(parseInt(goal || 0, 10) || 0, 0);
        const f = Math.max(parseInt(food || 0, 10) || 0, 0);
        const ex = Math.max(parseInt(exercise || 0, 10) || 0, 0);
        const consumed = Math.max(f - ex, 0);
        const remaining = Math.max(g - consumed, 0);
        const radius = 54; // px
        const circumference = 2 * Math.PI * radius;
        const progress = g > 0 ? Math.min(consumed / g, 1) : 0;
        const dash = circumference * progress;
        const gap = circumference - dash;

        return (
            <div className="bg-neutral-900 text-purdue-gold rounded-xl shadow p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-1">Calories</h2>
                <div className="text-sm text-gray-300 mb-4">Remaining = Goal − Food</div>
                <div className="flex items-center gap-6">
                    {/* Ring */}
                    <div className="relative w-32 h-32">
                        <svg width="128" height="128" viewBox="0 0 128 128">
                            <circle
                                cx="64" cy="64" r={radius}
                                stroke="#2a2a2a" strokeWidth="12" fill="none"
                            />
                            <circle
                                cx="64" cy="64" r={radius}
                                stroke="var(--purdue-gold)"
                                strokeWidth="12" fill="none"
                                strokeDasharray={`${dash} ${gap}`}
                                strokeLinecap="round"
                                transform="rotate(-90 64 64)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-2xl font-bold text-purdue-gold">
                                {remaining.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-300">Remaining</div>
                        </div>
                    </div>
                    {/* Details */}
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 rounded bg-purdue-gold" aria-hidden></span>
                            <div className="flex-1 flex justify-between gap-6">
                                <span className="text-gray-300">Base Goal</span>
                                <span className="font-bold text-purdue-gold">{g.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 rounded bg-blue-500" aria-hidden></span>
                            <div className="flex-1 flex justify-between gap-6">
                                <span className="text-gray-300">Food</span>
                                <span className="font-bold text-white">{f.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 rounded bg-purple-600" aria-hidden></span>
                            <div className="flex-1 flex justify-between gap-6">
                                <span className="text-gray-300">Exercise</span>
                                <span className="font-bold text-white">{ex.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const showToast = (type, message, duration = 3500) => {
        setToast({ visible: true, type, message });
        if (duration > 0) {
            window.clearTimeout(showToast._t);
            showToast._t = window.setTimeout(() => setToast({ visible: false, type, message: '' }), duration);
        }
    };

    // Daily reset of goal calories back to baseline
    React.useEffect(() => {
        try {
            const today = new Date();
            const keyDate = 'dailyGoal.lastDate';
            const keyCurrent = 'dailyGoal.current';
            const keyBaseline = 'onboarding.dailyGoalCalories';
            const storedDate = localStorage.getItem(keyDate);
            const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
            const baselineStr = localStorage.getItem(keyBaseline);
            const baseline = baselineStr ? parseInt(baselineStr, 10) : goalCalories;
            if (storedDate !== todayStr) {
                localStorage.setItem(keyCurrent, String(baseline));
                localStorage.setItem(keyDate, todayStr);
                setGoalCalories(baseline);
            } else {
                // Keep current, but ensure state matches stored
                const currStr = localStorage.getItem(keyCurrent);
                if (currStr) {
                    const v = parseInt(currStr, 10);
                    if (Number.isFinite(v) && v !== goalCalories) setGoalCalories(v);
                }
            }
        } catch {}
        // run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePrefToggle = (preference, prefList, setPrefList) => {
        if (prefList.includes(preference)) {
            setPrefList(prefList.filter((p) => p !== preference));
        } else {
            setPrefList([...prefList, preference]);
        }
    };

    // Ensure macros (protein + carbs + fats) never exceed 100
    const handleMacroChange = (key, nextValRaw) => {
        const nextVal = parseInt(nextValRaw, 10);
        if (Number.isNaN(nextVal)) return;
        const currentVal = macros[key];
        if (nextVal === currentVal) return;

        const total = macros.protein + macros.carbs + macros.fats;

        // If attempting to increase when total is already >= 100, block movement
        if (nextVal > currentVal && total >= 100) {
            return; // do nothing
        }

        // If this change would push the sum over 100, block movement
        const others = total - currentVal;
        if (nextVal > currentVal && (others + nextVal) > 100) {
            return;
        }

        // Otherwise, allow the change
        setMacros({ ...macros, [key]: nextVal });
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setErrorMsg('');
        setSubmitting(true);
        const allGoals = {
            calories,
            macros,
            dietaryPrefs,
            preferences: aiPrompt, // Use the 'preferences' key for the AI prompt
        };

        try {
            // Step 1: Scrape menu data non-interactively
            const scrapeResp = await authenticatedFetch('/api/scrape/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mealTime,
                    date: date ? date.replaceAll('-', '/') : '',
                }),
            });
            if (!scrapeResp.ok) {
                const t = await scrapeResp.text();
                throw new Error(`Menu scrape failed: ${scrapeResp.status} ${scrapeResp.statusText} — ${t.slice(0,200)}`);
            }
            const { data: menuData } = await scrapeResp.json();

            // Step 2: Call backend to run Gemini AI integration with goals + scraped menu
            const resp = await authenticatedFetch('/api/ai/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goals: allGoals, menu: menuData }),
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Gemini endpoint failed: ${resp.status} ${resp.statusText} — ${text.slice(0,200)}`);
            }

            const { planText, file } = await resp.json();

            // Trigger client-side download of the generated plan
            if (planText) {
                const blob = new Blob([planText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file || `gemini_plan_${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            // Show the generated plan in the app flow as well
            if (planText) {
                onGeneratePlan(planText);
                showToast('success', 'Meal plan generated successfully!');
            } else {
                onGeneratePlan(null); // Pass null to indicate failure
                showToast('warning', 'Generated an empty plan.');
            }
        } catch (e) {
            console.error('[GoalForm] Failed to generate plan via Gemini:', e);
            setErrorMsg(e.message || 'Failed to generate plan');
            showToast('error', e.message || 'Failed to generate plan');
            // Fallback to existing flow
            onGeneratePlan(null);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-purdue-gold">
                    Personalized Nutrition at Purdue
                </h1>
                <p className="text-purdue-gold mt-2">
                    Set your dietary goals and discover meals from Purdue dining courts that perfectly match your nutritional needs.
                </p>
            </div>

            {/* The main form card: white, rounded, shadowed, and responsive width */}
            <div className="bg-black text-purdue-gold p-8 rounded-xl shadow-lg w-full max-w-4xl relative card-elevate animate-scale-in">
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-4 animate-fade-in-up">Daily Targets</h2>
                        <div className="mb-6">
                            <label htmlFor="calories" className="block text-sm font-medium mb-1">
                                Calorie Target (this meal)
                            </label>
                            <input
                                type="text"
                                id="calories"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                className="w-full p-2 border border-gray-700 rounded-md bg-neutral-900 focus:ring-2 focus:ring-purdue-gold focus:border-purdue-gold focus-glow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Macronutrient Distribution (%)
                            </label>
                            {/* Protein Slider */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs">
                                    <span>Protein</span>
                                    <span>{macros.protein}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                    value={macros.protein}
                                    onChange={(e) => handleMacroChange('protein', e.target.value)}
                                />
                            </div>
                            {/* Carbs Slider */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs">
                                    <span>Carbohydrates</span>
                                    <span>{macros.carbs}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={macros.carbs}
                                    onChange={(e) => handleMacroChange('carbs', e.target.value)}
                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            {/* Fats Slider */}
                            <div>
                                <div className="flex justify-between text-xs">
                                    <span>Fats</span>
                                    <span>{macros.fats}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={macros.fats}
                                    onChange={(e) => handleMacroChange('fats', e.target.value)}
                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        {/* Meal Time (moved under macros to tighten spacing) */}
                        <div className="mt-3">
                            <h3 className="text-md font-semibold mb-2">Meal Time (for scraping)</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Breakfast', value: 'breakfast' },
                                    { label: 'Lunch', value: 'lunch' },
                                    { label: 'Dinner', value: 'dinner' },
                                    { label: 'Late Lunch', value: 'late lunch' }
                                ].map(({ label, value }) => {
                                  const active = mealTime === value;
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => setMealTime(value)}
                                      className={`py-2 px-4 rounded-md text-sm ${active ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border border-gray-600 text-gray-200 hover:bg-neutral-800'}`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Calories ring card at top of right column */}
                        <div className="mb-4 animate-fade-in-up">
                          <CaloriesRing
                            goal={goalCalories}
                            food={(() => { const n = parseInt((calories || '0'), 10); return Number.isNaN(n) ? 0 : Math.max(n, 0); })()}
                            exercise={0}
                          />
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-4 animate-fade-in-up">Dietary Preferences</h3>
                            {['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Shellfish-Free'].map((label) => {
                                const active = dietaryPrefs.includes(label);
                                return (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => handlePrefToggle(label, dietaryPrefs, setDietaryPrefs)}
                                      className={`mr-2 mb-2 py-2 px-4 rounded-md text-sm border hover-lift ${active ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border-gray-600 text-purdue-gold hover:bg-neutral-800'}`}
                                    >
                                      {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    
                </div>

                {/* AI Assistant Text Area */}
                <div className="mt-4">
                    <label htmlFor="ai-assistant" className="block text-sm font-medium mb-1">
                        AI Assistant (Optional)
                    </label>
                    <textarea
                        id="ai-assistant"
                        rows="3"
                        className="w-full p-2 border border-gray-700 bg-neutral-900 rounded-md focus:ring-2 focus:ring-purdue-gold focus:border-purdue-gold"
                        placeholder="Describe any specific goals, preferences, or requirements in natural language..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                    ></textarea>
                </div>

                {/* Date Selection */}
                <div className="mt-6">
                  <div>
                    <label htmlFor="date-picker" className="block text-sm font-medium mb-1">Date (optional)</label>
                    <input
                      id="date-picker"
                      type="date"
                      className="w-full p-2 border border-gray-700 bg-neutral-900 rounded-md focus:ring-2 focus:ring-purdue-gold md:max-w-xs"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || submitting}
                        className="w-full bg-purdue-gold text-purdue-black font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-60">
                        {isLoading || submitting ? 'Generating...' : 'Generate Meal Suggestions →'}
                    </button>
                </div>

                {errorMsg && (
                  <div className="mt-4 rounded border border-red-400 bg-red-50/20 text-red-300 p-3">
                    <div className="font-semibold mb-1">We couldn't generate your plan</div>
                    <div className="text-sm">{errorMsg}</div>
                  </div>
                )}
            </div>

            {/* Loading Overlay */}
            {submitting && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
                <div className="bg-neutral-900 text-purdue-gold px-6 py-4 rounded-lg shadow flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-purdue-gold" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Generating your plan…</span>
                </div>
              </div>
            )}

            {/* Toast */}
            {toast.visible && (
              <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded shadow text-sm ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'warning' ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`}>
                {toast.message}
              </div>
            )}
        </div>
    );
}

export default GoalForm;