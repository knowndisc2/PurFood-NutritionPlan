import React from 'react';
import { authenticatedFetch } from '../api';
import { auth } from '../firebase/config';
import './MealPlanDisplay.css';

function MealPlanDisplay({ plan, onBack }) {
  const [mealHistory, setMealHistory] = React.useState([]);
  const [loadingMeals, setLoadingMeals] = React.useState(true);
  const [mealsError, setMealsError] = React.useState('');
  const [savingMeal, setSavingMeal] = React.useState(false);

  const fetchMeals = React.useCallback(async () => {
    setLoadingMeals(true);
    setMealsError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const token = await user.getIdToken();
      // Use relative URL to leverage proxy configuration in development
      const url = '/api/fb/meals?limit=10';
      const res = await authenticatedFetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Fetch meals failed: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Unexpected content-type: ${ct}. Body: ${text.slice(0, 200)}`);
      }
      const items = await res.json();
      setMealHistory(items);
    } catch (e) {
      setMealsError(e.message || 'Failed to load meals');
    } finally {
      setLoadingMeals(false);
    }
  }, []);

  const saveMealPlan = React.useCallback(async () => {
    setSavingMeal(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const token = await user.getIdToken();

      console.log('[MealPlan] Saving meal plan with content:', plan.substring(0, 200) + '...');

      // Extract meal information from the plan text
      const mealData = {
        name: `Meal Plan - ${new Date().toLocaleDateString()}`,
        mealType: 'Custom Plan',
        description: plan,
        totalCalories: extractCaloriesFromPlan(plan),
        planContent: plan,
        createdAt: new Date() // Add client-side timestamp for immediate display
      };

      console.log('[MealPlan] Sending meal data:', mealData);

      const res = await authenticatedFetch('/api/fb/meals', {
        method: 'POST',
        body: JSON.stringify(mealData)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[MealPlan] Save failed with response:', text);
        throw new Error(`Save failed: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
      }

      console.log('[MealPlan] Meal plan saved successfully');

      // Refresh the meal history after saving
      await fetchMeals();
      alert('Meal plan saved successfully!');
    } catch (e) {
      console.error('[MealPlan] Save error:', e);
      alert(`Failed to save meal plan: ${e.message}`);
    } finally {
      setSavingMeal(false);
    }
  }, [plan, fetchMeals]);

  // Helper function to extract calories from plan text
  const extractCaloriesFromPlan = (planText) => {
    const calorieMatch = planText.match(/(\d+)\s*calories?/i);
    return calorieMatch ? parseInt(calorieMatch[1]) : 0;
  };

  React.useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return (
    <div className="meal-plan-container">
      <h2>Your Custom Meal Plan</h2>
      <div className="plan-content">
        <pre>{plan}</pre>
      </div>
      
      <div className="plan-actions">
        <button 
          className="btn-primary" 
          onClick={saveMealPlan} 
          disabled={savingMeal}
        >
          {savingMeal ? 'Saving...' : 'Save to Meal History'}
        </button>
      </div>

      <div className="meal-history-section">
        <div className="meal-history-header">
          <h3>Meal History</h3>
          <button className="btn-secondary" onClick={fetchMeals} disabled={loadingMeals}>
            {loadingMeals ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="meal-history-content">
          {loadingMeals && <div>Loading meals…</div>}
          {mealsError && <div className="error-message">Error: {mealsError}</div>}
          {!loadingMeals && !mealsError && (
            <ul className="meal-list">
              {mealHistory.map((m) => (
                <li key={m.id} className="meal-history-item">
                  <div className="meal-info">
                    <strong>{m.name}</strong> 
                    <span className="meal-type">({m.mealType})</span>
                    {m.totalCalories > 0 && (
                      <span className="meal-calories"> - {m.totalCalories} kcal</span>
                    )}
                  </div>
                  {m.createdAt && (
                    <div className="meal-date">
                      {new Date(m.createdAt.seconds * 1000).toLocaleDateString()}
                    </div>
                  )}
                  {m.description && (
                    <div className="meal-description">
                      {m.description.length > 100 
                        ? `${m.description.substring(0, 100)}...` 
                        : m.description
                      }
                    </div>
                  )}
                </li>
              ))}
              {mealHistory.length === 0 && (
                <li className="no-meals-message">
                  📝 No meal history found. Start tracking your meals to see them here!
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <button className="btn-secondary" onClick={onBack}>
        Start Over
      </button>
    </div>
  );
}

export default MealPlanDisplay;
