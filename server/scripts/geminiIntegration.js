// server/scripts/geminiIntegration.js
// Generates a plan text using Google Gemini (if GEMINI_API_KEY is set) or a fallback string.

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

function pickFirstCourtWithItems(menu = {}, goals = {}) {
  const aiPrompt = goals?.aiPrompt || goals?.preferences || '';
  const diningCourts = Object.keys(menu);
  let preferredCourt = null;

  console.log(`[Gemini Debug] Received aiPrompt: "${aiPrompt}"`);
  console.log(`[Gemini Debug] Available dining courts: ${diningCourts.join(', ')}`);

  if (aiPrompt) {
    const promptLower = aiPrompt.toLowerCase();
    const keywordCandidates = ['hall', 'court', 'dining', 'food', 'eat', 'meal', 'lunch', 'dinner', 'breakfast'];
    for (const court of diningCourts) {
      const courtNameLower = court.toLowerCase();
      // 1) Direct mention of the court name anywhere in the prompt
      if (promptLower.includes(courtNameLower)) {
        preferredCourt = court;
        break;
      }
      // 2) Fuzzy patterns like "Wiley dining hall" or "dining Wiley"
      if (keywordCandidates.some(keyword => promptLower.includes(`${keyword} ${courtNameLower}`) || promptLower.includes(`${courtNameLower} ${keyword}`))) {
        preferredCourt = court;
        break;
      }
    }
  }

  if (preferredCourt) {
    const courtData = menu[preferredCourt];
    if (courtData && (courtData.total_items || 0) > 0) {
      console.log(`[Gemini] Found and using preferred dining court: ${preferredCourt}`);
      return [preferredCourt, courtData];
    }
    console.log(`[Gemini] Preferred court "${preferredCourt}" was found, but has no items. No fallback.`);
    return [null, null]; // Return null if preferred court is empty
  }

  console.log('[Gemini] No preferred dining court specified.');
  return [null, null]; // No preference, so return null to signal using all courts
}

function validatePrimaryGoal(planText, { courtName, isSingleCourt, wantsDessert, enforceDessert, dessertKeywords }) {
  try {
    const planRegex = /\*\*MEAL PLAN (\d+)\*\*([\s\S]*?)(?=\*\*MEAL PLAN|$)/g;
    let match;
    let hasDessert = false;
    const lcDessertKeywords = (dessertKeywords || []).map(k => String(k).toLowerCase());

    while ((match = planRegex.exec(planText)) !== null) {
      const content = String(match[2] || '').trim();
      const lines = content.split('\n').filter(Boolean);
      const hallName = lines.length > 0 && !/^\s*\*/.test(lines[0]) ? lines[0].trim() : null;

      if (isSingleCourt && courtName) {
        const wanted = String(courtName).toLowerCase();
        if (!hallName || !hallName.toLowerCase().includes(wanted)) {
          return false;
        }
      }

      if (enforceDessert) {
        for (const ln of lines) {
          if (/^\s*\*/.test(ln)) {
            const lc = ln.toLowerCase();
            if (lcDessertKeywords.some(k => lc.includes(k))) {
              hasDessert = true;
              break;
            }
          }
        }
      }
    }

    if (enforceDessert && !hasDessert) return false;
    return true;
  } catch (e) {
    console.warn('[Gemini] validatePrimaryGoal failed:', e?.message || e);
    return false;
  }
}
// (Note) Removed stray duplicate block that caused syntax errors.

function formatFoodDataForAI(courtData = {}) {
  let formatted = `Dining Court: ${courtData?.dining_court || 'Unknown'}\n\n`;
  const stations = courtData?.stations || {};
  for (const [stationName, items] of Object.entries(stations)) {
    formatted += `Station: ${stationName}\n`;
    for (const item of items || []) {
      const name = item?.name ?? 'Unknown';
      const calories = typeof item?.total_calories === 'number' ? item.total_calories : null;
      const protein = typeof item?.protein_g === 'number' ? item.protein_g : null;
      const carbs = typeof item?.total_carbs_g === 'number' ? item.total_carbs_g : null;
      const fat = typeof item?.fat_g === 'number' ? item.fat_g : (typeof item?.total_fat_g === 'number' ? item.total_fat_g : null);
      const serving = item?.serving_size ?? 'N/A';

      // Only include items with complete numeric macros to avoid N/A propagation
      if (calories != null && protein != null && carbs != null && fat != null) {
        formatted += `  - ${name} (${serving}) Calories: ${calories} Protein: ${protein}g Carbs: ${carbs}g Fat: ${fat}g\n`;
      }
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

// Normalize and validate the AI output. This recomputes totals from per-item lines and
// replaces totals lines to avoid any 'N/A' macros. It also ensures calories are within range.
function parseAndNormalizePlan(planText, calorieLower, calorieUpper) {
  try {
    const planRegex = /\*\*MEAL PLAN (\d+)\*\*([\s\S]*?)(?=\*\*MEAL PLAN|$)/g;
    let match;
    const rebuilt = [];
    let globalOk = true;

    while ((match = planRegex.exec(planText)) !== null) {
      const number = match[1];
      const content = String(match[2] || '').trim();
      const lines = content.split('\n');
      let totalsIdx = -1;
      let sumCal = 0, sumProt = 0, sumCarb = 0, sumFat = 0;
      let anyItem = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*totals:/i.test(line)) totalsIdx = i;
        if (/^\s*\*/.test(line)) {
          const mCal = line.match(/Calories:\s*([\d,.]+)/i);
          const mProt = line.match(/Protein:\s*([\d,.]+)\s*g/i);
          const mCarb = line.match(/Carbs?:\s*([\d,.]+)\s*g/i);
          const mFat = line.match(/Fat:\s*([\d,.]+)\s*g/i);
          if (mCal && mProt && mCarb && mFat) {
            anyItem = true;
            sumCal += parseFloat(mCal[1].replace(/,/g, '')) || 0;
            sumProt += parseFloat(mProt[1].replace(/,/g, '')) || 0;
            sumCarb += parseFloat(mCarb[1].replace(/,/g, '')) || 0;
            sumFat += parseFloat(mFat[1].replace(/,/g, '')) || 0;
          } else if (/Fat:\s*N\/?A/i.test(line) || /Protein:\s*N\/?A/i.test(line) || /Carbs?:\s*N\/?A/i.test(line) || /Calories:\s*N\/?A/i.test(line)) {
            globalOk = false;
          }
        }
      }

      sumCal = Math.round(sumCal);
      sumProt = Math.round(sumProt);
      sumCarb = Math.round(sumCarb);
      sumFat = Math.round(sumFat);

      if (anyItem && typeof calorieLower === 'number' && typeof calorieUpper === 'number') {
        if (sumCal < calorieLower || sumCal > calorieUpper) globalOk = false;
      }

      const totalsLine = `Totals: ${sumCal} cal, ${sumProt}g protein, ${sumCarb}g carbs, ${sumFat}g fat`;
      const newLines = [...lines];
      if (totalsIdx >= 0) newLines[totalsIdx] = totalsLine;
      else newLines.push(totalsLine);

      rebuilt.push(`**MEAL PLAN ${number}**\n` + newLines.join('\n'));
    }

    return { text: rebuilt.join('\n\n'), allOk: globalOk };
  } catch (err) {
    console.warn('[Gemini] parseAndNormalizePlan failed:', err?.message || err);
    return { text: planText, allOk: false };
  }
}

async function generateWithGemini(goals, menu) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    // Get court data and format it
    const [courtName, courtData] = pickFirstCourtWithItems(menu, goals);
    let court_food_data = '';
    let isSingleCourt = false;

    if (courtName && courtData) {
      // A specific court was chosen, use only its data
      court_food_data = formatFoodDataForAI(courtData);
      isSingleCourt = true;
    } else {
      // No specific court, so combine all of them
      console.log('[Gemini] No preferred court. Combining all available menus for variety.');
      for (const key in menu) {
        if (menu[key] && (menu[key].total_items || 0) > 0) {
          court_food_data += formatFoodDataForAI(menu[key]) + '\n';
        }
      }
    }

    if (!court_food_data.trim()) {
      console.error('[Gemini] No food data available to generate a plan.');
      return null; // Can't generate a plan without food
    }

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
    const preferences_text = goals.aiPrompt || goals.preferences || 'None';

    const calorie_lower = Math.max(0, target_calories - 100);
    const calorie_upper = target_calories + 100;

    // Detect dessert preference and whether it's possible given available options
    const dessertKeywords = ['cookie','cookies','brownie','brownies','dessert','ice cream','cake','cupcake','pie','cheesecake','pudding'];
    const prefLower = String(preferences_text).toLowerCase();
    const wantsDessert = dessertKeywords.some(k => prefLower.includes(k));
    const availableHasDessert = dessertKeywords.some(k => String(court_food_data).toLowerCase().includes(k));

    // Build an explicit dessert examples list to guide the model when dessert is requested
    let dessertItems = [];
    try {
      const pushItem = (courtLabel, stationLabel, it) => {
        const name = (it?.name || '').trim();
        const lc = name.toLowerCase();
        const hasAll = typeof it?.total_calories === 'number' && typeof it?.protein_g === 'number' && typeof it?.total_carbs_g === 'number' && (typeof it?.fat_g === 'number' || typeof it?.total_fat_g === 'number');
        if (!hasAll) return;
        if (dessertKeywords.some(k => lc.includes(k))) {
          dessertItems.push(`${name}${courtLabel ? ` (${courtLabel}${stationLabel ? ` • ${stationLabel}` : ''})` : ''}`);
        }
      };
      if (isSingleCourt && courtData) {
        const stations = courtData?.stations || {};
        for (const [stName, items] of Object.entries(stations)) {
          for (const it of items || []) pushItem(courtName, stName, it);
        }
      } else {
        for (const [cName, cData] of Object.entries(menu || {})) {
          const stations = cData?.stations || {};
          for (const [stName, items] of Object.entries(stations)) {
            for (const it of items || []) pushItem(cName, stName, it);
          }
        }
      }
      // Deduplicate and cap list length
      dessertItems = Array.from(new Set(dessertItems)).slice(0, 8);
    } catch {}
    const dessertExamplesText = (wantsDessert && availableHasDessert && dessertItems.length)
      ? `\nDESSERT OPTIONS AVAILABLE:\n- ${dessertItems.join('\n- ')}\n`
      : '';

    const prompt = `You are a nutrition expert creating single-meal plans using dining hall food options.

USER REQUIREMENTS:
- Primary Goal: ${preferences_text}
- Meal calorie target: ${target_calories} (acceptable range: ${calorie_lower} to ${calorie_upper} calories)
- Protein target: ${target_protein}g (${protein_percentage}% of calories)
- Carb target: ${target_carbs}g (${carb_percentage}% of calories)
- Fat target: ${target_fat}g (${fat_percentage}% of calories)
- Dietary restrictions: ${restrictions_text}
${isSingleCourt ? `- IMPORTANT: The user has requested food from a specific dining hall. You MUST only use food from the dining hall listed under AVAILABLE FOOD OPTIONS.
- Additionally, for ALL THREE meal plans you MUST use ONLY the "${courtName}" dining hall and display the Dining Hall line exactly as "${courtName}".` : ''}
${(wantsDessert && availableHasDessert) ? '- Dessert requirement: include at least one dessert item (e.g., cookies, brownies, ice cream) chosen only from AVAILABLE FOOD OPTIONS. Do not fabricate items.' : ''}

AVAILABLE FOOD OPTIONS:
${court_food_data}
${dessertExamplesText}

TASK: Create exactly 3 different meal plans. Each meal plan must:
1. VERY strictly adhere to the user's PRIMARY GOAL, if one is provided. This is the most important rule.
2. Keep total calories WITHIN the acceptable range (±100 of the target). Do not go below ${calorie_lower} or above ${calorie_upper}.
3. Only use foods from the provided list.
4. Strictly adhere to all dietary restrictions and preferences.
5. Provide variety across the 3 plans.
6. Show total calories and macros for each plan.
7. Display the Dining Hall the food is from.
8. Strictly adhere to the calorie and macro values given for each food, especially for fat.
9. Never output 'N/A' for any macro. Use only numeric values as provided. If a food item does not list numeric fat/protein/carbs/calories, do not use it.

FORMAT your response as:

**MEAL PLAN 1**
<Dining Hall>
* Food item 1 (quantity) Calories: [Calories] Protein: [Protein]g Carbs: [Carbs]g Fat: [Fat]g
* Food item 2 (quantity) Calories: [Calories] Protein: [Protein]g Carbs: [Carbs]g Fat: [Fat]g
Totals: [calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat

**MEAL PLAN 2**
<Dining Hall>
* Food item 1 (quantity) Calories: [Calories] Protein: [Protein]g Carbs: [Carbs]g Fat: [Fat]g
* Food item 2 (quantity) Calories: [Calories] Protein: [Protein]g Carbs: [Carbs]g Fat: [Fat]g
Totals: [calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat

**MEAL PLAN 3**
<Dining Hall>
* Food item 1 (quantity) Calories: [Calories] Protein: [Protein]g Carbs: [Carbs]g Fat: [Fat]g
* Food item 2 (quantity) Calories: [Calories] Protein: [Protein]g Carbs: [Carbs]g Fat: [Fat]g
Totals: [calories] cal, [protein]g protein, [carbs]g carbs, [fat]g fat

Do not include any conversational notes or disclaimers.  Do not try to round up or down for any macronutrient values.`;

    let result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    let text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let planText = String(text || '').trim();

    // Normalize: recompute totals, replace any non-numeric macro totals, and validate calorie range
    const firstPass = parseAndNormalizePlan(planText, calorie_lower, calorie_upper);
    let normalizedPlan = firstPass.text;
    let allOk = firstPass.allOk;

    // Primary Goal adherence validation (court restriction and dessert inclusion if available)
    const primaryOkFirst = validatePrimaryGoal(normalizedPlan, {
      courtName,
      isSingleCourt,
      wantsDessert,
      enforceDessert: wantsDessert && availableHasDessert,
      dessertKeywords
    });
    allOk = allOk && primaryOkFirst;

    if (!allOk) {
      console.warn('[Gemini] Output failed validation (macros/calories/primary-goal). Retrying once...');
      let primaryFix = '';
      if (isSingleCourt && courtName) {
        primaryFix += `\n- All plans must use ONLY the "${courtName}" dining hall and display the Dining Hall line exactly as "${courtName}".`;
      }
      if (wantsDessert && availableHasDessert) {
        primaryFix += `\n- Include at least one item that matches any of: ${dessertKeywords.join(', ')} (choose only from AVAILABLE FOOD OPTIONS).`;
      }
      const retryPrompt = `${prompt}\n\nIMPORTANT: Your last output failed STRICT validation. Regenerate now strictly following ALL rules. Use ONLY numeric macros and keep totals within range.${primaryFix}`;
      const retryResult = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: retryPrompt }] }] });
      const retryText = retryResult?.response?.text?.() || retryResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      planText = String(retryText || '').trim();
      const secondPass = parseAndNormalizePlan(planText, calorie_lower, calorie_upper);
      normalizedPlan = secondPass.text;
      allOk = secondPass.allOk;
      const primaryOkSecond = validatePrimaryGoal(normalizedPlan, {
        courtName,
        isSingleCourt,
        wantsDessert,
        enforceDessert: wantsDessert && availableHasDessert,
        dessertKeywords
      });
      allOk = allOk && primaryOkSecond;
    }

    // Update App.js with the normalized plan
    if (normalizedPlan) {
      updateAppJsWithMealPlan(normalizedPlan);
    }

    return normalizedPlan;
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
  const prompt = goals.aiPrompt || goals.preferences || '';

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
