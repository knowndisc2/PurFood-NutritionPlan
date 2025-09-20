const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

const testAPI = async () => {
  try {
    console.log('Testing PurFood Nutrition API...\n');
    
    console.log('1. Health Check');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check passed:', health.data);
    
    console.log('\n2. User Registration');
    const registerData = {
      email: 'test@example.com',
      password: 'TestPass123',
      firstName: 'Test',
      lastName: 'User',
      age: 25,
      weight: 70,
      height: 175,
      activityLevel: 'moderate'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/register`, registerData, {
      withCredentials: true
    });
    console.log('✓ User registered:', registerResponse.data.user.email);
    
    console.log('\n3. User Login');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'TestPass123'
    }, {
      withCredentials: true
    });
    console.log('✓ User logged in:', loginResponse.data.user.email);
    
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies[0] : '';
    
    console.log('\n4. Create Goal');
    const goalData = {
      type: 'weight_loss',
      targetValue: 65,
      currentValue: 70,
      unit: 'kg',
      deadline: '2024-12-31',
      description: 'Lose 5kg by end of year'
    };
    
    const goalResponse = await axios.post(`${BASE_URL}/goals`, goalData, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('✓ Goal created:', goalResponse.data.goal.type);
    
    console.log('\n5. Log Meal');
    const mealData = {
      name: 'Breakfast Bowl',
      foods: [
        { name: 'Oatmeal', quantity: 50, unit: 'g', calories: 190 },
        { name: 'Banana', quantity: 1, unit: 'piece', calories: 105 }
      ],
      totalCalories: 295,
      totalProtein: 8,
      totalCarbs: 54,
      totalFat: 3,
      mealType: 'breakfast',
      notes: 'Healthy start to the day'
    };
    
    const mealResponse = await axios.post(`${BASE_URL}/meals`, mealData, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('✓ Meal logged:', mealResponse.data.meal.name);
    
    console.log('\n6. Get User Profile');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('✓ Profile retrieved:', profileResponse.data.email);
    
    console.log('\n7. Get Goals');
    const goalsResponse = await axios.get(`${BASE_URL}/goals`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('✓ Goals retrieved:', goalsResponse.data.length, 'goals');
    
    console.log('\n8. Get Meals');
    const mealsResponse = await axios.get(`${BASE_URL}/meals`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    console.log('✓ Meals retrieved:', mealsResponse.data.length, 'meals');
    
    console.log('\n✅ All tests passed! API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
