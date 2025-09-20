import React, { useState } from 'react';
// Styles provided by Tailwind via global src/index.css

// 1. Accept onGeneratePlan and isLoading as props
function LoginPage({ onGeneratePlan, isLoading }) {
  const [userGoal, setUserGoal] = useState('');

  const handleGenerateClick = () => {
    // 2. Call the function passed down from the App component
    onGeneratePlan(userGoal);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-900">Purdue Fitness Pal</h1>
      <p className="text-gray-600 mt-1 mb-4">Your personal guide to dining hall nutrition.</p>

      <div className="flex flex-col gap-2 text-left">
        <label htmlFor="goal" className="font-medium">What is your primary fitness goal?</label>
        <input
          id="goal"
          type="text"
          placeholder="e.g., High protein, under 2000 calories"
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          disabled={isLoading}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdueGold disabled:bg-gray-100"
        />
      </div>

      <button
        className="mt-4 inline-flex items-center justify-center bg-purdueGold text-black font-semibold py-2 px-4 rounded hover:bg-[#b89f6a] transition-colors disabled:opacity-50"
        onClick={handleGenerateClick}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate My Meal Plan'}
      </button>
    </div>
  );
}

export default LoginPage;