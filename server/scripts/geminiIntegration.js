// server/scripts/geminiIntegration.js
// Generates a plan text using Google Gemini (if GEMINI_API_KEY is set) or a fallback string.

const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateWithGemini(goals, menu) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const system = `You are a nutrition assistant. Create a concise daily plan using the user's goals and the provided dining menu options. Return a readable plain text plan with bullet points for breakfast, lunch, dinner, and snacks. Include estimated calories if available. Avoid markdown code fences.`;

    const prompt = {
      system,
      goals,
      menuPreview: summarizeMenu(menu),
    };

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }] });
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return String(text || '').trim();
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
