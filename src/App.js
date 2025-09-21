import React, { useEffect, useState } from 'react';
import GoalForm from './components/GoalForm';
import MealPlanDisplay from './components/MealPlanDisplay';
import { auth } from './firebase'; // Auth only
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `**MEAL PLAN 1: The Hearty Harvest**

* Breaded Pork Tenderloin (1): 176 cal, 22.66g protein, 11.34g carbs, 0g fat
* Sweet Potato Wedge Fries (6 oz): 320 cal, 2.00g protein, 50.03g carbs, 0g fat
* Chicken And Noodles (1 cup): 443 cal, 18.41g protein, 51.18g carbs, 0g fat (assuming minimal fat in this serving)
* Whipped Potatoes (1/2 cup): 107 cal, 2.38g protein, 20.21g carbs, 0g fat (assuming minimal fat in this serving)
* Green Beans (1/2 cup): 15 cal, 1g protein, 2.93g carbs, 0g fat
* Dinner Rolls (1): 99 cal, 2.98g protein, 18.9g carbs, 0g fat (assuming minimal fat in this serving)
* Dark Chocolate Sea Salt Seed'nola (1 oz): 132 cal, 4g protein, 13.16g carbs, 0g fat (assuming minimal fat in this serving)


Totals: 1292 cal, 53.43g protein, 167.65g carbs, 0g fat  *(Need to add fat sources)*


**MEAL PLAN 2:  The Italian Adventure**

* Linguini (1 cup): 172 cal, 5.67g protein, 34.02g carbs, 0g fat
* Pesto Alfredo Cream Sauce (1/2 cup): 281 cal, 5.91g protein, 7.82g carbs, ~20g fat (estimated fat content, needs adjustment if actual data is available)
* Pork Potstickers (3): 159 cal, 7g protein, 24g carbs, 0g fat (estimated fat content, needs adjustment if actual data is available)
* Potsticker Sauce (1 tbsp): 17 cal, 0.58g protein, 3.32g carbs, 0g fat
* Fried Rice (1/2 cup): 182 cal, 3.89g protein, 27.47g carbs, ~10g fat (estimated fat content, needs adjustment if actual data is available)
* Sliced Smoked Polish Sausage (2 oz): 174 cal, 7.32g protein, 2.74g carbs, ~15g fat (estimated fat content, needs adjustment if actual data is available)
* Long Grain Rice (1/2 cup): 122 cal, 2.28g protein, 27.35g carbs, 0g fat

Totals: 1107 cal, 32.65g protein, 136.72g carbs, ~45g fat *(Needs more protein and carbs; less fat)*


**MEAL PLAN 3:  The Balanced Plate**

* Malibu Burger (1): 160 cal, 3.99g protein, 20.94g carbs, 0g fat
* GF Hamburger Bun (1): 240 cal, 5g protein, 44g carbs, 0g fat
* Creamy Coleslaw (1/2 cup): 89 cal, 0.67g protein, 11.75g carbs, 0g fat
* Chicken And Noodles (1 cup): 443 cal, 18.41g protein, 51.18g carbs, 0g fat (assuming minimal fat in this serving)
* Whipped Potatoes (1/2 cup): 107 cal, 2.38g protein, 20.21g carbs, 0g fat (assuming minimal fat in this serving)
* Summer Symphony Fruit Salad (1/2 cup): 65 cal, 0.71g protein, 16.68g carbs, 0g fat
* Peanut Butter Cookie (1): 120 cal, 2g protein, 17g carbs, 0g fat (assuming minimal fat in this serving)

Totals: 1224 cal, 33.2g protein, 177.76g carbs, 0g fat *(Needs significant fat and protein increase)*


**Note:**  The fat content in many of these items isn't specified.  Accurate fat estimations are crucial for balancing the macronutrients.  These meal plans are preliminary and require adjustment once the precise fat content of each dish is known.  Furthermore, additional food items may be needed to meet the required macronutrient targets precisely.`;

function App() {
  const [user, loading] = useAuthState(auth); // include loading to avoid flicker
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('mealPlan');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

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
    const planRegex = /\*\*MEAL PLAN (\d+): ([^*]+)\*\*([\s\S]*?)(?=\*\*MEAL PLAN|$)/g;
    let match;
    
    while ((match = planRegex.exec(planText)) !== null) {
      const [, number, name, content] = match;
      const lines = content.trim().split('\n').filter(line => line.trim());
      
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
      
      // Extract food items (everything except totals line)
      const foodItems = lines.filter(line => !line.toLowerCase().includes('totals:')).join('\n');
      
      plans.push({
        id: number,
        name: name.trim(),
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
      ) : (
        /* If no user is logged in, Auth.js will handle showing the login UI */
        // This part will likely not be visible as Auth.js gatekeeps the App component
        <p>Please log in.</p>
      )}
    </div>
  );
}

export default App;
