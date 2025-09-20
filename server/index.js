require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { app: sessionApp, authMiddleware } = require('./session');
const {
  findUserById,
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
} = require('./db');

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

app.get('/api/users/profile', authMiddleware, (req, res) => {
  try {
    const user = findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/users/profile', authMiddleware, (req, res) => {
  try {
    const { email, password, ...updateData } = req.body;
    
    const updatedUser = updateUser(req.user.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      user: userWithoutPassword,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/users/profile', authMiddleware, (req, res) => {
  try {
    const deleted = deleteUser(req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.post('/api/goals', authMiddleware, (req, res) => {
  try {
    const { type, targetValue, unit, deadline, description, currentValue } = req.body;
    
    if (!type || !targetValue || !unit) {
      return res.status(400).json({ 
        error: 'Type, target value, and unit are required' 
      });
    }
    
    const goal = createGoal({
      userId: req.user.id,
      type,
      targetValue,
      currentValue,
      unit,
      deadline,
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

app.get('/api/goals', authMiddleware, (req, res) => {
  try {
    const goals = getUserGoals(req.user.id);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.put('/api/goals/:id', authMiddleware, (req, res) => {
  try {
    const goalId = req.params.id;
    const updateData = req.body;
    
    const goals = getUserGoals(req.user.id);
    const goalExists = goals.find(g => g.id === goalId);
    
    if (!goalExists) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const updatedGoal = updateGoal(goalId, updateData);
    res.json({
      goal: updatedGoal,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/goals/:id', authMiddleware, (req, res) => {
  try {
    const goalId = req.params.id;
    
    const goals = getUserGoals(req.user.id);
    const goalExists = goals.find(g => g.id === goalId);
    
    if (!goalExists) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const deleted = deleteGoal(goalId);
    if (deleted) {
      res.json({ message: 'Goal deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

app.post('/api/meals', authMiddleware, (req, res) => {
  try {
    const { name, foods, totalCalories, totalProtein, totalCarbs, totalFat, mealType, consumedAt, notes } = req.body;
    
    if (!name || !mealType) {
      return res.status(400).json({ 
        error: 'Meal name and type are required' 
      });
    }
    
    const meal = createMeal({
      userId: req.user.id,
      name,
      foods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      mealType,
      consumedAt,
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

app.get('/api/meals', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const meals = getUserMeals(req.user.id, limit);
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

app.put('/api/meals/:id', authMiddleware, (req, res) => {
  try {
    const mealId = req.params.id;
    const updateData = req.body;
    
    const meals = getUserMeals(req.user.id);
    const mealExists = meals.find(m => m.id === mealId);
    
    if (!mealExists) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    const updatedMeal = updateMeal(mealId, updateData);
    res.json({
      meal: updatedMeal,
      message: 'Meal updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

app.delete('/api/meals/:id', authMiddleware, (req, res) => {
  try {
    const mealId = req.params.id;
    
    const meals = getUserMeals(req.user.id);
    const mealExists = meals.find(m => m.id === mealId);
    
    if (!mealExists) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    const deleted = deleteMeal(mealId);
    if (deleted) {
      res.json({ message: 'Meal deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete meal' });
    }
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
