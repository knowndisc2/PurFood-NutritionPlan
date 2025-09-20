import json
import requests
from typing import Dict, List, Any

class PerplexityMealPlanner:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def load_dining_data(self, json_file_path: str) -> Dict:
        """Load the scraped dining data from JSON file"""
        with open(json_file_path, 'r') as f:
            return json.load(f)
    
    def format_food_data_for_ai(self, court_data: Dict) -> str:
        """Format food data into a readable string for AI"""
        formatted_text = f"Dining Court: {court_data.get('dining_court', 'Unknown')}\n\n"
        
        for station_name, items in court_data.get('stations', {}).items():
            formatted_text += f"Station: {station_name}\n"
            for item in items:
                name = item.get('name', 'Unknown')
                calories = item.get('total_calories', 'N/A')
                protein = item.get('protein_g', 'N/A')
                carbs = item.get('total_carbs_g', 'N/A')
                fiber = item.get('dietary_fiber_g', 'N/A')
                cholesterol = item.get('cholesterol_mg', 'N/A')
                serving = item.get('serving_size', 'N/A')
                
                formatted_text += f"  - {name} ({serving}): {calories} cal, {protein}g protein, {carbs}g carbs, {fiber}g fiber, {cholesterol}mg cholesterol\n"
            formatted_text += "\n"
        
        return formatted_text
    
    def create_meal_plan_prompt(self, user_preferences: Dict, court_food_data: str) -> str:
        """Create the prompt for Perplexity AI"""
        target_calories = user_preferences.get('target_calories', 2000)
        protein_percentage = user_preferences.get('protein_percentage', 25)  # % of total calories
        carb_percentage = user_preferences.get('carb_percentage', 45)
        fat_percentage = user_preferences.get('fat_percentage', 30)
        dietary_restrictions = user_preferences.get('dietary_restrictions', [])
        meal_count = user_preferences.get('meals_per_day', 3)
        
        # Calculate target macros
        target_protein = int((target_calories * protein_percentage / 100) / 4)  # 4 cal per g protein
        target_carbs = int((target_calories * carb_percentage / 100) / 4)       # 4 cal per g carbs
        target_fat = int((target_calories * fat_percentage / 100) / 9)          # 9 cal per g fat
        
        restrictions_text = ", ".join(dietary_restrictions) if dietary_restrictions else "None"
        
        prompt = f"""
        You are a nutrition expert creating meal plans from dining hall food options.
        
        USER REQUIREMENTS:
        - Daily calorie target: {target_calories}
        - Protein target: {target_protein}g ({protein_percentage}% of calories)
        - Carb target: {target_carbs}g ({carb_percentage}% of calories)
        - Fat target: {target_fat}g ({fat_percentage}% of calories)
        - Number of meals per day: {meal_count}
        - Dietary restrictions: {restrictions_text}
        
        AVAILABLE FOOD OPTIONS:
        {court_food_data}
        
        TASK: Create exactly 3 different meal plans for this dining court. Each meal plan should:
        1. Meet the daily calorie and macro targets as closely as possible
        2. Include {meal_count} meals (breakfast/lunch/dinner or adjust based on available food)
        3. Only use foods from the provided list above
        4. Respect dietary restrictions
        5. Provide variety across the 3 plans
        6. Show total daily calories and macros for each plan
        
        FORMAT your response as:
        
        **MEAL PLAN 1: [Creative Name]**
        Breakfast: [food items with quantities]
        Lunch: [food items with quantities] 
        Dinner: [food items with quantities]
        Daily Totals: [calories]cal, [protein]g protein, [carbs]g carbs, [fat]g fat
        
        **MEAL PLAN 2: [Creative Name]**
        [same format]
        
        **MEAL PLAN 3: [Creative Name]**
        [same format]
        
        Be specific about portions (e.g., "2 pancakes", "1 cup rice") and prioritize nutritional balance.
        """
        
        return prompt
    
    def get_meal_recommendations(self, user_preferences: Dict, court_data: Dict) -> str:
        """Get meal plan recommendations from Perplexity AI"""
        
        # Format the food data for AI
        food_data_text = self.format_food_data_for_ai(court_data)
        
        # Create the prompt
        prompt = self.create_meal_plan_prompt(user_preferences, food_data_text)
        
        # Prepare API request
        data = {
            "model": "llama-3.1-sonar-small-128k-online",  # or "llama-3.1-sonar-large-128k-online"
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 2000,
            "temperature": 0.7
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            return result['choices'][0]['message']['content']
            
        except requests.exceptions.RequestException as e:
            return f"Error calling Perplexity API: {e}"
        except KeyError as e:
            return f"Error parsing API response: {e}"
    
    def generate_all_court_recommendations(self, json_file_path: str, user_preferences: Dict) -> Dict[str, str]:
        """Generate meal plan recommendations for all dining courts"""
        
        # Load dining data
        dining_data = self.load_dining_data(json_file_path)
        
        recommendations = {}
        
        print("🤖 Generating AI meal plan recommendations for all courts...")
        
        for court_name, court_data in dining_data.items():
            if court_data.get('total_items', 0) > 0:  # Only process courts with food data
                print(f"   Generating plans for {court_name}...")
                
                recommendation = self.get_meal_recommendations(user_preferences, court_data)
                recommendations[court_name] = recommendation
                
                print(f"   ✅ {court_name} complete")
            else:
                print(f"   ⚠️ Skipping {court_name} (no food data)")
        
        return recommendations
    
    def save_recommendations(self, recommendations: Dict[str, str], output_file: str = "meal_recommendations.txt"):
        """Save recommendations to a file"""
        with open(output_file, 'w') as f:
            f.write("PURDUE DINING MEAL PLAN RECOMMENDATIONS\n")
            f.write("=" * 50 + "\n\n")
            
            for court_name, recommendation in recommendations.items():
                f.write(f"🏛️ {court_name.upper()} DINING COURT\n")
                f.write("-" * 40 + "\n")
                f.write(recommendation)
                f.write("\n\n" + "=" * 50 + "\n\n")
        
        print(f"📄 Recommendations saved to {output_file}")

def main():
    """Main function to run the meal planner"""
    
    # Get user inputs
    print("🍽️ AI-Powered Meal Plan Generator")
    print("=" * 40)
    
    # Get Perplexity API key
    api_key = input("Enter your Perplexity API key: ").strip()
    
    # Get JSON file path
    json_file = input("Enter path to your dining data JSON file: ").strip()
    if not json_file:
        json_file = "purdue_lunch_2025-09-20.json"  # default
    
    # Get user preferences
    print("\nEnter your dietary preferences:")
    
    try:
        target_calories = int(input("Daily calorie target (default 2000): ") or 2000)
        protein_percentage = int(input("Protein % of calories (default 25): ") or 25)
        carb_percentage = int(input("Carb % of calories (default 45): ") or 45)
        fat_percentage = int(input("Fat % of calories (default 30): ") or 30)
        
        # Validate percentages add up to 100
        if protein_percentage + carb_percentage + fat_percentage != 100:
            print("⚠️ Warning: Macro percentages don't add to 100%. Adjusting...")
            
        dietary_restrictions = input("Dietary restrictions (comma-separated, or press Enter): ").strip()
        restrictions_list = [r.strip() for r in dietary_restrictions.split(",") if r.strip()]
        
        user_preferences = {
            'target_calories': target_calories,
            'protein_percentage': protein_percentage,
            'carb_percentage': carb_percentage,
            'fat_percentage': fat_percentage,
            'dietary_restrictions': restrictions_list,
            'meals_per_day': 3
        }
        
        # Initialize meal planner
        planner = PerplexityMealPlanner(api_key)
        
        # Generate recommendations
        recommendations = planner.generate_all_court_recommendations(json_file, user_preferences)
        
        # Save results
        planner.save_recommendations(recommendations)
        
        # Display summary
        print(f"\n✅ Generated meal plans for {len(recommendations)} dining courts!")
        print("Check 'meal_recommendations.txt' for detailed plans.")
        
        # Show a preview of one court
        if recommendations:
            first_court = list(recommendations.keys())[0]
            print(f"\n📋 PREVIEW - {first_court}:")
            print("-" * 30)
            print(recommendations[first_court][:500] + "..." if len(recommendations[first_court]) > 500 else recommendations[first_court])
        
    except ValueError:
        print("❌ Invalid input. Please enter numbers for calorie and percentage values.")
    except FileNotFoundError:
        print(f"❌ Could not find file: {json_file}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()