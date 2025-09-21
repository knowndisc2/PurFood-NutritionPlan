import React, { useState } from 'react';
// The props ({ onGeneratePlan, isLoading }) are passed down from App.js
function GoalForm({ onGeneratePlan, isLoading }) {
    // State for each form input
    const [calories, setCalories] = useState('2000');
    const [macros, setMacros] = useState({ protein: 25, carbs: 45, fats: 30 });
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [mealPrefs, setMealPrefs] = useState(['Lunch', 'Dinner']); // Let's pre-select some
    const [aiPrompt, setAiPrompt] = useState('');

    const handlePrefToggle = (preference, prefList, setPrefList) => {
        if (prefList.includes(preference)) {
          setPrefList(prefList.filter((p) => p !== preference));
        } else {
          setPrefList([...prefList, preference]);
        }
      };

      const handleSubmit = () => {
        const allGoals = {
          calories,
          macros,
          dietaryPrefs,
          mealPrefs,
          aiPrompt,
        };
        // This calls the function from App.js, sending all our data up
        onGeneratePlan(allGoals);
      };
}

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-purdue-gold">
                Personalized Nutrition at Purdue
                </h1>
                <p className="text-purdue-gold mt-2">
                Set your dietary goals and discover meals from Purdue dining courts that perfectly match your nutritional needs.
                </p>  
            </div>
            {/* The main form card: white, rounded, shadowed, and responsive width */}
            <div className="bg-black p-8 rounded-xl shadow-lg w-full max-w-4xl">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div> 
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Daily Targets</h2>
                            <div className= "mb-6">
                                <label htmlFor="calories" className="block text-sm font-medium text-gray-600 mb-1">
                                    Daily Calories
                                </label>
                                <input 
                                    type="text"
                                    id="calories"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                    defaultValue="2000" 
                                    className="w-full p-2 border ... rounded-md focus:ring-2 ..." 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Macronutrient Distribution (%)
                                </label>
                                {/* Protein Slider */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Protein</span>
                                        <span>{macros.protein}%</span>
                                    </div>
                                    <input 
                                    type="range" 
                                    min="0"
                                    max="100"
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    value={macros.protein}
                                    onChange={(e) => setMacros({ ...macros, protein: e.target.value })}
                                    />
                                </div>
                                {/* Carbs Slider */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Carbohydrates</span>
                                        <span>{macros.carbs}%</span>
                                    </div>
                                    <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={macros.carbs}
                                    onChange={(e) => setMacros({ ...macros, carbs: e.target.value })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                                {/* Fats Slider */}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Fats</span>
                                        <span>{macros.fats}%</span>
                                    </div>
                                    <input 
                                    type="range" 
                                    min="0"
                                    max="100"
                                    value={macros.fats}
                                    onChange={(e) => setMacros({ ...macros, fats: e.target.value })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                            </div>
                        </div>
                        

                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Dietary Preferences</h3>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Vegetarian</button>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Vegan</button>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Gluten-Free</button>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Dairy-Free</button>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Nut-Free</button>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Shellfish-Free</button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-2">Meal Preferences</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Breakfast/Brunch</button>
                            <button className="py-2 px-4 border-purple-400 bg-purple-50 rounded-md text-sm text-purple-700 ring-2 ring-purple-200">Lunch</button>
                            <button className="py-2 px-4 border-purple-400 bg-purple-50 rounded-md text-sm text-purple-700 ring-2 ring-purple-200">Dinner</button>
                            <button className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Late Lunch</button>
                        </div>
                    </div>

                </div>  
                 {/* AI Assistant Text Area */}
                <div className="mt-8">
                    <label htmlFor="ai-assistant" className="block text-sm font-medium text-gray-600 mb-1">
                        AI Assistant (Optional)
                    </label>
                    <textarea
                        id="ai-assistant"
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purdue-gold focus:border-purdue-gold"
                        placeholder="Describe any specific goals, preferences, or requirements in natural language..."
                    ></textarea>
                </div>

                {/* Generate Button */}
                <div className="mt-8">
                    <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-purdue-gold text-purdue-black font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                        Generate Meal Suggestions &rarr;
                    {isLoading ? 'Generating...' : 'Generate Meal Suggestions →'}
                    </button>
                </div>      
            </div>
        </div>
    );
export default GoalForm;