import React from 'react';
import './MealPlanDisplay.css';

function MealPlanDisplay({ plan, onBack }) {
  return (
    <div className="meal-plan-container">
      <h2>Your Custom Meal Plan</h2>
      <div className="plan-content">
        <pre>{plan}</pre>
      </div>
      <button className="btn-secondary" onClick={onBack}>
        Start Over
      </button>
    </div>
  );
}

export default MealPlanDisplay;
