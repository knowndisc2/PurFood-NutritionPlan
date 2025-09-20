from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime

def setup_driver():
    """Set up Chrome driver with proper options"""
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def scrape_nutrition_data(driver, nutrition_url):
    """Scrape nutrition information from individual food item page"""
    try:
        driver.get(nutrition_url)
        time.sleep(3)  # Wait for page to load
        
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
                
                # Extract numeric value (remove 'g', 'mg', etc.)
                try:
                    value = float(''.join(filter(str.isdigit, value_text.replace('.', 'X'))).replace('X', '.'))
                    
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
        
        # Get station info from upcoming meals section
        station_elem = soup.find('span', class_='appearances__appearance--station')
        if station_elem:
            nutrition_data['station'] = station_elem.get_text().strip()
        
        return nutrition_data
        
    except Exception as e:
        print(f"Error getting nutrition data: {e}")
        return {}

def scrape_all_dining_courts():
    """Main scraping function"""
    driver = setup_driver()
    
    dining_courts = ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor']
    today = "2025/9/20"  # You can make this dynamic
    
    all_menus = {}
    
    for court in dining_courts:
        try:
            url = f"https://dining.purdue.edu/menus/{court}/{today}/"
            print(f"\n=== Scraping {court} ===")
            
            driver.get(url)
            time.sleep(8)  # Wait for page to load
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # Find all food items
            food_items = []
            station_containers = soup.find_all('div', class_='station-item--container_plain')
            
            print(f"Found {len(station_containers)} food items")
            
            # Limit to first 5 items for testing (remove this limit later)
            for i, container in enumerate(station_containers[:5]):
                name_span = container.find('span', class_='station-item-text')
                if name_span:
                    food_name = name_span.get_text().strip()
                    print(f"  Processing: {food_name}")
                    
                    # Get nutrition link
                    link = container.find('a', class_='station-item')
                    if link and link.get('href'):
                        nutrition_url = "https://dining.purdue.edu" + link.get('href')
                        
                        # Get detailed nutrition data
                        nutrition_data = scrape_nutrition_data(driver, nutrition_url)
                        
                        food_item = {
                            'name': food_name,
                            'dining_court': court,
                            'nutrition_url': nutrition_url,
                            **nutrition_data  # Merge nutrition data
                        }
                        
                        food_items.append(food_item)
                        print(f"    ✓ Calories: {nutrition_data.get('calories', 'N/A')}, Protein: {nutrition_data.get('protein', 'N/A')}g")
                        
                        # Small delay between requests
                        time.sleep(2)
            
            all_menus[court] = food_items
            
        except Exception as e:
            print(f"Error scraping {court}: {e}")
            all_menus[court] = []
    
    driver.quit()
    return all_menus

def save_menu_data(menu_data, filename='purdue_menus.json'):
    """Save scraped data to JSON file"""
    with open(filename, 'w') as f:
        json.dump(menu_data, f, indent=2)
    print(f"\n✓ Data saved to {filename}")

def print_summary(menu_data):
    """Print a nice summary of scraped data"""
    print("\n" + "="*50)
    print("SCRAPING SUMMARY")
    print("="*50)
    
    for court, items in menu_data.items():
        print(f"\n{court}: {len(items)} items")
        for item in items[:3]:  # Show first 3 items
            calories = item.get('calories', 'N/A')
            protein = item.get('protein', 'N/A')
            station = item.get('station', 'Unknown station')
            print(f"  • {item['name']}")
            print(f"    {calories} cal, {protein}g protein, {station}")

if __name__ == "__main__":
    print("🍽️  Starting Purdue dining scraper...")
    
    # Scrape all data
    menus = scrape_all_dining_courts()
    
    # Save to file
    save_menu_data(menus)
    
    # Print summary
    print_summary(menus)
    
    print("\n🎉 Scraping complete! Your team can now use this data.")