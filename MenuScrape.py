from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

def setup_headless_driver():
    """Set up headless Chrome driver"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--log-level=3")  # Suppress warnings
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def scrape_nutrition_data(driver, nutrition_url):
    """Scrape nutrition information from individual food item page"""
    try:
        driver.get(nutrition_url)
        time.sleep(2)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        nutrition_data = {}
        
        # Get serving size
        serving_size_elem = soup.find('span', class_='nutrition-feature-servingSize-quantity')
        if serving_size_elem:
            nutrition_data['serving_size'] = serving_size_elem.get_text().strip()
        
        # Get calories
        calories_elem = soup.find('span', class_='nutrition-feature-calories-quantity')
        if calories_elem:
            nutrition_data['calories'] = int(calories_elem.get_text().strip())
        
        # Get macros from nutrition table
        nutrition_rows = soup.find_all('div', class_='nutrition-table-row')
        
        for row in nutrition_rows:
            label_elem = row.find('span', class_='table-row-label')
            value_elem = row.find('span', class_='table-row-labelValue')
            
            if label_elem and value_elem:
                label = label_elem.get_text().strip().lower()
                value_text = value_elem.get_text().strip()
                
                # Extract numeric value (handle < 1g cases)
                try:
                    if '<' in value_text:
                        value = 0.5  # Treat "< 1g" as 0.5g
                    else:
                        value = float(''.join(filter(lambda x: x.isdigit() or x == '.', value_text)))
                    
                    if 'total fat' in label:
                        nutrition_data['fat'] = value
                    elif 'protein' in label:
                        nutrition_data['protein'] = value
                    elif 'total carbohydrate' in label:
                        nutrition_data['carbs'] = value
                    elif 'sugar' in label and 'added' not in label:
                        nutrition_data['sugar'] = value
                    elif 'sodium' in label:
                        nutrition_data['sodium'] = value
                    elif 'dietary fiber' in label:
                        nutrition_data['fiber'] = value
                except:
                    continue
        
        return nutrition_data
        
    except Exception as e:
        return {}

def scrape_single_court_all_stations(court_name="Earhart", today="2025/9/20"):
    """Scrape one dining court and organize by stations"""
    print(f"[{court_name}] Starting scrape...")
    
    driver = setup_headless_driver()
    
    try:
        # Try the main page for this court and today
        url = f"https://dining.purdue.edu/menus/{court_name}/{today}/"
        driver.get(url)
        time.sleep(5)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find all stations
        stations = soup.find_all('div', class_='station')
        print(f"[{court_name}] Found {len(stations)} stations")
        
        court_data = {
            'dining_court': court_name,
            'stations': {},
            'total_items': 0
        }
        
        for station in stations:
            # Get station name
            station_name_elem = station.find('div', class_='station-name')
            if station_name_elem:
                station_name = station_name_elem.get_text().strip()
                print(f"[{court_name}] Processing station: {station_name}")
                
                # Find all food items in this station
                station_items = []
                food_containers = station.find_all('div', class_='station-item--container_plain')
                
                print(f"[{court_name}] {station_name}: {len(food_containers)} items")
                
                # Process items (limit to first 3 per station for speed)
                for i, container in enumerate(food_containers[:3]):
                    name_span = container.find('span', class_='station-item-text')
                    if name_span:
                        food_name = name_span.get_text().strip()
                        
                        # Get nutrition link
                        link = container.find('a', class_='station-item')
                        if link and link.get('href'):
                            nutrition_url = "https://dining.purdue.edu" + link.get('href')
                            
                            # Get detailed nutrition data
                            nutrition_data = scrape_nutrition_data(driver, nutrition_url)
                            
                            food_item = {
                                'name': food_name,
                                'station': station_name,
                                'nutrition_url': nutrition_url,
                                **nutrition_data
                            }
                            
                            station_items.append(food_item)
                            
                            # Show progress
                            calories = nutrition_data.get('calories', 'N/A')
                            protein = nutrition_data.get('protein', 'N/A')
                            print(f"[{court_name}]   {food_name}: {calories} cal, {protein}g protein")
                            
                            time.sleep(1)  # Be respectful to server
                
                court_data['stations'][station_name] = station_items
                court_data['total_items'] += len(station_items)
        
        print(f"[{court_name}] Complete! {court_data['total_items']} items across {len(court_data['stations'])} stations")
        return court_name, court_data
        
    except Exception as e:
        print(f"[{court_name}] Error: {e}")
        return court_name, {'dining_court': court_name, 'stations': {}, 'total_items': 0}
    
    finally:
        driver.quit()

def scrape_all_courts_concurrent():
    """Scrape all dining courts concurrently, organized by stations"""
    dining_courts = ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor']
    all_data = {}
    
    print("Starting concurrent scraping of all dining courts...")
    print("Each court will show all stations with food items organized by station")
    
    # Use ThreadPoolExecutor for concurrent scraping
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Submit all tasks
        future_to_court = {
            executor.submit(scrape_single_court_all_stations, court): court 
            for court in dining_courts
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_court):
            court_name, court_data = future.result()
            all_data[court_name] = court_data
            
            # Print completion status
            completed = len(all_data)
            total = len(dining_courts)
            print(f"\n*** {court_name} FINISHED! ({completed}/{total} courts complete) ***")
            
            # Show station summary
            stations = court_data.get('stations', {})
            total_items = court_data.get('total_items', 0)
            print(f"    {len(stations)} stations, {total_items} total items")
            for station_name, items in stations.items():
                print(f"      • {station_name}: {len(items)} items")
    
    return all_data

def print_detailed_summary(all_data):
    """Print a comprehensive summary organized by station"""
    print("\n" + "="*70)
    print("FINAL STATION-ORGANIZED SUMMARY")
    print("="*70)
    
    for court_name, court_data in all_data.items():
        stations = court_data.get('stations', {})
        total_items = court_data.get('total_items', 0)
        
        print(f"\n{court_name}: {len(stations)} stations, {total_items} items total")
        
        for station_name, items in stations.items():
            print(f"\n  📍 {station_name} ({len(items)} items):")
            
            # Show high-protein items first
            protein_items = sorted(items, key=lambda x: x.get('protein', 0), reverse=True)
            
            for item in protein_items:
                name = item['name']
                calories = item.get('calories', 'N/A')
                protein = item.get('protein', 'N/A')
                serving = item.get('serving_size', 'N/A')
                
                print(f"    • {name}")
                print(f"      {calories} cal, {protein}g protein ({serving})")
    
    # Overall stats
    total_stations = sum(len(court_data.get('stations', {})) for court_data in all_data.values())
    total_items = sum(court_data.get('total_items', 0) for court_data in all_data.values())
    
    print(f"\n🎯 OVERALL STATS:")
    print(f"   {len(all_data)} dining courts")
    print(f"   {total_stations} total stations")
    print(f"   {total_items} total food items")
    print(f"\nData is now organized by: Court → Station → Food Items")
    print("Perfect for your recommendation engine!")

if __name__ == "__main__":
    print("🍽️ Station-organized Purdue dining scraper")
    print("This will scrape all dining courts and organize food by station")
    
    # Scrape all data concurrently
    data = scrape_all_courts_concurrent()
    
    # Save to file
    with open('purdue_menus_by_station.json', 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nData saved to purdue_menus_by_station.json")
    
    # Print detailed summary
    print_detailed_summary(data)
    
    print("\n✅ Complete! Your team now has comprehensive dining data organized by station.")