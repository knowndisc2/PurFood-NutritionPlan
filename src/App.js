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
* Chicken Satay with Peanut Sauce (1 Cup Serving)
* Tri Color Tortilla Chips (1/2 4 oz Serving)
* Fresh Sliced Strawberries (4 oz Serving)

Totals: 513 cal, 37.7g protein, 51g carbs, 16g fat


**MEAL PLAN 2**
* Spicy Breaded Chicken Breast (1 Each)
* Cheddar Jalapeno Potato Nugget (4 oz serving)
* Sriracha Coleslaw (1/2 Cup)
* Mandarin Oranges (1/2 Cup Serving)

Totals: 492 cal, 29.6g protein, 56g carbs, 15g fat


**MEAL PLAN 3**
* Spicy Breaded Chicken Breast (1 Each)
* Queso Blanco Cheese Sauce w Salsa Verde (1/2 Cup Serving)
* Long Grain Rice (1/2 Cup)
* Dark Chocolate Sea Salt Seed'nola (1 Ounce)


Totals: 511 cal, 31g protein, 54g carbs, 17g fat`;

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
      return;
    }
    const colRef = collection(db, 'users', user.uid, 'mealHistory');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMealHistory(items);
    }, (err) => {
      console.error('Failed to subscribe to meal history:', err);
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
      
      // The first line is now the dining hall
      const diningHall = lines.length > 0 && !lines[0].startsWith('*') ? lines.shift() : 'Unknown Dining Hall';

      // Extract totals line
      const totalsLine = lines.find(line => line.toLowerCase().includes('totals:'));
      let calories = 0, protein = 0, carbs = 0, fat = 0;
      
      if (totalsLine) {
        const caloriesMatch = totalsLine.match(/([\d,]+)\s*cal/);
        const proteinMatch = totalsLine.match(/([\d.]+)\s*g protein/);
        const carbsMatch = totalsLine.match(/([\d.]+)\s*g carbs/);
        const fatMatch = totalsLine.match(/~?([\d.]+)\s*g fat/);

        calories = caloriesMatch ? parseFloat(caloriesMatch[1].replace(',', '')) : 0;
        protein = proteinMatch ? parseFloat(proteinMatch[1]) : 0;
        carbs = carbsMatch ? parseFloat(carbsMatch[1]) : 0;
        fat = fatMatch ? parseFloat(fatMatch[1]) : 0;
      }
      
      // Extract food items (everything except totals line and dining hall)
      const foodItems = lines.filter(line => !line.toLowerCase().includes('totals:')).join('\n');
      
      plans.push({
        id: number,
        name: diningHall.trim(), // Use the dining hall as the name
        foodItems,
        calories,
        protein,
        carbs,
        fat
      });
    }
    
    return plans;
  };

  // This function receives the generated plan text from GoalForm
  const handleGeneratePlan = (planText) => {
    if (!user) {
      alert('You must be logged in to generate a plan!');
      return;
    }

    console.log('Displaying generated plan in App.js');
    setIsLoading(true);

    if (planText && typeof planText === 'string') {
      const parsedPlans = parseMealPlans(planText);
      setMealPlan({ rawText: planText, plans: parsedPlans });
      // Write to Firestore history (schema includes nutritional totals per plan)
      if (user?.uid) {
        addDoc(collection(db, 'users', user.uid, 'mealHistory'), {
          createdAt: serverTimestamp(),
          rawText: planText,
          plans: parsedPlans.map(p => ({
            id: p.id,
            name: p.name,
            foodItems: p.foodItems,
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
          })),
        }).catch((e) => console.error('Failed to save meal history:', e));
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
