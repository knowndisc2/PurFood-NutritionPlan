// Meal plan generation endpoint
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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

  res.status(200).json({
    success: true,
    planText: mockPlan,
    message: 'Mock meal plan generated successfully',
    timestamp: new Date().toISOString()
  });
}
