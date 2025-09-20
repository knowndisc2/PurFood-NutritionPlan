import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import MealPlanDisplay from './components/MealPlanDisplay';
import './App.css';

// This is our mock data. In the future, this will come from the AI.
const MOCK_MEAL_PLAN = `
**Your High-Protein Meal Plan**

Here is a sample plan based on today's menu at Wiley Dining Court:

*   **Breakfast:**
    *   Scrambled Eggs (Protein)
    *   Sausage Links (Protein)
    *   Oatmeal with a scoop of protein powder (Complex Carbs, Protein)

*   **Lunch:**
    *   Grilled Chicken Breast from the grill station (Lean Protein)
    *   Quinoa Salad from the salad bar (Complex Carbs, Fiber)
    *   Steamed Broccoli (Vitamins, Fiber)

*   **Dinner:**
    *   Beef Stir-fry with extra beef (Protein, Veggies)
    *   A side of brown rice (Complex Carbs)
    *   A glass of milk (Protein, Calcium)
`;

function App() {
  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // This function simulates fetching the meal plan from the backend
  const handleGeneratePlan = (goal) => {
    console.log('Generating plan in App.js for goal:', goal);
    setIsLoading(true);

    // Simulate a 2-second network delay
    setTimeout(() => {
      setMealPlan(MOCK_MEAL_PLAN);
      setIsLoading(false);
    }, 2000);
  };

  const handleStartOver = () => {
    setMealPlan(null);
  };

  return (
    <div className="App">
      {mealPlan ? (
        <MealPlanDisplay plan={mealPlan} onBack={handleStartOver} />
      ) : (
        <LoginPage onGeneratePlan={handleGeneratePlan} isLoading={isLoading} />
      )}
    </div>
  );
}

export default App;
