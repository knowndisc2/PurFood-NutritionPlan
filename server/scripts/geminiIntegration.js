// server/scripts/geminiIntegration.js
// Generates a plan text using Google Gemini (if GEMINI_API_KEY is set) or a fallback string.

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

function pickFirstCourtWithItems(menu = {}) {
  try {
    for (const [courtName, courtData] of Object.entries(menu)) {
      if (courtData && typeof courtData === 'object' && (courtData.total_items || 0) > 0) {
        return [courtName, courtData];
      }
    }
  } catch {}
  // Fallback: pick the first court if any
  const first = Object.entries(menu || {})[0];
  return first || [null, null];
}

function formatFoodDataForAI(courtData = {}) {
  let formatted = `Dining Court: ${courtData?.dining_court || 'Unknown'}\n\n`;
  const stations = courtData?.stations || {};
  for (const [stationName, items] of Object.entries(stations)) {
    formatted += `Station: ${stationName}\n`;
    for (const item of items || []) {
      const name = item?.name ?? 'Unknown';
      const calories = item?.total_calories ?? 'N/A';
      const protein = item?.protein_g ?? 'N/A';
      const carbs = item?.total_carbs_g ?? 'N/A';
      const fiber = item?.dietary_fiber_g ?? 'N/A';
      const cholesterol = item?.cholesterol_mg ?? 'N/A';
      const serving = item?.serving_size ?? 'N/A';
      formatted += `  - ${name} (${serving}): ${calories} cal, ${protein}g protein, ${carbs}g carbs, ${fiber}g fiber, ${cholesterol}mg cholesterol\n`;
    }
    formatted += `\n`;
  }
  return formatted;
}

function updateAppJsWithMealPlan(planText) {
  try {
    const appJsPath = path.join(process.cwd(), 'src', 'App.js');
    let appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    // Escape backticks and other special characters in the plan text
    const escapedPlanText = planText.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    
    // Replace the MOCK_MEAL_PLAN constant
    const newMockMealPlan = `const MOCK_MEAL_PLAN = \`${escapedPlanText}\`;`;
    
    // Find and replace the existing MOCK_MEAL_PLAN
    const mockMealPlanRegex = /const MOCK_MEAL_PLAN = `[\s\S]*?`;/;
    if (mockMealPlanRegex.test(appJsContent)) {
      appJsContent = appJsContent.replace(mockMealPlanRegex, newMockMealPlan);
    } else {
      // If pattern not found, try to insert after imports
      const insertPoint = appJsContent.indexOf('// This is our mock data');
      if (insertPoint !== -1) {
        const beforeInsert = appJsContent.substring(0, insertPoint);
        const afterInsert = appJsContent.substring(insertPoint);
        appJsContent = beforeInsert + newMockMealPlan + '\n\n' + afterInsert.replace(/const MOCK_MEAL_PLAN = `[\s\S]*?`;?\s*/, '');
      }
    }
    
    fs.writeFileSync(appJsPath, appJsContent, 'utf8');
    console.log('[Gemini] Updated App.js with new meal plan');
    return true;
  } catch (e) {
    console.error('[Gemini] Failed to update App.js:', e);
    return false;
  }
}

async function generateWithGemini(goals, menu) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    // Get court data and format it
    const [, courtData] = pickFirstCourtWithItems(menu);
    const court_food_data = formatFoodDataForAI(courtData || {});

    // Extract user requirements
    const target_calories = Number(goals.calories ?? 2000) || 2000;
    const protein_percentage = Number(goals?.macros?.protein ?? 25) || 25;
    const carb_percentage = Number(goals?.macros?.carbs ?? 45) || 45;
    const fat_percentage = Number(goals?.macros?.fats ?? 30) || 30;
    const dietary_restrictions = Array.isArray(goals?.dietaryPrefs) ? goals.dietaryPrefs : [];

    const target_protein = Math.round((target_calories * protein_percentage / 100) / 4);
    const target_carbs = Math.round((target_calories * carb_percentage / 100) / 4);
    const target_fat = Math.round((target_calories * fat_percentage / 100) / 9);
    const restrictions_text = dietary_restrictions.length ? dietary_restrictions.join(', ') : 'None';
    const preferences_text = goals.preferences || 'None';

    const prompt = `You are a nutrition expert creating single-meal plans using dining hall food options.

USER REQUIREMENTS:
- Meal calorie target: ${target_calories}
- Protein target: ${target_protein}g (${protein_percentage}% of calories)
- Carb target: ${target_carbs}g (${carb_percentage}% of calories)
- Fat target: ${target_fat}g (${fat_percentage}% of calories)
- Dietary restrictions: ${restrictions_text}
- Other preferences: ${preferences_text}

AVAILABLE FOOD OPTIONS:
${court_food_data}

TASK: Create exactly 3 different meal plans. Each meal plan must:
1. Strictly meet the user's calorie and macro targets.
2. Only use foods from the provided list.
3. Strictly adhere to all dietary restrictions and preferences.
4. Provide variety across the 3 plans.
5. Show total calories and macros for each plan.

FORMAT your response as:

**MEAL PLAN 1**
* Food item 1 (quantity)
* Food item 2 (quantity)
Totals: [calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat

**MEAL PLAN 2**
* Food item 1 (quantity)
* Food item 2 (quantity)
Totals: [calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat

**MEAL PLAN 3**
* Food item 1 (quantity)
* Food item 2 (quantity)
Totals: [calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat

Do not include any conversational notes or disclaimers.`;

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const planText = String(text || '').trim();
    
    // Update App.js with the generated plan
    if (planText) {
      updateAppJsWithMealPlan(planText);
    }
    
    return planText;
  } catch (e) {
    // Fallback to manual template on any SDK error
    return null;
  }
}

function summarizeMenu(menu) {
  // Build a short summary of menu items to keep prompt size reasonable
  try {
    const lines = [];
    const courts = Object.keys(menu || {}).slice(0, 3);
    for (const court of courts) {
      const stations = menu[court]?.stations || {};
      const stationNames = Object.keys(stations).slice(0, 2);
      for (const st of stationNames) {
        const items = (stations[st] || []).slice(0, 3);
        for (const it of items) {
          const name = it?.name;
          const kcal = it?.total_calories;
          if (name) lines.push(`${court} • ${st} • ${name}${typeof kcal === 'number' ? ` (${kcal} kcal)` : ''}`);
        }
      }
    }
    return lines;
  } catch {
    return [];
  }
}

function formatMacros(macros = {}) {
  const parts = [];
  if (macros.protein != null) parts.push(`Protein: ${macros.protein}%`);
  if (macros.carbs != null) parts.push(`Carbs: ${macros.carbs}%`);
  if (macros.fats != null) parts.push(`Fats: ${macros.fats}%`);
  return parts.join(', ') || '(unspecified)';
}

function fallbackPlan(goals = {}, menu = {}) {
  const calories = goals.calories ?? 'unspecified';
  const dietary = Array.isArray(goals.dietaryPrefs) ? goals.dietaryPrefs : [];
  const meals = Array.isArray(goals.mealPrefs) ? goals.mealPrefs : [];
  const prompt = goals.aiPrompt || '';

  const suggestions = [];
  try {
    const courts = Object.keys(menu).slice(0, 2);
    for (const court of courts) {
      const stations = menu[court]?.stations || {};
      for (const st of Object.keys(stations).slice(0, 2)) {
        for (const it of stations[st].slice(0, 2)) {
          if (it?.name) suggestions.push(`- ${it.name} (${court} • ${st})`);
        }
      }
    }
  } catch {}

  const lines = [];
  lines.push('Your Personalized Meal Plan');
  lines.push('');
  lines.push(`Daily Calories Target: ${calories}`);
  lines.push(`Macro Targets: ${formatMacros(goals.macros)}`);
  lines.push(`Dietary Preferences: ${dietary.length ? dietary.join(', ') : 'None'}`);
  lines.push(`Meal Preferences: ${meals.length ? meals.join(', ') : 'None'}`);
  if (prompt) {
    lines.push('');
    lines.push('Notes:');
    lines.push(prompt);
  }
  lines.push('');
  lines.push('Menu-Based Suggestions:');
  if (suggestions.length) lines.push(...suggestions);
  else lines.push('- Suggestion A', '- Suggestion B', '- Suggestion C');
  return lines.join('\n') + '\n';
}

async function generatePlan({ goals, menu }) {
  const ai = await generateWithGemini(goals, menu);
  if (ai && ai.trim()) return ai.trim();
  return fallbackPlan(goals, menu);
}

module.exports = { generatePlan };
