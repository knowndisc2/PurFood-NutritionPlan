import React, { useState } from 'react';
import GoalForm from './components/GoalForm';
import MealPlanDisplay from './components/MealPlanDisplay';
import { auth } from './firebase'; // Auth only
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `**MEAL PLAN 1: The Pulled Pork Powerhouse**

* Austin Blues Pulled Pork (4 oz): 408 cal, 26g protein, 25g carbs, 0g fat
* Hamburger Bun (Bun): 140 cal, 4g protein, 28g carbs, 0g fat
* Creamy Coleslaw (1/2 Cup): 89 cal, 0.5g protein, 12g carbs, 0g fat (estimating 0g fat for simplicity)
* Crinkle Cut Fries (4 oz): 162 cal, 3g protein, 24g carbs, 0g fat (estimating 0g fat for simplicity)
* Lasagna (4x4 Cut): 202 cal, 13g protein, 25g carbs, 0g fat (estimating 0g fat for simplicity)
* Roasted Brussels Sprouts (4 oz): 110 cal, 4g protein, 11g carbs, 0g fat (estimating 0g fat for simplicity)
* Long Grain Rice (1/2 Cup): 122 cal, 2g protein, 27g carbs, 0g fat (estimating 0g fat for simplicity)
*  Grated Parmesan Cheese (1 ounce): 113 cal, 11g protein, 0g carbs, 0g fat (estimating 0g fat for simplicity)


Totals: 1346 cal, 63.5g protein, 152g carbs, 0g fat (Note: Fat significantly under target.  This plan needs adjustment to meet the fat requirement, see below.)


**ADJUSTMENT FOR MEAL PLAN 1:** To reach the fat target, we need to add high-fat items, which are limited in the provided menu. We will substitute some items to increase fat content, even though this impacts other macros slightly.

* Austin Blues Pulled Pork (4 oz): 408 cal, 26g protein, 25g carbs, 10g fat (corrected to reflect that pulled pork has some fat)
* Hamburger Bun (1 Bun): 140 cal, 4g protein, 28g carbs, 2g fat (added a conservative estimate for fat content)
* Creamy Coleslaw (1 Cup): 178 cal, 1g protein, 24g carbs, 5g fat (Doubled portion to boost fat)
* Crinkle Cut Fries (4 oz): 162 cal, 3g protein, 24g carbs, 5g fat (added a conservative estimate for fat content)
*  Grated Parmesan Cheese (2 ounce): 226 cal, 22g protein, 0g carbs, 5g fat (Doubled portion to boost fat)

Totals (Adjusted): 1124 cal, 58g protein, 101g carbs, 27g fat (Still significantly short on the fat, but we can improve it in the other meal plans).


**MEAL PLAN 2: The Italian Fiesta**

* Thin Pizza Crust (1 Each): 190 cal, 5g protein, 36g carbs, 1g fat (estimating fat)
* Pizza Sauce (1/2 cup): 70 cal, 1g protein, 10g carbs, 2g fat (doubled portion)
* Diced Pepperoni (2 Tablespoons): 178 cal, 6g protein, 0g carbs, 10g fat (doubled portion)
* Shredded 3 Cheese Blend (2 ounces): 194 cal, 12g protein, 2g carbs, 10g fat (doubled portion)
* Lasagna Rollups with Alfredo Sauce (1 Roll Up): 470 cal, 14g protein, 35g carbs, 20g fat (added to increase fat and calories)
* Garlic Bread (1 piece): 72 cal, 2g protein, 10g carbs, 5g fat (adding a conservative estimate for fat content)
* Salad Bar (Large serving of lettuce, tomatoes, and cucumbers): 50 cal, 1g protein, 2g carbs, 0.5g fat (variable – an attempt to add greens for nutritional value and only a minor macro contribution)

Totals: 1224 cal, 41g protein, 105g carbs, 48.5g fat


**MEAL PLAN 3: The Asian Fusion**

* Mini Spring Rolls (4 Each): 160 cal, 0g protein, 28g carbs, 5g fat (estimating some fat)
* Tempura Sweet and Sour Sauce (1 Cup): 376 cal, 1g protein, 94g carbs, 10g fat (doubled portion)
* Fried Rice (1 Cup): 364 cal, 8g protein, 54g carbs, 10g fat (doubled portion)
* Long Grain Rice (1 Cup): 244 cal, 4g protein, 54g carbs, 1g fat (doubled portion)
* Grilled Zucchini (3 oz): 59 cal, 0.5g protein, 2g carbs, 0g fat
* Austin Blues Pulled Pork (2 oz): 204 cal, 13g protein, 12.5g carbs, 5g fat (half portion of pulled pork for added protein)
* Dark Chocolate Sea Salt Seed'nola (1 ounce): 132 cal, 4g protein, 13g carbs, 5g fat

Totals: 1539 cal, 30.5g protein, 263.5g carbs, 36g fat


**Important Note:** The fat content in these plans remains challenging to accurately meet with the given options and their listed nutritional information.  Many items list only a small amount of fat or 0g fat, and accurate fat content can be variable depending on cooking methods and preparation.  These meal plans provide a reasonable approximation; however, to fully achieve the 2000 calorie, 125g protein, 225g carb, and 67g fat targets, additional high-fat options would be needed in the dining hall.`;

function App() {
  const [user] = useAuthState(auth); // Get the current user
  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // This function now saves the goal to Firestore and then fetches the plan
  const handleGeneratePlan = async (goal) => {
    if (!user) {
      alert('You must be logged in to generate a plan!');
      return;
    }

    console.log('Generating plan in App.js for goal:', goal);
    setIsLoading(true);

    // Use the updated meal plan from the constant
    setTimeout(() => {
      const parsedPlans = parseMealPlans(MOCK_MEAL_PLAN);
      setMealPlan({ rawText: MOCK_MEAL_PLAN, plans: parsedPlans });
      setIsLoading(false);
    }, 1200);
  };

  const handleStartOver = () => {
    setMealPlan(null);
  };
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
