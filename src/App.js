import React, { useEffect, useState } from 'react';
import GoalForm from './components/GoalForm';
import MealPlanDisplay from './components/MealPlanDisplay';
import { auth } from './firebase'; // Auth only
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `It's impossible to create a completely accurate vegan meal plan hitting the specified macro targets (especially the high fat requirement) using only the provided Earhart Dining Court options.  Vegan options for high-fat foods are limited.  The following plans attempt to get as close as possible, prioritizing protein and carbs while acknowledging the fat limitations.  The fat content will be significantly lower than the goal.


**MEAL PLAN 1: Hearty Harvest Bowl**

* 1 Cup Linguini (172 cal, 5.67g protein, 34.02g carbs)
* 1/2 Cup Whipped Potatoes (107 cal, 2.38g protein, 20.21g carbs)
* 1/2 Cup Long Grain Rice (122 cal, 2.28g protein, 27.35g carbs)
* 1/2 Cup Fried Rice (182 cal, 3.89g protein, 27.47g carbs)
* 1/2 Cup Green Beans (15 cal, 0.98g protein, 2.93g carbs)
* 2 oz Vegan Shredded Mozzarella Cheese (180 cal, 2g protein, 12g carbs)  *(Note: This is an estimation assuming 90 calories per ounce)*
* Summer Symphony Fruit Salad (65 cal, 0.71g protein, 16.68g carbs)


Totals: ~843 cal, 17.91g protein, 141.64g carbs,  (Fat content cannot be accurately calculated from the provided information and is likely low)


**MEAL PLAN 2:  Global Grain Fusion**

* 2 Cups Linguini (344 cal, 11.34g protein, 68.04g carbs)
* 1/2 Cup Long Grain Rice (122 cal, 2.28g protein, 27.35g carbs)
* 1/2 Cup Fried Rice (182 cal, 3.89g protein, 27.47g carbs)
* 1 Cup Green Beans (30 cal, 1.95g protein, 5.85g carbs)
* Summer Symphony Fruit Salad (65 cal, 0.71g protein, 16.68g carbs)
* 2 oz Vegan Shredded Mozzarella Cheese (180 cal, 2g protein, 12g carbs) *(Note: This is an estimation assuming 90 calories per ounce)*
* 2 GF Blueberry Muffins (540 cal, 6g protein, 78g carbs)


Totals: ~1483 cal, 28.17g protein, 258.09g carbs (Fat content cannot be accurately calculated from the provided information and is likely low)



**MEAL PLAN 3:  Pasta Powerhouse**

* 2 Cups Linguini (344 cal, 11.34g protein, 68.04g carbs)
* 1/2 Cup Whipped Potatoes (107 cal, 2.38g protein, 20.21g carbs)
* 1/2 Cup Long Grain Rice (122 cal, 2.28g protein, 27.35g carbs)
* 1 Cup Green Beans (30 cal, 1.95g protein, 5.85g carbs)
* 2 oz Vegan Shredded Mozzarella Cheese (180 cal, 2g protein, 12g carbs) *(Note: This is an estimation assuming 90 calories per ounce)*
* Summer Symphony Fruit Salad (65 cal, 0.71g protein, 16.68g carbs)
* Peanut Butter Cookie (120 cal, 2g protein, 17g carbs)


Totals: ~968 cal, 22.66g protein, 168.13g carbs (Fat content cannot be accurately calculated from the provided information and is likely low)


**Important Note:**  These meal plans significantly underestimate the desired fat intake due to the limited availability of high-fat vegan options in the provided list. To achieve the desired fat macro, additional vegan food sources would be necessary. The calorie and carbohydrate counts are reasonably close to the target; however, protein is somewhat low. Consider supplementing with additional vegan protein sources if available.`;

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
        const caloriesMatch = totalsLine.match(/(\d+)cal/);
        const proteinMatch = totalsLine.match(/(\d+)g protein/);
        const carbsMatch = totalsLine.match(/(\d+)g carbs/);
        const fatMatch = totalsLine.match(/(\d+)g fat/);
        
        calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0;
        protein = proteinMatch ? parseInt(proteinMatch[1]) : 0;
        carbs = carbsMatch ? parseInt(carbsMatch[1]) : 0;
        fat = fatMatch ? parseInt(fatMatch[1]) : 0;
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
