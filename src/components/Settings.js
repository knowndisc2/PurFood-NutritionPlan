import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function Settings({ user, isOpen, onClose }) {
  const [userStats, setUserStats] = useState({
    dailyGoalCalories: '',
    mealCalories: '',
    height: '',
    weight: '',
    age: '',
    gender: '',
    activityLevel: '',
    dietaryRestrictions: '',
    fitnessGoals: '',
    mealsPerDay: 3,
    preferredDiningHalls: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load user data from Firestore and localStorage
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Try to load from Firestore first
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          setUserStats(prev => ({ ...prev, ...firestoreData }));
        } else {
          // Fallback to localStorage for existing data
          const localData = {
            dailyGoalCalories: localStorage.getItem('onboarding.dailyGoalCalories') || '',
            mealCalories: localStorage.getItem('onboarding.mealCalories') || '',
            height: localStorage.getItem('onboarding.height') || '',
            weight: localStorage.getItem('onboarding.weight') || '',
            age: localStorage.getItem('onboarding.age') || '',
            gender: localStorage.getItem('onboarding.gender') || '',
            activityLevel: localStorage.getItem('onboarding.activityLevel') || '',
            dietaryRestrictions: localStorage.getItem('onboarding.dietaryRestrictions') || '',
            fitnessGoals: localStorage.getItem('onboarding.fitnessGoals') || '',
            mealsPerDay: parseInt(localStorage.getItem('onboarding.mealsPerDay')) || 3,
            preferredDiningHalls: JSON.parse(localStorage.getItem('onboarding.preferredDiningHalls') || '[]')
          };
          setUserStats(prev => ({ ...prev, ...localData }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage('Error loading user data');
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setMessage('');
    
    try {
      // Save to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...userStats,
        updatedAt: serverTimestamp(),
        email: user.email
      }, { merge: true });

      // Also update localStorage for backward compatibility
      Object.entries(userStats).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          localStorage.setItem(`onboarding.${key}`, 
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          );
        }
      });

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving user data:', error);
      setMessage('Error saving settings. Please try again.');
    }
    setIsSaving(false);
  };

  const handleInputChange = (field, value) => {
    setUserStats(prev => ({ ...prev, [field]: value }));
  };

  const calculateBMI = () => {
    const heightM = parseFloat(userStats.height) / 100; // Convert cm to meters
    const weightKg = parseFloat(userStats.weight);
    if (heightM && weightKg) {
      return (weightKg / (heightM * heightM)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-400' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-400' };
    return { category: 'Obese', color: 'text-red-400' };
  };

  if (!isOpen) return null;

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purdue-gold">Settings & Statistics</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-purdue-gold">Loading your data...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info Section */}
              <div className="bg-black rounded-lg p-4 border border-gray-800">
                <h3 className="text-lg font-semibold text-purdue-gold mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2 text-white">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">User ID:</span>
                    <span className="ml-2 text-white font-mono text-xs">{user?.uid?.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              {/* Caloric Goals Section */}
              <div className="bg-black rounded-lg p-4 border border-gray-800">
                <h3 className="text-lg font-semibold text-purdue-gold mb-3">Caloric Goals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Daily Calorie Goal
                    </label>
                    <input
                      type="number"
                      value={userStats.dailyGoalCalories}
                      onChange={(e) => handleInputChange('dailyGoalCalories', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                      placeholder="2000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Calories per Meal
                    </label>
                    <input
                      type="number"
                      value={userStats.mealCalories}
                      onChange={(e) => handleInputChange('mealCalories', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Stats Section */}
              <div className="bg-black rounded-lg p-4 border border-gray-800">
                <h3 className="text-lg font-semibold text-purdue-gold mb-3">Physical Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={userStats.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={userStats.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={userStats.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                      placeholder="25"
                    />
                  </div>
                </div>

                {/* BMI Display */}
                {bmi && (
                  <div className="mt-4 p-3 bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">BMI:</span>
                      <div className="text-right">
                        <span className="text-white font-semibold">{bmi}</span>
                        {bmiInfo && (
                          <span className={`ml-2 text-sm ${bmiInfo.color}`}>
                            ({bmiInfo.category})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preferences Section */}
              <div className="bg-black rounded-lg p-4 border border-gray-800">
                <h3 className="text-lg font-semibold text-purdue-gold mb-3">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={userStats.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Activity Level
                    </label>
                    <select
                      value={userStats.activityLevel}
                      onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                    >
                      <option value="">Select Activity Level</option>
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Lightly Active</option>
                      <option value="moderate">Moderately Active</option>
                      <option value="very">Very Active</option>
                      <option value="extra">Extra Active</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Dietary Restrictions
                  </label>
                  <textarea
                    value={userStats.dietaryRestrictions}
                    onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                    placeholder="e.g., vegetarian, gluten-free, allergies..."
                    rows="2"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fitness Goals
                  </label>
                  <textarea
                    value={userStats.fitnessGoals}
                    onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-neutral-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purdue-gold"
                    placeholder="e.g., lose weight, gain muscle, maintain health..."
                    rows="2"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex-1">
                  {message && (
                    <div className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                      {message}
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-purdue-gold text-purdue-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
