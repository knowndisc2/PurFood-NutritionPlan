const users = [];
const goals = [];
const mealHistory = [];

const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

const findUserById = (id) => {
  return users.find(user => user.id === id);
};

const createUser = (userData) => {
  const user = {
    id: Date.now().toString(),
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    age: userData.age || null,
    weight: userData.weight || null,
    height: userData.height || null,
    activityLevel: userData.activityLevel || 'moderate',
    dietaryRestrictions: userData.dietaryRestrictions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(user);
  return user;
};

const updateUser = (id, updateData) => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  return users[userIndex];
};

const deleteUser = (id) => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return false;
  
  users.splice(userIndex, 1);
  goals.splice(0, goals.length, ...goals.filter(goal => goal.userId !== id));
  mealHistory.splice(0, mealHistory.length, ...mealHistory.filter(meal => meal.userId !== id));
  return true;
};

const createGoal = (goalData) => {
  const goal = {
    id: Date.now().toString(),
    userId: goalData.userId,
    type: goalData.type,
    targetValue: goalData.targetValue,
    currentValue: goalData.currentValue || 0,
    unit: goalData.unit,
    deadline: goalData.deadline,
    description: goalData.description || '',
    isActive: goalData.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  goals.push(goal);
  return goal;
};

const getUserGoals = (userId) => {
  return goals.filter(goal => goal.userId === userId);
};

const updateGoal = (id, updateData) => {
  const goalIndex = goals.findIndex(goal => goal.id === id);
  if (goalIndex === -1) return null;
  
  goals[goalIndex] = {
    ...goals[goalIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  return goals[goalIndex];
};

const deleteGoal = (id) => {
  const goalIndex = goals.findIndex(goal => goal.id === id);
  if (goalIndex === -1) return false;
  
  goals.splice(goalIndex, 1);
  return true;
};

const createMeal = (mealData) => {
  const meal = {
    id: Date.now().toString(),
    userId: mealData.userId,
    name: mealData.name,
    foods: mealData.foods || [],
    totalCalories: mealData.totalCalories || 0,
    totalProtein: mealData.totalProtein || 0,
    totalCarbs: mealData.totalCarbs || 0,
    totalFat: mealData.totalFat || 0,
    mealType: mealData.mealType,
    consumedAt: mealData.consumedAt || new Date().toISOString(),
    notes: mealData.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mealHistory.push(meal);
  return meal;
};

const getUserMeals = (userId, limit = 50) => {
  return mealHistory
    .filter(meal => meal.userId === userId)
    .sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt))
    .slice(0, limit);
};

const updateMeal = (id, updateData) => {
  const mealIndex = mealHistory.findIndex(meal => meal.id === id);
  if (mealIndex === -1) return null;
  
  mealHistory[mealIndex] = {
    ...mealHistory[mealIndex],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  return mealHistory[mealIndex];
};

const deleteMeal = (id) => {
  const mealIndex = mealHistory.findIndex(meal => meal.id === id);
  if (mealIndex === -1) return false;
  
  mealHistory.splice(mealIndex, 1);
  return true;
};

module.exports = {
  users,
  goals,
  mealHistory,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  createGoal,
  getUserGoals,
  updateGoal,
  deleteGoal,
  createMeal,
  getUserMeals,
  updateMeal,
  deleteMeal
};
