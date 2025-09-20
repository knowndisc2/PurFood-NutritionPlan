import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import MealPlanDisplay from './components/MealPlanDisplay';
import { auth } from './firebase'; // Auth only
import { useAuthState } from 'react-firebase-hooks/auth'; // Import the hook
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
  const [user] = useAuthState(auth); // Get the current user
  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getApiBase = () => {
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:4000';
    }
    return window.location.origin;
  };

  // This function now saves the goal to Firestore and then fetches the plan
  const handleGeneratePlan = async (goal) => {
    if (!user) {
      alert('You must be logged in to generate a plan!');
      return;
    }

    console.log('Generating plan in App.js for goal:', goal);
    setIsLoading(true);

    // Simulate a small delay for fetching the AI plan
    setTimeout(() => {
      setMealPlan(MOCK_MEAL_PLAN);
      setIsLoading(false);
    }, 1200);
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
