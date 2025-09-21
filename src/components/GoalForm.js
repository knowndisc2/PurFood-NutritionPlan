import React, { useState } from 'react';

// The props ({ onGeneratePlan, isLoading }) are passed down from App.js
function GoalForm({ onGeneratePlan, isLoading }) {
    // State for each form input
    const [calories, setCalories] = useState('2000');
    const [macros, setMacros] = useState({ protein: 25, carbs: 45, fats: 30 });
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [mealTime, setMealTime] = useState('lunch'); // breakfast | lunch | dinner | brunch | late lunch
    const [date, setDate] = useState(''); // optional YYYY-MM-DD (converted internally)
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });

    const showToast = (type, message, duration = 3500) => {
        setToast({ visible: true, type, message });
        if (duration > 0) {
            window.clearTimeout(showToast._t);
            showToast._t = window.setTimeout(() => setToast({ visible: false, type, message: '' }), duration);
        }
    };

    const handlePrefToggle = (preference, prefList, setPrefList) => {
        if (prefList.includes(preference)) {
            setPrefList(prefList.filter((p) => p !== preference));
        } else {
            setPrefList([...prefList, preference]);
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setErrorMsg('');
        setSubmitting(true);
        const allGoals = {
            calories,
            macros,
            dietaryPrefs,
            aiPrompt,
        };

        try {
            // Single call: scrape menu and generate plans in one request
            const resp = await fetch('/api/scrape-and-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goals: allGoals,
                    mealTime,
                    date: date ? date.replaceAll('-', '/') : '',
                }),
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Scrape and generate failed: ${resp.status} ${resp.statusText} — ${text.slice(0,200)}`);
            }

            const { planText, file, menuData } = await resp.json();

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
                onGeneratePlan(allGoals);
                showToast('warning', 'Generated a fallback plan.');
            }
        } catch (e) {
            console.error('[GoalForm] Failed to generate plan via Gemini:', e);
            setErrorMsg(e.message || 'Failed to generate plan');
            showToast('error', e.message || 'Failed to generate plan');
            // Fallback to existing flow
            onGeneratePlan(allGoals);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-purdue-gold">
                    Personalized Nutrition at Purdue
                </h1>
                <p className="text-purdue-gold mt-2">
                    Set your dietary goals and discover meals from Purdue dining courts that perfectly match your nutritional needs.
                </p>
            </div>

            {/* The main form card: white, rounded, shadowed, and responsive width */}
            <div className="bg-black text-purdue-gold p-8 rounded-xl shadow-lg w-full max-w-4xl relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Daily Targets</h2>
                        <div className="mb-6">
                            <label htmlFor="calories" className="block text-sm font-medium mb-1">
                                Daily Calories
                            </label>
                            <input
                                type="text"
                                id="calories"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value)}
                                className="w-full p-2 border border-gray-700 rounded-md bg-neutral-900 focus:ring-2 focus:ring-purdue-gold focus:border-purdue-gold"
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
                                    onChange={(e) => setMacros({ ...macros, protein: parseInt(e.target.value, 10) })}
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
                                    onChange={(e) => setMacros({ ...macros, carbs: parseInt(e.target.value, 10) })}
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
                                    onChange={(e) => setMacros({ ...macros, fats: parseInt(e.target.value, 10) })}
                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Dietary Preferences</h3>
                            {['Vegetarian','Vegan','Gluten-Free','Dairy-Free','Nut-Free','Shellfish-Free'].map((label) => {
                                const active = dietaryPrefs.includes(label);
                                return (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => handlePrefToggle(label, dietaryPrefs, setDietaryPrefs)}
                                      className={`mr-2 mb-2 py-2 px-4 rounded-md text-sm border ${active ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border-gray-600 text-purdue-gold hover:bg-neutral-800'}`}
                                    >
                                      {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold mb-2">Meal Time (for scraping)</h3>
                        <div className="grid grid-cols-2 gap-3">
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

                {/* AI Assistant Text Area */}
                <div className="mt-8">
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

                {/* Scrape Controls */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meal Time (for scraping)</label>
                    <select
                      className="w-full p-2 border border-gray-700 bg-neutral-900 rounded-md focus:ring-2 focus:ring-purdue-gold"
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="brunch">Brunch</option>
                      <option value="lunch">Lunch</option>
                      <option value="late lunch">Late Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date (optional)</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-gray-700 bg-neutral-900 rounded-md focus:ring-2 focus:ring-purdue-gold"
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