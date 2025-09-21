import React, { useEffect, useState } from 'react';
import GoalForm from './components/GoalForm';
import Onboarding from './components/Onboarding';
import MealPlanDisplay from './components/MealPlanDisplay';
import { auth } from './firebase'; // Auth only
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `**MEAL PLAN 1**
Earhart
* Polish Sausage (1 Each Serving) Calories: 266 Protein: 10.0887g Carbs: 3.6686g Fat: 22.9288g
* Long Grain Rice (1/2 Cup) Calories: 122 Protein: 2.2791g Carbs: 27.3489g Fat: 0g
* Green Beans (1/2 Cup Serving) Calories: 15 Protein: 0.975g Carbs: 2.925g Fat: 0g
Totals: 403 cal, 13g protein, 34g carbs, 23g fat

**MEAL PLAN 2**
Ford
* Breaded Chicken Strips (5 Per Serving) Calories: 453 Protein: 27.6887g Carbs: 17.6201g Fat: 27.6887g
* Peas (1/2 Cup) Calories: 62 Protein: 4.3936g Carbs: 10.5445g Fat: 0g
Totals: 515 cal, 32g protein, 28g carbs, 28g fat

**MEAL PLAN 3**
Wiley
* Chicken Fajitas (Cup) Calories: 214 Protein: 27.3395g Carbs: 9.1069g Fat: 7.5623g
* Shredded 3 Cheese Blend (Ounce) Calories: 97 Protein: 6.0749g Carbs: 1.0125g Fat: 8.0998g
* Cilantro Green Rice (1/2 Cup) Calories: 133 Protein: 1.8789g Carbs: 21.9152g Fat: 3.8755g
Totals: 444 cal, 35g protein, 32g carbs, 20g fat`;

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
  const handleGeneratePlan = (planText) => {
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
    <div className="App">
      {/* If a user is logged in, show the main app content */}
      {user ? (
        onboardingPending ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
        mealPlan ? (
          <div className="min-h-screen bg-neutral-950 p-4">
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
              
              <div className="mt-8 text-center">
                <MealPlanDisplay plan={mealPlan.rawText} onBack={handleStartOver} />
              </div>
            </div>
          </div>
        ) : (
          <GoalForm onGeneratePlan={handleGeneratePlan} isLoading={isLoading} />
        )
        )
      ) : (
        /* If no user is logged in, Auth.js will handle showing the login UI */
        // This part will likely not be visible as Auth.js gatekeeps the App component
        <p>Please log in.</p>
      )}
    </div>
  );
}

export default App;
