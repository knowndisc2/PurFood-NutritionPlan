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

async function scrapeNutritionData(page, nutritionUrl) {
  try {
    await page.goto(nutritionUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));

    const html = await page.content();
    const $ = cheerio.load(html);
    
    const nutritionData = {};
    
    // Parse serving size and calories
    const servingSizeElem = $('.nutrition-feature-servingSize-quantity').first();
    if (servingSizeElem.length) {
      nutritionData.serving_size = servingSizeElem.text().trim();
    }
    
    const caloriesElem = $('.nutrition-feature-calories-quantity').first();
    if (caloriesElem.length) {
      try {
        nutritionData.total_calories = parseInt(caloriesElem.text().trim()) || 0;
      } catch {
        nutritionData.total_calories = 0;
      }
    }

    // Parse nutrition table rows
    $('.nutrition-table-row').each((_, row) => {
      const labelElem = $(row).find('.table-row-label').first();
      const valueElem = $(row).find('.table-row-labelValue').first();
      
      if (labelElem.length && valueElem.length) {
        const label = labelElem.text().trim().toLowerCase();
        const valueText = valueElem.text().trim();
        
        try {
          let value = 0;
          if (valueText.includes('<')) {
            value = 0.5;
          } else if (valueText.includes('%')) {
            return; // Skip percentage values
          } else {
            const numericPart = valueText.split(/\s+/)[0].replace(/[^\d.]/g, '');
            if (numericPart) {
              value = parseFloat(numericPart) || 0;
            }
          }

          // Map labels to standardized keys
          if (label.includes('total fat')) nutritionData.total_fat_g = value;
          else if (label.includes('saturated fat')) nutritionData.saturated_fat_g = value;
          else if (label.includes('trans fat')) nutritionData.trans_fat_g = value;
          else if (label.includes('cholesterol')) nutritionData.cholesterol_mg = value;
          else if (label.includes('sodium')) nutritionData.sodium_mg = value;
          else if (label.includes('total carbohydrate')) nutritionData.total_carbs_g = value;
          else if (label.includes('dietary fiber')) nutritionData.dietary_fiber_g = value;
          else if (label.includes('total sugar')) nutritionData.total_sugar_g = value;
          else if (label.includes('added sugar')) nutritionData.added_sugar_g = value;
          else if (label.includes('protein')) nutritionData.protein_g = value;
          else if (label.includes('vitamin d')) nutritionData.vitamin_d_mcg = value;
          else if (label.includes('calcium')) nutritionData.calcium_mg = value;
          else if (label.includes('iron')) nutritionData.iron_mg = value;
          else if (label.includes('potassium')) nutritionData.potassium_mg = value;
        } catch (e) {
          // Skip problematic entries
        }
      }
    });

    return nutritionData;
  } catch (e) {
    return {};
  }
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

  // Now scrape nutrition data for each item
  for (const stationName of Object.keys(stations)) {
    for (let i = 0; i < stations[stationName].length; i++) {
      const item = stations[stationName][i];
      if (item.nutrition_url) {
        const nutritionData = await scrapeNutritionData(page, item.nutrition_url);
        stations[stationName][i] = { ...item, ...nutritionData };
      }
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
