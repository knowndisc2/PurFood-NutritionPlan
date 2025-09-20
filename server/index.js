require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { app: sessionApp, authMiddleware } = require('./session');
const {
  getUserById,
  updateUserById,
  deleteUserById,
  createGoal,
  getGoalsByUser,
  getGoalById,
  updateGoal,
  deleteGoal,
  createMeal,
  getMealsByUser,
  getMealById,
  updateMeal,
  deleteMeal
} = require('./repo');

const app = express();
const PORT = process.env.PORT || 4000;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { email, password, ...updateData } = req.body;
    const updatedUser = await updateUserById(req.user.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    await deleteUserById(req.user.id);
    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  try {
    const { type, targetValue, unit, deadline, description, currentValue } = req.body;
    
    if (!type || !targetValue || !unit) {
      return res.status(400).json({ 
        error: 'Type, target value, and unit are required' 
      });
    }
    
    const goal = await createGoal({
      userId: req.user.id,
      type,
      targetValue,
      currentValue,
      unit,
      deadline: deadline ? new Date(deadline) : null,
      description
    });
    
    res.status(201).json({
      goal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.get('/api/goals', authMiddleware, async (req, res) => {
  try {
    const goals = await getGoalsByUser(req.user.id);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    const goalId = req.params.id;
    const updateData = req.body;
    const goal = await getGoalById(goalId);
    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    const updatedGoal = await updateGoal(goalId, {
      ...updateData,
      deadline: updateData.deadline ? new Date(updateData.deadline) : undefined,
    });
    res.json({ goal: updatedGoal, message: 'Goal updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await getGoalById(goalId);
    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    await deleteGoal(goalId);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

app.post('/api/meals', authMiddleware, async (req, res) => {
  try {
    const { name, foods, totalCalories, totalProtein, totalCarbs, totalFat, mealType, consumedAt, notes } = req.body;
    
    if (!name || !mealType) {
      return res.status(400).json({ 
        error: 'Meal name and type are required' 
      });
    }
    
    const meal = await createMeal({
      userId: req.user.id,
      name,
      foods: foods || null,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      mealType,
      consumedAt: consumedAt ? new Date(consumedAt) : undefined,
      notes
    });
    
    res.status(201).json({
      meal,
      message: 'Meal logged successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

app.get('/api/meals', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const meals = await getMealsByUser(req.user.id, limit);
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

app.put('/api/meals/:id', authMiddleware, async (req, res) => {
  try {
    const mealId = req.params.id;
    const updateData = req.body;
    const meal = await getMealById(mealId);
    if (!meal || meal.userId !== req.user.id) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    const updatedMeal = await updateMeal(mealId, {
      ...updateData,
      consumedAt: updateData.consumedAt ? new Date(updateData.consumedAt) : undefined,
    });
    res.json({ meal: updatedMeal, message: 'Meal updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

app.delete('/api/meals/:id', authMiddleware, async (req, res) => {
  try {
    const mealId = req.params.id;
    const meal = await getMealById(mealId);
    if (!meal || meal.userId !== req.user.id) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    await deleteMeal(mealId);
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

app.use(sessionApp);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
