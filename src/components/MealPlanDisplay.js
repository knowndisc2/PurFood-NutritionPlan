import React from 'react';
import { auth } from '../firebase';
import './MealPlanDisplay.css';

function MealPlanDisplay({ plan, onBack }) {
  const [mealHistory, setMealHistory] = React.useState([]);
  const [loadingMeals, setLoadingMeals] = React.useState(true);
  const [mealsError, setMealsError] = React.useState('');

  const fetchMeals = React.useCallback(async () => {
    setLoadingMeals(true);
    setMealsError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const token = await user.getIdToken();
      const apiBase = process.env.NODE_ENV !== 'production' ? 'http://localhost:4000' : window.location.origin;
      const url = `${apiBase}/api/fb/meals?limit=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  React.useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return (
    <div className="meal-plan-container">
      <h2>Your Custom Meal Plan</h2>
      <div className="plan-content">
        <pre>{plan}</pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ marginBottom: 8 }}>Meal History</h3>
          <button className="btn-secondary" onClick={fetchMeals} disabled={loadingMeals}>
            {loadingMeals ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fafafa' }}>
          {loadingMeals && <div>Loading meals…</div>}
          {mealsError && <div style={{ color: '#b00020' }}>Error: {mealsError}</div>}
          {!loadingMeals && !mealsError && (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {mealHistory.map((m) => (
                <li key={m.id}>
                  {m.name} ({m.mealType}) - {m.totalCalories || 0} kcal
                </li>
              ))}
              {mealHistory.length === 0 && <li>No meals recorded yet.</li>}
            </ul>
          )}
        </div>
      </div>

      <button className="btn-secondary" onClick={onBack} style={{ marginTop: 24 }}>
        Start Over
      </button>
    </div>
  );
}

export default MealPlanDisplay;
