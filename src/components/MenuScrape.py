from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

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

def scrape_nutrition_data(driver, nutrition_url):
    try:
        driver.get(nutrition_url)
        time.sleep(2)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        nutrition_data = {}
        serving_size_elem = soup.find('span', class_='nutrition-feature-servingSize-quantity')
        if serving_size_elem:
            nutrition_data['serving_size'] = serving_size_elem.get_text().strip()
        calories_elem = soup.find('span', class_='nutrition-feature-calories-quantity')
        if calories_elem:
            nutrition_data['total_calories'] = int(calories_elem.get_text().strip())
        nutrition_rows = soup.find_all('div', class_='nutrition-table-row')
        for row in nutrition_rows:
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
                    if 'total fat' in label:
                        nutrition_data['total_fat_g'] = value
                    elif 'saturated fat' in label:
                        nutrition_data['saturated_fat_g'] = value
                    elif 'trans fat' in label:
                        nutrition_data['trans_fat_g'] = value
                    elif 'cholesterol' in label:
                        nutrition_data['cholesterol_mg'] = value
                    elif 'sodium' in label:
                        nutrition_data['sodium_mg'] = value
                    elif 'total carbohydrate' in label:
                        nutrition_data['total_carbs_g'] = value
                    elif 'dietary fiber' in label:
                        nutrition_data['dietary_fiber_g'] = value
                    elif 'total sugar' in label or ('sugar' in label and 'added' not in label):
                        nutrition_data['total_sugar_g'] = value
                    elif 'added sugar' in label:
                        nutrition_data['added_sugar_g'] = value
                    elif 'protein' in label:
                        nutrition_data['protein_g'] = value
                    elif 'vitamin d' in label:
                        nutrition_data['vitamin_d_mcg'] = value
                    elif 'calcium' in label:
                        nutrition_data['calcium_mg'] = value
                    elif 'iron' in label:
                        nutrition_data['iron_mg'] = value
                    elif 'potassium' in label:
                        nutrition_data['potassium_mg'] = value
                    elif 'vitamin a' in label:
                        nutrition_data['vitamin_a_mcg'] = value
                    elif 'vitamin c' in label:
                        nutrition_data['vitamin_c_mg'] = value
                    elif 'thiamin' in label:
                        nutrition_data['thiamin_mg'] = value
                    elif 'riboflavin' in label:
                        nutrition_data['riboflavin_mg'] = value
                    elif 'niacin' in label:
                        nutrition_data['niacin_mg'] = value
                    elif 'vitamin b6' in label:
                        nutrition_data['vitamin_b6_mg'] = value
                    elif 'folate' in label:
                        nutrition_data['folate_mcg'] = value
                    elif 'vitamin b12' in label:
                        nutrition_data['vitamin_b12_mcg'] = value
                    elif 'phosphorus' in label:
                        nutrition_data['phosphorus_mg'] = value
                    elif 'magnesium' in label:
                        nutrition_data['magnesium_mg'] = value
                    elif 'zinc' in label:
                        nutrition_data['zinc_mg'] = value
                except:
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
        time.sleep(5)
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        stations = soup.find_all('div', class_='station')
        print(f"[{court_name} - {meal_time.capitalize()}] Found {len(stations)} stations")
        court_data = {
            'dining_court': court_name,
            'meal_time': meal_time,
            'date': date,
            'stations': {},
            'total_items': 0
        }
        for station in stations:
            station_name_elem = station.find('div', class_='station-name')
            if station_name_elem:
                station_name = station_name_elem.get_text().strip()
                print(f"[{court_name} - {meal_time.capitalize()}] Processing station: {station_name}")
                station_items = []
                food_containers = station.find_all('div', class_='station-item--container_plain')
                print(f"[{court_name} - {meal_time.capitalize()}] {station_name}: {len(food_containers)} items")
                for container in food_containers:
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
                            station_items.append(food_item)
                            calories = nutrition_data.get('total_calories', 'N/A')
                            protein = nutrition_data.get('protein_g', 'N/A')
                            sodium = nutrition_data.get('sodium_mg', 'N/A')
                            print(f"[{court_name} - {meal_time.capitalize()}]   {food_name}: {calories} cal, {protein}g protein, {sodium}mg sodium")
                            time.sleep(1)
                court_data['stations'][station_name] = station_items
                court_data['total_items'] += len(station_items)
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
    # Courts to scrape depend on meal time
    if meal_time == "late lunch":
        dining_courts = ['Hillenbrand', 'Windsor']
    else:
        dining_courts = ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor']
    all_data = {}
    print(f"Starting concurrent scraping of all dining courts for {meal_time.capitalize()} on {date}...")
    with ThreadPoolExecutor(max_workers=5) as executor:
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
            for station_name, items in stations.items():
                print(f"      • {station_name}: {len(items)} items")
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
