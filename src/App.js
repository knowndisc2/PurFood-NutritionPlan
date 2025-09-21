import React, { useEffect, useState } from 'react';
import GoalForm from './components/GoalForm';
import Onboarding from './components/Onboarding';
import Navbar from './components/Navbar';
import { auth, db } from './firebase'; // Auth + Firestore
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `**MEAL PLAN 1**
Earhart
* Polish Sausage (1 Each Serving) Calories: 266 Protein: 10.0887g Carbs: 3.6686g Fat: 22.9288g
* Breaded Chicken Strips (5 Per Serving) Calories: 453 Protein: 27.6887g Carbs: 17.6201g Fat: 27.6887g
* Long Grain Rice (1/2 Cup) Calories: 122 Protein: 2.2791g Carbs: 27.3489g Fat: 0g
Totals: 841 cal, 40g protein, 49g carbs, 51g fat

**MEAL PLAN 2**
Ford
* Lasagna (4x4 Cut Serving) Calories: 202 Protein: 12.7386g Carbs: 24.7277g Fat: 5.9946g
* Breaded Chicken Strips (5 Per Serving) Calories: 453 Protein: 27.6887g Carbs: 17.6201g Fat: 27.6887g
* Vegan Quinoa and Peppers (2 # 6 Dishers) Calories: 454 Protein: 9.7358g Carbs: 50.0114g Fat: 24.095g
Totals: 1109 cal, 50g protein, 92g carbs, 58g fat

**MEAL PLAN 3**
Wiley
* Chicken Fajitas (Cup) Calories: 214 Protein: 27.3395g Carbs: 9.1069g Fat: 7.5623g
* Halal Shepherds Pie (4 x 8 Cut Serving) Calories: 397 Protein: 20.0718g Carbs: 25.5481g Fat: 22.9497g
* Grated Parmesan Cheese (Ounce) Calories: 113 Protein: 11.3398g Carbs: 0g Fat: 11.3398g
Totals: 724 cal, 59g protein, 35g carbs, 42g fat`;

function App() {
  const [user, loading] = useAuthState(auth); // include loading to avoid flicker
  const [onboardingPending, setOnboardingPending] = useState(() => {
    try { return localStorage.getItem('onboarding.pending') === '1'; } catch { return false; }
  });
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('mealPlan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [mealHistory, setMealHistory] = useState([]);

  // If a user logs in and has not completed onboarding, force onboarding
  useEffect(() => {
    if (!user) return;
    try {
      const completed = localStorage.getItem(`onboarding.completed:${user.uid}`) === '1';
      const hasDaily = !!localStorage.getItem('onboarding.dailyGoalCalories');
      const hasMeal = !!localStorage.getItem('onboarding.mealCalories');
      if (!completed || !(hasDaily && hasMeal)) {
        localStorage.setItem('onboarding.pending', '1');
        setOnboardingPending(true);
      }
    } catch {}
  }, [user]);

  // (restore no longer needed due to lazy initializer)

  // Persist meal plan whenever it changes
  useEffect(() => {
    try {
      if (mealPlan) localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
      else localStorage.removeItem('mealPlan');
    } catch {}
  }, [mealPlan]);

  // Subscribe to Firestore meal history for current user
  useEffect(() => {
    if (!user) {
      setMealHistory([]);
      setHistoryError("");
      return;
    }
    const colRef = collection(db, 'users', user.uid, 'mealHistory');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMealHistory(items);
      setHistoryError(""); // Clear error on successful read
    }, (err) => {
      console.error('Failed to subscribe to meal history:', err);
      setHistoryError(`Firestore read error: ${err.message}. Check your Firestore rules.`);
    });
    return () => unsub();
  }, [user]);

  const getApiBase = () => {
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:4000';
    }
    return window.location.origin;
  };

  // Parse meal plans from the generated text
  const parseMealPlans = (planText) => {
    const plans = [];
    const planRegex = /\*\*MEAL PLAN (\d+)\*\*([\s\S]*?)(?=\*\*MEAL PLAN|$)/g;
    let match;

    while ((match = planRegex.exec(planText)) !== null) {
      const [, number, content] = match;
      const lines = content.trim().split('\n').filter(line => line.trim());

      const diningHall = lines.length > 0 && !lines[0].startsWith('*') ? lines.shift() : 'Unknown';

      const totalsLine = lines.find(line => line.toLowerCase().startsWith('totals:'));
      let calories = 0, protein = 0, carbs = 0, fat = 0;

      if (totalsLine) {
        const calMatch = totalsLine.match(/([\d,.]+)\s*cal/);
        const protMatch = totalsLine.match(/([\d,.]+)\s*g protein/);
        const carbMatch = totalsLine.match(/([\d,.]+)\s*g carbs/);
        const fatMatch = totalsLine.match(/([\d,.]+)\s*g fat/);
        calories = calMatch ? parseFloat(calMatch[1].replace(',', '')) : 0;
        protein = protMatch ? parseFloat(protMatch[1]) : 0;
        carbs = carbMatch ? parseFloat(carbMatch[1]) : 0;
        fat = fatMatch ? parseFloat(fatMatch[1]) : 0;
      }

      const foodItems = lines
        .filter(line => !line.toLowerCase().startsWith('totals:'))
        .map(line => {
          // Remove macro segments regardless of whether values are numeric (handles N/A cases)
          let cleaned = line
            .replace(/Calories:\s*[^\s]+g?/ig, '')
            .replace(/Protein:\s*[^\s]+g/ig, '')
            .replace(/Carbs?:\s*[^\s]+g/ig, '')
            .replace(/Fat:\s*[^\s]+g/ig, '');

          // Remove legacy bracketed macro block format if present
          cleaned = cleaned.replace(/\[\s*[\d,.]+\s*\]\s*\[\s*[\d,.]+g\s*\]\s*\[\s*[\d,.]+g\s*\]\s*\[\s*[\d,.]+g\s*\]/ig, '');

          // Collapse extra whitespace and trim trailing separators
          cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/[\s\-–—:|]+$/g, '').trim();

          return cleaned;
        })
        .join('\n');

      plans.push({
        id: number,
        name: diningHall.trim(),
        foodItems,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
      });
    }
    return plans;
  };

  // Rebuild a clean plan text from parsed values (no per-item macros, numeric totals only)
  const rebuildPlanText = (plans) => {
    try {
      return plans
        .map(p => `**MEAL PLAN ${p.id}**\n${p.name}\n${p.foodItems}\nTotals: ${p.calories} cal, ${p.protein}g protein, ${p.carbs}g carbs, ${p.fat}g fat`)
        .join('\n\n');
    } catch {
      return '';
    }
  };

  // This function receives the generated plan text from GoalForm
  const handleGeneratePlan = async (planText) => {
    if (!user) {
      alert('You must be logged in to generate a plan!');
      return;
    }

    console.log('Displaying generated plan in App.js');
    setIsLoading(true);

    if (planText && typeof planText === 'string') {
      const parsedPlans = parseMealPlans(planText);
      const normalizedText = rebuildPlanText(parsedPlans) || planText;
      setMealPlan({ rawText: normalizedText, plans: parsedPlans });

      // Compute aggregate totals across plans for Firestore
      const totals = parsedPlans.reduce((acc, p) => ({
        calories: acc.calories + (Number(p.calories) || 0),
        protein: acc.protein + (Number(p.protein) || 0),
        carbs: acc.carbs + (Number(p.carbs) || 0),
        fat: acc.fat + (Number(p.fat) || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // Write to Firestore history
      if (user?.uid) {
        try {
          setHistoryError("");
          const docData = {
            createdAt: serverTimestamp(),
            rawText: normalizedText, // Save the cleaned text
            totals: {
              calories: Number(totals.calories) || 0,
              protein: Number(totals.protein) || 0,
              carbs: Number(totals.carbs) || 0,
              fat: Number(totals.fat) || 0
            },
            plans: parsedPlans.map(p => ({
              id: String(p.id),
              name: String(p.name || 'Unknown'),
              foodItems: String(p.foodItems || ''),
              calories: Number(p.calories) || 0,
              protein: Number(p.protein) || 0,
              carbs: Number(p.carbs) || 0,
              fat: Number(p.fat) || 0,
            })),
            userId: user.uid
          };
          await addDoc(collection(db, 'users', user.uid, 'mealHistory'), docData);
        } catch (e) {
          console.error('Failed to save meal history:', e);
          setHistoryError(`Save error: ${e.message}.`);
        }
      }
    } else {
      // Fallback for safety, though GoalForm should handle this
      console.error('Received invalid planText. Displaying a fallback message.');
      const fallbackText = 'Could not generate a valid meal plan. Please try again.';
      setMealPlan({ rawText: fallbackText, plans: [] });
    }

    setIsLoading(false);
  };

  const handleStartOver = () => {
    setMealPlan(null);
  };
  const clearHistory = async () => {
    if (!user?.uid) return;
    try {
      const colRef = collection(db, 'users', user.uid, 'mealHistory');
      const snap = await getDocs(colRef);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'mealHistory', d.id))));
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };
  const restoreFromHistory = (id) => {
    const item = mealHistory.find((h) => h.id === id);
    if (item) {
      setMealPlan({ rawText: item.rawText, plans: item.plans });
    }
  };
  const deleteHistoryItem = async (id) => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'mealHistory', id));
    } catch (e) {
      console.error('Failed to delete history item:', e);
    }
  };
  const handleOnboardingComplete = () => {
    try { localStorage.removeItem('onboarding.pending'); } catch {}
    try {
      if (user?.uid) localStorage.setItem(`onboarding.completed:${user.uid}`, '1');
    } catch {}
    setOnboardingPending(false);
  };
  // While auth state is resolving, avoid rendering login or clearing content
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-purdue-gold">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
      {user ? (
        onboardingPending ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
        mealPlan ? (
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-purdue-gold mb-4">Your Personalized Meal Plans</h1>
                <button 
                  onClick={handleStartOver}
                  className="bg-purdue-gold text-purdue-black px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  ← Generate New Plan
                </button>
              </div>
              {/* Meal History Panel */}
              <div className="mb-8 bg-neutral-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-purdue-gold">Meal History</h2>
                  {mealHistory.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs px-3 py-1 rounded bg-neutral-800 border border-gray-700 hover:bg-neutral-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {historyError && (
                  <div className="mb-2 text-sm text-red-400">{historyError}</div>
                )}
                {mealHistory.length === 0 ? (
                  <div className="text-sm text-gray-400">No saved meal plans yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {mealHistory
                      .slice()
                      .reverse()
                      .slice(0, 5)
                      .map((item) => (
                        <li key={item.id} className="flex items-center justify-between text-sm">
                          <div className="text-gray-300">
                            {(() => {
                              const ts = item.createdAt;
                              const date = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
                              return date.toLocaleString();
                            })()}
                            {item.totals && (
                              <div className="mt-1 text-xs text-gray-400">
                                Totals — Cal: {Math.round(item.totals.calories)} | P: {Math.round(item.totals.protein)}g | C: {Math.round(item.totals.carbs)}g | F: {Math.round(item.totals.fat)}g
                              </div>
                            )}
                            {Array.isArray(item.plans) && item.plans.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.plans.slice(0, 3).map((p, idx) => (
                                  <div key={idx} className="text-xs text-gray-400">
                                    Plan {p.id || idx + 1}: {p.name} — Cal: {Math.round(p.calories)} | P: {Math.round(p.protein)}g | C: {Math.round(p.carbs)}g | F: {Math.round(p.fat)}g
                                  </div>
                                ))}
                                {item.plans.length > 3 && (
                                  <div className="text-[11px] text-gray-500">(+{item.plans.length - 3} more)</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-x-2">
                            <button
                              onClick={() => restoreFromHistory(item.id)}
                              className="px-3 py-1 rounded bg-purdue-gold text-purdue-black font-semibold hover:bg-opacity-90"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => deleteHistoryItem(item.id)}
                              className="px-3 py-1 rounded bg-neutral-800 border border-gray-700 hover:bg-neutral-700"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mealPlan.plans.map((plan) => (
                  <div key={plan.id} className="bg-black text-purdue-gold p-6 rounded-xl shadow-lg border border-gray-800">
                    <h2 className="text-xl font-bold mb-4 text-center">{plan.name}</h2>
                    
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2 text-gray-300">Food Items:</h3>
                      <div className="text-sm whitespace-pre-line leading-relaxed">
                        {plan.foodItems}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                      <h3 className="text-sm font-semibold mb-3 text-gray-300">Nutritional Totals:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-neutral-900 p-2 rounded text-center">
                          <div className="font-bold text-lg">{plan.calories}</div>
                          <div className="text-xs text-gray-400">Calories</div>
                        </div>
                        <div className="bg-neutral-900 p-2 rounded text-center">
                          <div className="font-bold text-lg">{plan.protein}g</div>
                          <div className="text-xs text-gray-400">Protein</div>
                        </div>
                        <div className="bg-neutral-900 p-2 rounded text-center">
                          <div className="font-bold text-lg">{plan.carbs}g</div>
                          <div className="text-xs text-gray-400">Carbs</div>
                        </div>
                        <div className="bg-neutral-900 p-2 rounded text-center">
                          <div className="font-bold text-lg">{plan.fat}g</div>
                          <div className="text-xs text-gray-400">Fat</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            ) : (
              <GoalForm onGeneratePlan={handleGeneratePlan} isLoading={isLoading} />
            ))
          ) : (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] text-purdue-gold">
              <div className="text-center p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6">Welcome to PurFood</h1>
                <p className="mb-8">Please sign in to access your personalized meal plans.</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

export default App;
