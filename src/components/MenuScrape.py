from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup, SoupStrainer
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import os


def setup_headless_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--log-level=3")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    driver = webdriver.Chrome(options=chrome_options)
    return driver


def get_todays_date():
    return datetime.now().strftime("%Y/%m/%d")


def get_meal_time_url(meal_time):
    if meal_time == "late lunch":
        return "Late%20Lunch"
    else:
        return meal_time.capitalize()


label_map = {
    'total fat': 'total_fat_g',
    'saturated fat': 'saturated_fat_g',
    'trans fat': 'trans_fat_g',
    'cholesterol': 'cholesterol_mg',
    'sodium': 'sodium_mg',
    'total carbohydrate': 'total_carbs_g',
    'dietary fiber': 'dietary_fiber_g',
    'total sugar': 'total_sugar_g',
    'protein': 'protein_g',
    'vitamin d': 'vitamin_d_mcg',
    'calcium': 'calcium_mg',
    'iron': 'iron_mg',
    'potassium': 'potassium_mg',
    'vitamin a': 'vitamin_a_mcg',
    'vitamin c': 'vitamin_c_mg',
    'thiamin': 'thiamin_mg',
    'riboflavin': 'riboflavin_mg',
    'niacin': 'niacin_mg',
    'vitamin b6': 'vitamin_b6_mg',
    'folate': 'folate_mcg',
    'vitamin b12': 'vitamin_b12_mcg',
    'phosphorus': 'phosphorus_mg',
    'magnesium': 'magnesium_mg',
    'zinc': 'zinc_mg'
}


def scrape_nutrition_data(driver, nutrition_url):
    try:
        driver.get(nutrition_url)
        time.sleep(1.5)  # Reduced sleep to speed up
        strainer = SoupStrainer('div', class_='nutrition-table-row')
        soup = BeautifulSoup(driver.page_source, 'lxml', parse_only=strainer)
        nutrition_data = {}
        # Parse serving size and calories from full page once (outside strainer)
        full_soup = BeautifulSoup(driver.page_source, 'lxml')
        serving_size_elem = full_soup.find('span', class_='nutrition-feature-servingSize-quantity')
        if serving_size_elem:
            nutrition_data['serving_size'] = serving_size_elem.get_text().strip()
        calories_elem = full_soup.find('span', class_='nutrition-feature-calories-quantity')
        if calories_elem:
            try:
                nutrition_data['total_calories'] = int(calories_elem.get_text().strip())
            except ValueError:
                nutrition_data['total_calories'] = 0
        for row in soup:
            label_elem = row.find('span', class_='table-row-label')
            value_elem = row.find('span', class_='table-row-labelValue')
            if label_elem and value_elem:
                label = label_elem.get_text().strip().lower()
                value_text = value_elem.get_text().strip()
                try:
                    if '<' in value_text:
                        value = 0.5
                    elif '%' in value_text:
                        continue
                    else:
                        numeric_part = ''.join(filter(lambda x: x.isdigit() or x == '.', value_text.split()[0]))
                        if numeric_part:
                            value = float(numeric_part)
                        else:
                            continue
                    if 'added sugar' in label:
                        nutrition_data['added_sugar_g'] = value
                    else:
                        matched_key = next((label_map[k] for k in label_map if k in label), None)
                        if matched_key:
                            nutrition_data[matched_key] = value
                except Exception:
                    continue
        return nutrition_data
    except Exception:
        return {}


def scrape_single_court_meal_time(court_name="Earhart", meal_time="lunch", date=None):
    if date is None:
        date = get_todays_date()
    print(f"[{court_name} - {meal_time.capitalize()}] Starting scrape for {date}...")
    driver = setup_headless_driver()
    try:
        meal_time_url = get_meal_time_url(meal_time)
        url = f"https://dining.purdue.edu/menus/{court_name}/{date}/{meal_time_url}/"
        driver.get(url)
        time.sleep(4)  # Reduced wait time
        strainer = SoupStrainer('div', class_='station')
        soup = BeautifulSoup(driver.page_source, 'lxml', parse_only=strainer)
        stations = soup.find_all('div', class_='station')
        print(f"[{court_name} - {meal_time.capitalize()}] Found {len(stations)} stations")

        court_data = {
            'dining_court': court_name,
            'meal_time': meal_time,
            'date': date,
            'stations': {},
            'total_items': 0
        }

        # Parallelize nutrition scraping inside each station
        def fetch_item_nutrition(container, station_name):
            name_span = container.find('span', class_='station-item-text')
            if name_span:
                food_name = name_span.get_text().strip()
                link = container.find('a', class_='station-item')
                if link and link.get('href'):
                    nutrition_url = "https://dining.purdue.edu" + link.get('href')
                    nutrition_data = scrape_nutrition_data(driver, nutrition_url)
                    food_item = {
                        'name': food_name,
                        'station': station_name,
                        'court': court_name,
                        'meal_time': meal_time,
                        'nutrition_url': nutrition_url,
                        **nutrition_data
                    }
                    return food_item
            return None

        for station in stations:
            station_name_elem = station.find('div', class_='station-name')
            if not station_name_elem:
                continue
            station_name = station_name_elem.get_text().strip()
            food_containers = station.find_all('div', class_='station-item--container_plain')

            station_items = []
            with ThreadPoolExecutor(max_workers=5) as nutrition_executor:
                futures = [nutrition_executor.submit(fetch_item_nutrition, container, station_name) for container in food_containers]
                for future in as_completed(futures):
                    item = future.result()
                    if item:
                        station_items.append(item)

            court_data['stations'][station_name] = station_items
            court_data['total_items'] += len(station_items)
            print(f"[{court_name} - {meal_time.capitalize()}] {station_name}: {len(station_items)} items")

        print(f"[{court_name} - {meal_time.capitalize()}] Complete! {court_data['total_items']} items across {len(court_data['stations'])} stations")
        return court_name, court_data
    except Exception as e:
        print(f"[{court_name} - {meal_time.capitalize()}] Error: {e}")
        return court_name, {'dining_court': court_name, 'meal_time': meal_time, 'date': date, 'stations': {}, 'total_items': 0}
    finally:
        driver.quit()


def scrape_all_courts_meal_time(meal_time="lunch", date=None):
    if date is None:
        date = get_todays_date()
    if meal_time == "late lunch":
        dining_courts = ['Hillenbrand', 'Windsor']
    else:
        dining_courts = ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor']
    all_data = {}
    print(f"Starting concurrent scraping of all dining courts for {meal_time.capitalize()} on {date}...")
    with ThreadPoolExecutor(max_workers=len(dining_courts)) as executor:
        future_to_court = {
            executor.submit(scrape_single_court_meal_time, court, meal_time, date): court
            for court in dining_courts
        }
        for future in as_completed(future_to_court):
            court_name, court_data = future.result()
            all_data[court_name] = court_data
            completed = len(all_data)
            total = len(dining_courts)
            print(f"\n*** {court_name} {meal_time.capitalize()} FINISHED! ({completed}/{total} courts complete) ***")
            stations = court_data.get('stations', {})
            total_items = court_data.get('total_items', 0)
            print(f"    {len(stations)} stations, {total_items} total items")
    return all_data


def print_detailed_summary(all_data, meal_time):
    print("\n" + "="*80)
    print(f"COMPREHENSIVE NUTRITION DATA - {meal_time.capitalize()}")
    print("="*80)
    for court_name, court_data in all_data.items():
        stations = court_data.get('stations', {})
        total_items = court_data.get('total_items', 0)
        print(f"\n{court_name}: {len(stations)} stations, {total_items} items total")
        for station_name, items in stations.items():
            print(f"\n  📍 {station_name} ({len(items)} items):")
            for item in items:
                name = item['name']
                print(f"\n    • {name}")
                nutrition_fields = [
                    ('Total Calories', 'total_calories'),
                    ('Protein', 'protein_g', 'g'),
                    ('Total Carbs', 'total_carbs_g', 'g'),
                    ('Dietary Fiber', 'dietary_fiber_g', 'g'),
                    ('Cholesterol', 'cholesterol_mg', 'mg')
                ]
                serving = item.get('serving_size', 'N/A')
                print(f"      Serving Size: {serving}")
                for field_data in nutrition_fields:
                    if len(field_data) == 3:
                        field_name, field_key, unit = field_data
                    else:
                        field_name, field_key = field_data
                        unit = ''
                    value = item.get(field_key)
                    if value is not None:
                        print(f"      {field_name}: {value}{unit}")
    total_stations = sum(len(court_data.get('stations', {})) for court_data in all_data.values())
    total_items = sum(court_data.get('total_items', 0) for court_data in all_data.values())
    print(f"\n🎯 OVERALL STATS for {meal_time.capitalize()}:")
    print(f"   {len(all_data)} dining courts")
    print(f"   {total_stations} total stations")
    print(f"   {total_items} total food items")


if __name__ == "__main__":
    # Non-interactive mode via env vars
    env_meal_time = os.environ.get('SCRAPE_MEAL_TIME')
    env_date = os.environ.get('SCRAPE_DATE')  # YYYY/MM/DD or empty for today
    out_dir = os.environ.get('SCRAPE_OUTPUT_DIR')  # optional

    if env_meal_time:
        meal_time = env_meal_time.lower().strip()
        valid_meal_times = ['breakfast', 'lunch', 'dinner', 'brunch', 'late lunch']
        if meal_time not in valid_meal_times:
            meal_time = 'lunch'
        date = env_date if env_date else None
        data = scrape_all_courts_meal_time(meal_time, date)
        date_for_filename = (date if date else get_todays_date()).replace('/', '-')
        filename = f'purdue_{meal_time.replace(" ", "_")}_{date_for_filename}.json'
        if out_dir:
            try:
                os.makedirs(out_dir, exist_ok=True)
            except Exception:
                pass
            filepath = os.path.join(out_dir, filename)
        else:
            filepath = filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        # Print minimal notice to stdout so caller can pick up file path
        print(json.dumps({"ok": True, "file": filepath, "meal_time": meal_time}))
    else:
        # Interactive fallback
        print("🍽️ Purdue Dining Scraper with Meal Times")
        meal_time = input("Enter meal time (breakfast/lunch/dinner/brunch/late lunch): ").lower().strip()
        valid_meal_times = ['breakfast', 'lunch', 'dinner', 'brunch', 'late lunch']
        if meal_time not in valid_meal_times:
            print("Invalid meal time. Using 'lunch' as default.")
            meal_time = 'lunch'
        use_today = input("Use today's date? (y/n): ").lower().strip()
        if use_today == 'y' or use_today == '':
            date = None
            print(f"Using today's date: {get_todays_date()}")
        else:
            date = input("Enter date (YYYY/MM/DD): ").strip()
        print(f"Scraping {meal_time.capitalize()} menus...")
        data = scrape_all_courts_meal_time(meal_time, date)
        date_for_filename = date if date else get_todays_date().replace('/', '-')
        filename = f'purdue_{meal_time.replace(" ", "_")}_{date_for_filename}.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"\nData saved to {filename}")
        print_detailed_summary(data, meal_time)
        print(f"\n✅ Complete! Your team now has comprehensive {meal_time.capitalize()} dining data with full nutrition info.")
