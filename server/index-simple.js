// Simplified backend for Vercel deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
  origin: [
    'https://knowndisc2.github.io',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'PurFood API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock meal generation endpoint (for testing)
app.post('/api/generate-plan', (req, res) => {
  try {
    const mockPlan = `**MEAL PLAN 1**
Earhart
* Breaded Pork Tenderloin (1 Each Serving) Calories: 176 Protein: 22.7g Carbs: 11.3g Fat: 4.4g
* Sweet Potato Wedge Fries (6 oz Serving) Calories: 320 Protein: 2.0g Carbs: 50.0g Fat: 12.0g
Totals: 496 cal, 25g protein, 61g carbs, 16g fat

**MEAL PLAN 2**
Ford
* Chicken And Noodles (Cup Serving) Calories: 443 Protein: 18.4g Carbs: 51.2g Fat: 17.3g
* Green Beans (1/2 Cup Serving) Calories: 15 Protein: 1.0g Carbs: 2.9g Fat: 0g
Totals: 458 cal, 19g protein, 54g carbs, 17g fat

**MEAL PLAN 3**
Wiley
* Lasagna (4x4 Cut Serving) Calories: 202 Protein: 12.7g Carbs: 24.7g Fat: 6.0g
* Fresh Spinach (Ounce) Calories: 7 Protein: 0.8g Carbs: 1.0g Fat: 0.1g
Totals: 209 cal, 13g protein, 26g carbs, 6g fat`;

    res.json({ 
      success: true, 
      planText: mockPlan,
      message: 'Mock meal plan generated successfully'
    });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate meal plan',
      details: error.message 
    });
  }
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl 
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 PurFood API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
