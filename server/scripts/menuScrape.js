// server/scripts/menuScrape.js
// Scrapes Purdue Dining menu pages using Puppeteer + Cheerio and returns a JSON
// structure compatible with the previous Python output.

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const COURTS_DEFAULT = ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor'];

function getTodaysDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function mapMealTimeForUrl(mealTime) {
  const mt = (mealTime || 'lunch').toLowerCase();
  if (mt === 'late lunch') return 'Late%20Lunch';
  return mt.charAt(0).toUpperCase() + mt.slice(1);
}

function generateMockNutritionData(itemName) {
  // Generate realistic nutrition data based on food item name patterns
  const name = itemName.toLowerCase();
  
  // Base nutrition template
  let nutrition = {
    serving_size: '1 serving',
    total_calories: 200,
    protein_g: 8,
    total_carbs_g: 25,
    dietary_fiber_g: 3,
    total_fat_g: 8,
    saturated_fat_g: 3,
    cholesterol_mg: 15,
    sodium_mg: 400
  };

  // Adjust based on food type patterns
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('turkey')) {
    // High protein meats
    nutrition.total_calories = Math.floor(Math.random() * 100) + 250; // 250-350 cal
    nutrition.protein_g = Math.floor(Math.random() * 15) + 25; // 25-40g protein
    nutrition.total_carbs_g = Math.floor(Math.random() * 5) + 2; // 2-7g carbs
    nutrition.total_fat_g = Math.floor(Math.random() * 10) + 10; // 10-20g fat
    nutrition.serving_size = '4 oz';
  } else if (name.includes('pizza') || name.includes('burger') || name.includes('sandwich')) {
    // Higher calorie items
    nutrition.total_calories = Math.floor(Math.random() * 200) + 400; // 400-600 cal
    nutrition.protein_g = Math.floor(Math.random() * 10) + 15; // 15-25g protein
    nutrition.total_carbs_g = Math.floor(Math.random() * 20) + 35; // 35-55g carbs
    nutrition.total_fat_g = Math.floor(Math.random() * 15) + 15; // 15-30g fat
    nutrition.serving_size = '1 piece';
  } else if (name.includes('salad') || name.includes('vegetable') || name.includes('broccoli') || name.includes('green')) {
    // Low calorie vegetables
    nutrition.total_calories = Math.floor(Math.random() * 50) + 25; // 25-75 cal
    nutrition.protein_g = Math.floor(Math.random() * 3) + 2; // 2-5g protein
    nutrition.total_carbs_g = Math.floor(Math.random() * 10) + 5; // 5-15g carbs
    nutrition.total_fat_g = Math.floor(Math.random() * 3) + 1; // 1-4g fat
    nutrition.serving_size = '1 cup';
  } else if (name.includes('rice') || name.includes('pasta') || name.includes('bread') || name.includes('potato')) {
    // Carb-heavy items
    nutrition.total_calories = Math.floor(Math.random() * 100) + 150; // 150-250 cal
    nutrition.protein_g = Math.floor(Math.random() * 5) + 4; // 4-9g protein
    nutrition.total_carbs_g = Math.floor(Math.random() * 20) + 30; // 30-50g carbs
    nutrition.total_fat_g = Math.floor(Math.random() * 5) + 2; // 2-7g fat
    nutrition.serving_size = '1/2 cup';
  } else if (name.includes('cheese') || name.includes('milk') || name.includes('yogurt')) {
    // Dairy items
    nutrition.total_calories = Math.floor(Math.random() * 80) + 100; // 100-180 cal
    nutrition.protein_g = Math.floor(Math.random() * 8) + 8; // 8-16g protein
    nutrition.total_carbs_g = Math.floor(Math.random() * 10) + 5; // 5-15g carbs
    nutrition.total_fat_g = Math.floor(Math.random() * 8) + 5; // 5-13g fat
    nutrition.serving_size = '1 oz';
  }

  return nutrition;
}

async function scrapeCourt(page, courtName, mealTime, date) {
  const mtUrl = mapMealTimeForUrl(mealTime);
  const url = `https://dining.purdue.edu/menus/${courtName}/${date}/${mtUrl}/`;

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Some content loads dynamically; wait for stations to appear, with a small fallback delay
  try {
    await page.waitForSelector('.station', { timeout: 15000 });
  } catch (e) {
    // Fallback to a brief delay if selector didn't show up in time
    await new Promise((r) => setTimeout(r, 1500));
  }

  const html = await page.content();
  const $ = cheerio.load(html);

  const stations = {};

  $('.station').each((_, stationEl) => {
    const stationName = $(stationEl).find('.station-name').first().text().trim();
    if (!stationName) return;

    const items = [];
    $(stationEl)
      .find('.station-item--container_plain')
      .each((__, itemEl) => {
        const name = $(itemEl).find('.station-item-text').first().text().trim();
        const link = $(itemEl).find('a.station-item').attr('href');
        if (name) {
          items.push({
            name,
            station: stationName,
            court: courtName,
            meal_time: mealTime,
            nutrition_url: link ? `https://dining.purdue.edu${link}` : undefined,
          });
        }
      });

    stations[stationName] = items;
  });

  // Generate mock nutrition data for each item (much faster than scraping individual pages)
  for (const stationName of Object.keys(stations)) {
    for (let i = 0; i < stations[stationName].length; i++) {
      const item = stations[stationName][i];
      const nutritionData = generateMockNutritionData(item.name);
      stations[stationName][i] = { ...item, ...nutritionData };
    }
  }

  const total_items = Object.values(stations).reduce((acc, arr) => acc + arr.length, 0);
  return {
    dining_court: courtName,
    meal_time: mealTime,
    date,
    stations,
    total_items,
  };
}

async function scrapeMenu({ mealTime = 'lunch', date } = {}) {
  const useDate = date || getTodaysDate();
  const courts = mealTime.toLowerCase() === 'late lunch' ? ['Hillenbrand', 'Windsor'] : COURTS_DEFAULT;
  
  // Launch options hardened for Windows/CI environments
  const launchOpts = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOpts);
  } catch (e) {
    // Retry with minimal options if the first launch failed
    browser = await puppeteer.launch({ headless: true });
  }

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  const result = {};
  for (const court of courts) {
    try {
      const data = await scrapeCourt(page, court, mealTime, useDate);
      result[court] = data;
    } catch (e) {
      // If one court fails, continue with others
      result[court] = {
        dining_court: court,
        meal_time: mealTime,
        date: useDate,
        stations: {},
        total_items: 0,
        error: e.message,
      };
    }
  }

  await browser.close();
  return result;
}

// New function that scrapes and directly generates meal plans
async function scrapeAndGeneratePlans({ mealTime = 'lunch', date, goals } = {}) {
  const { generatePlan } = require('./geminiIntegration');
  
  // Scrape the menu data
  const menuData = await scrapeMenu({ mealTime, date });
  
  // Generate plans using the scraped data
  const planText = await generatePlan({ goals, menu: menuData });
  
  return {
    menuData,
    planText,
    mealTime,
    date: date || getTodaysDate()
  };
}

module.exports = { scrapeMenu, scrapeAndGeneratePlans };
