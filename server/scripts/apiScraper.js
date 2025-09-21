const axios = require('axios');

const API_URL = 'https://api.hfs.purdue.edu/menus/v3/GraphQL';

const HEADERS = {
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Origin': 'https://dining.purdue.edu',
    'Referer': 'https://dining.purdue.edu/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'content-type': 'application/json',
    'Cookie': 'api_gac=390fa50b-675a-42c9-bbda-d5119e8fd886; CookieControl={"necessaryCookies":[],"optionalCookies":{"analytics":"accepted"},"statement":{},"consentDate":1725030992628,"consentExpiry":90,"interactedWith":true,"user":"60046416-305B-40C2-BA3D-B6AD57F74F6B"}',
};

const GET_MENU_QUERY = `query getLocationMenu($name: String!, $date: Date!) {
  diningCourtByName(name: $name) {
    dailyMenu(date: $date) {
      meals {
        name
        status
        stations {
          name
          items {
            item {
              itemId
              name
              isNutritionReady
            }
          }
        }
      }
    }
  }
}`;

async function getMenuData(court, date) {
    const json_data = {
        operationName: 'getLocationMenu',
        variables: {
            name: court,
            date: date, // YYYY-MM-DD
        },
        query: GET_MENU_QUERY,
    };

    try {
        const response = await axios.post(API_URL, json_data, { headers: HEADERS });
        return response.data;
    } catch (error) {
        console.error(`[API Scraper] Error fetching menu for ${court} on ${date}:`, error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
        return null;
    }
}

const GET_NUTRITION_QUERY = `query getItemNutrition($itemId: String!) {
  item(id: $itemId) {
    name
    nutrition {
      label
      value
      unit
    }
  }
}`;

async function getNutritionData(itemId) {
    const json_data = {
        operationName: 'getItemNutrition',
        variables: {
            itemId: itemId,
        },
        query: GET_NUTRITION_QUERY,
    };

    try {
        const response = await axios.post(API_URL, json_data, { headers: HEADERS });
        const nutritionInfo = {};
        const nutritionList = response.data?.data?.item?.nutrition || [];
        
        for (const fact of nutritionList) {
            switch (fact.label.toLowerCase()) {
                case 'calories':
                    nutritionInfo.total_calories = parseInt(fact.value, 10) || 0;
                    break;
                case 'protein':
                    nutritionInfo.protein_g = parseFloat(fact.value) || 0;
                    break;
                case 'total carbohydrate':
                case 'carbohydrate':
                    nutritionInfo.total_carbs_g = parseFloat(fact.value) || 0;
                    break;
                case 'total fat':
                case 'fat':
                    nutritionInfo.fat_g = parseFloat(fact.value) || 0;
                    break;
                 case 'dietary fiber':
                    nutritionInfo.dietary_fiber_g = parseInt(fact.value, 10) || 0;
                    break;
                case 'saturated fat':
                    nutritionInfo.saturated_fat_g = parseInt(fact.value, 10) || 0;
                    break;
                case 'cholesterol':
                    nutritionInfo.cholesterol_mg = parseInt(fact.value, 10) || 0;
                    break;
                case 'sodium':
                    nutritionInfo.sodium_mg = parseInt(fact.value, 10) || 0;
                    break;
            }
        }
        return nutritionInfo;
    } catch (error) {
        console.error(`[API Scraper] Error fetching nutrition for item ${itemId}:`, error.message);
        // Throw the error so the caller can handle it.
        throw error;
    }
}

async function scrapeCourt(court, date, mealTime) {
    console.log(`[API Scraper] Scraping ${court} for ${mealTime} on ${date}`);
    const menuResponse = await getMenuData(court, date);

    if (!menuResponse || !menuResponse.data?.diningCourtByName?.dailyMenu) {
        return {
            dining_court: court,
            meal_time: mealTime,
            date: date.replace(/-/g, '/'),
            stations: {},
            total_items: 0,
            error: 'Failed to fetch menu data from API.'
        };
    }

    const stations = {};
    const meals = menuResponse.data.diningCourtByName.dailyMenu.meals || [];
    const targetMeal = meals.find(m => m.name.toLowerCase() === mealTime.toLowerCase());

    if (targetMeal) {
        for (const station of targetMeal.stations) {
            const stationName = station.name;
            const items = [];
            for (const stationItem of station.items) {
                const item = stationItem.item;
                if (item && item.isNutritionReady) {
                    const baseItem = {
                        name: item.name,
                        station: stationName,
                        court: court,
                        meal_time: mealTime,
                        nutrition_url: `https://dining.purdue.edu/menus/item/${item.itemId}`,
                    };

                    try {
                        console.log(`[API Scraper] ...fetching nutrition (GraphQL) for ${item.name}`);
                        const nutritionData = await getNutritionData(item.itemId);
                        items.push({ ...baseItem, ...nutritionData, nutrition_source: 'v3_graphql' });
                    } catch (e1) {
                        console.warn(`[API Scraper] GraphQL nutrition failed: ${e1.message}. Trying v2 REST fallback...`);
                        try {
                            const nutritionDataV2 = await getNutritionDataV2(item.itemId);
                            if (Object.keys(nutritionDataV2).length > 0) {
                                items.push({ ...baseItem, ...nutritionDataV2, nutrition_source: 'v2_rest' });
                            } else {
                                items.push({ ...baseItem, nutrition_error: 'v2 returned empty' });
                            }
                        } catch (e2) {
                            items.push({ ...baseItem, nutrition_error: `v2 fallback failed: ${e2.message}` });
                        }
                    }
                    
                    // Small delay to be nice to the API
                    await new Promise(r => setTimeout(r, 50));
                }
            }
            stations[stationName] = items;
            console.log(`[API Scraper] ${court} • ${stationName}: ${items.length} items`);
        }
    }

    const total_items = Object.values(stations).reduce((acc, arr) => acc + arr.length, 0);
    return {
        dining_court: court,
        meal_time: mealTime,
        date: date.replace(/-/g, '/'),
        stations,
        total_items,
    };
}

async function getNutritionDataV2(itemId) {
    const url = `https://api.hfs.purdue.edu/menus/v2/items/${itemId}`;
    try {
        const resp = await axios.get(url, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
        const data = resp.data || {};
        const nutrition = Array.isArray(data.Nutrition) ? data.Nutrition : [];
        const map = {};
        for (const fact of nutrition) {
            const key = String(fact.Name || '').toLowerCase();
            map[key] = fact;
        }
        const pick = (k) => {
            const f = map[k];
            if (!f) return undefined;
            if (f.Value != null) return Number(f.Value);
            if (f.LabelValue) {
                const num = parseFloat(String(f.LabelValue).replace(/[^0-9.]/g, ''));
                return isNaN(num) ? undefined : num;
            }
            return undefined;
        };
        const out = {};
        const cal = pick('calories');
        if (cal != null) out.total_calories = Math.round(cal);
        const fat = pick('total fat');
        if (fat != null) out.total_fat_g = Number(fat);
        const sat = pick('saturated fat');
        if (sat != null) out.saturated_fat_g = Number(sat);
        const chol = pick('cholesterol');
        if (chol != null) out.cholesterol_mg = Math.round(chol);
        const sod = pick('sodium');
        if (sod != null) out.sodium_mg = Math.round(sod);
        const carbs = pick('total carbohydrate');
        if (carbs != null) out.total_carbs_g = Number(carbs);
        const fiber = pick('dietary fiber');
        if (fiber != null) out.dietary_fiber_g = Number(fiber);
        const protein = pick('protein');
        if (protein != null) out.protein_g = Number(protein);
        const serving = map['serving size']?.LabelValue;
        if (serving) out.serving_size = serving;
        return out;
    } catch (e) {
        throw e;
    }
}

module.exports = { scrapeCourt };
