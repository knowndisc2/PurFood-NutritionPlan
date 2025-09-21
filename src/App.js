import React, { useState } from 'react';
import GoalForm from './components/GoalForm';
import MealPlanDisplay from './components/MealPlanDisplay';
import { auth } from './firebase'; // Auth only
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `**MEAL PLAN 1:  Hearty Italian Veggie Feast**

* 2 Lasagna (4x4 Cut): 404 cal, 26g protein, 50g carbs, 4g fat
* Thin Pizza Crust (Each): 190 cal, 5g protein, 36g carbs, 2g fat
* Pizza Sauce (1/2 cup): 70 cal, 1g protein, 10g carbs, 4g fat
* 2 oz Grated Parmesan Cheese: 226 cal, 22g protein, 0g carbs, 20g fat
* Kale Pesto (1/4 cup): 160 cal, 2g protein, 2g carbs, 3g fat
* Roasted Brussels Sprouts (4 oz): 110 cal, 4g protein, 11g carbs, 4g fat
* Long Grain Rice (1/2 Cup): 122 cal, 2g protein, 27g carbs, 1g fat
* Sliced Fresh Mushrooms (1/2 Cup): 6 cal, 0g protein, 0g carbs, 0g fat
* Sliced Red Onions (2 slices): 4 cal, 0g protein, 1g carbs, 0g fat


Totals: 1296 cal, 60g protein, 187g carbs, 38g fat


**MEAL PLAN 2:  Mediterranean Veggie Bowl**

* Lasagna Rollups with Alfredo Sauce (1 Roll Up): 470 cal, 14g protein, 35g carbs, 20g fat
* Roasted Brussels Sprouts (8 oz): 220 cal, 8g protein, 22g carbs, 8g fat
* Grilled Zucchini (6 oz): 177 cal, 1.5g protein, 6g carbs, 1.5g fat
* Long Grain Rice (1 Cup): 244 cal, 4g protein, 54g carbs, 2g fat
* White Grapes (8 oz): 148 cal, 1g protein, 38g carbs, 1g fat
* Mini Spring Rolls (4 Each): 160 cal, 0g protein, 28g carbs, 8g fat
* Vegan Shredded Mozzarella Cheese (2 oz): 180 cal, 1g protein, 12g carbs, 8g fat


Totals: 1600 cal, 30g protein, 201g carbs, 58g fat


**MEAL PLAN 3:  Asian-Inspired Vegetarian Delight**

* Fried Rice (1 Cup): 364 cal, 8g protein, 54g carbs, 8g fat
* Mini Spring Rolls (6 Each): 120 cal, 0g protein, 21g carbs, 6g fat
* Tempura Sweet and Sour Sauce (1 Cup): 376 cal, 1g protein, 94g carbs, 16g fat
* Long Grain Rice (1 Cup): 244 cal, 4g protein, 54g carbs, 2g fat
* Garlic Bread (2 pieces): 144 cal, 4g protein, 20g carbs, 6g fat
* Roasted Brussels Sprouts (4 oz): 110 cal, 4g protein, 11g carbs, 4g fat
* Dark Chocolate Sea Salt Seed'nola (1 oz): 132 cal, 4g protein, 13g carbs, 4g fat


Totals: 1470 cal, 21g protein, 267g carbs, 46g fat


**Note:**  These meal plans aim to meet the macro targets as closely as possible given the limited and somewhat inaccurate nutritional information provided for the dining hall options.  Actual macronutrient content may vary slightly.  It is also advisable to check the ingredients for allergens or other specific dietary requirements before consuming any item.  The  "MYO Stir Fry" and "Salad Bar" options are excluded due to their lack of nutritional data.  Some adjustments might be needed based on actual available food items and their exact nutritional information.`;

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
