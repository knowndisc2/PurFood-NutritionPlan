// server/scripts/menuScrape.js
// This file now acts as a wrapper around the new GraphQL API scraper.
const fs = require('fs');
const path = require('path');
const { scrapeCourt } = require('./apiScraper');
const { generatePlan } = require('./geminiIntegration');

const COURTS_DEFAULT = ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor'];

function getTodaysDate() {
  const d = new Date();
  // Format as YYYY-MM-DD for the API
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function scrapeMenu({ mealTime = 'lunch', date } = {}) {
  // The API uses YYYY-MM-DD format. The old scraper used YYYY/MM/DD. We'll standardize on YYYY-MM-DD.
  const useDate = date ? date.replaceAll('/', '-') : getTodaysDate();
  const courts = mealTime.toLowerCase() === 'late lunch' ? ['Hillenbrand', 'Windsor'] : COURTS_DEFAULT;
  
  const result = {};
  for (const court of courts) {
    try {
      // The new scrapeCourt function takes (court, date, mealTime)
      const data = await scrapeCourt(court, useDate, mealTime);
      result[court] = data;
    } catch (e) {
      console.error(`[Scrape Wrapper] Failed to scrape ${court}:`, e.message);
      result[court] = {
        dining_court: court,
        meal_time: mealTime,
        date: useDate.replace(/-/g, '/'), // Keep old date format for compatibility if needed
        stations: {},
        total_items: 0,
        error: e.message,
      };
    }
  }
  return result;
}

// This function remains to orchestrate scraping and AI plan generation.
async function scrapeAndGeneratePlans({ mealTime = 'lunch', date, goals } = {}) {
  const useDate = date ? date.replaceAll('/', '-') : getTodaysDate();
  const outDir = path.join(process.cwd(), 'src', 'components', 'tmp');
  const dateForFilename = useDate.replaceAll('/', '-');
  const filename = `purdue_${mealTime.replace(' ', '_')}_${dateForFilename}.json`;
  const filePath = path.join(outDir, filename);

  let menuData;

  if (fs.existsSync(filePath)) {
    console.log(`[Scrape] Cache hit for ${filename}. Using cached menu.`);
    const cachedData = fs.readFileSync(filePath, 'utf8');
    menuData = JSON.parse(cachedData);
  } else {
    console.log(`[Scrape] Cache miss for ${filename}. Performing live API scrape.`);
    menuData = await scrapeMenu({ mealTime, date: useDate });

    try {
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(menuData, null, 2), 'utf8');
      console.log(`[Scrape] Live API scrape successful. Saved to cache: ${filename}`);
    } catch (e) {
      console.error(`[Scrape] Failed to write cache file: ${e.message}`);
    }
  }

  const planText = await generatePlan({ goals, menu: menuData });

  return {
    menuData,
    planText,
    mealTime,
    date: useDate
  };
}

// We no longer need the old HTTP/Puppeteer scrapers, but we'll export an empty
// function for scrapeNutritionPageHttp for now to avoid breaking the debug endpoint import.
async function scrapeNutritionPageHttp(url) {
  console.warn('scrapeNutritionPageHttp is deprecated and should not be used.');
  return {};
}

module.exports = { scrapeMenu, scrapeAndGeneratePlans, scrapeNutritionPageHttp };
