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

module.exports = { scrapeMenu };
