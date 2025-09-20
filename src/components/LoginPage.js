import React, { useState } from 'react';
import './LoginPage.css';

function LoginPage({ onGeneratePlan, isLoading }) {
  const [userGoal, setUserGoal] = useState('');

  const handleGenerateClick = () => {
    // Call the function passed down from the App component
    onGeneratePlan(userGoal);
  };

  return (
    <div className="login-container">
      <h1>Purdue Fitness Pal</h1>
      <p>Your personal guide to dining hall nutrition.</p>
      <div className="form-group">
        <label htmlFor="goal">What is your primary fitness goal?</label>
        <input
          id="goal"
          type="text"
          placeholder="e.g., Build muscle, lose weight, vegan..."
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          disabled={isLoading} // Disable input while loading
        />
      </div>
      <button
        className="btn-primary"
        onClick={handleGenerateClick}
        disabled={isLoading} // Disable button while loading
      >
        {isLoading ? 'Generating...' : 'Generate My Meal Plan'}
      </button>
    </div>
  );
}

export default LoginPage;
