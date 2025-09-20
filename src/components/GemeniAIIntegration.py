import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
from typing import Dict, List, Any

class GeminiMealPlanner:
    def __init__(self):
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("❌ Error: Please set GEMINI_API_KEY in .env file")
            exit()
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def load_dining_data(self, json_file_path: str) -> Dict:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def format_food_data_for_ai(self, court_data: Dict) -> str:
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
                formatted_text += (
                    f"  - {name} ({serving}): {calories} cal, {protein}g protein, "
                    f"{carbs}g carbs, {fiber}g fiber, {cholesterol}mg cholesterol\n"
                )
            formatted_text += "\n"
        return formatted_text

    def create_meal_plan_prompt(self, user_preferences: Dict, court_food_data: str) -> str:
        target_calories = user_preferences.get('target_calories', 2000)
        protein_percentage = user_preferences.get('protein_percentage', 25)
        carb_percentage = user_preferences.get('carb_percentage', 45)
        fat_percentage = user_preferences.get('fat_percentage', 30)
        dietary_restrictions = user_preferences.get('dietary_restrictions', [])
        
        target_protein = int((target_calories * protein_percentage / 100) / 4)
        target_carbs = int((target_calories * carb_percentage / 100) / 4)
        target_fat = int((target_calories * fat_percentage / 100) / 9)
        restrictions_text = ", ".join(dietary_restrictions) if dietary_restrictions else "None"

        prompt = f"""
        You are a nutrition expert creating single-meal plans using dining hall food options.

        USER REQUIREMENTS:
        - Meal calorie target: {target_calories}
        - Protein target: {target_protein}g ({protein_percentage}% of calories)
        - Carb target: {target_carbs}g ({carb_percentage}% of calories)
        - Fat target: {target_fat}g ({fat_percentage}% of calories)
        - Dietary restrictions: {restrictions_text}

        AVAILABLE FOOD OPTIONS:
        {court_food_data}

        TASK: Create exactly 3 different meal plans for this dining court. Each meal plan should:
        1. Meet the calorie and macro targets as closely as possible
        2. Only use foods from the provided list above
        3. Respect dietary restrictions
        4. Provide variety across the 3 plans
        5. Show total calories and macros for each plan

        FORMAT your response as:

        **MEAL PLAN 1: [Creative Name]**
        Food items with quantities (e.g., "2 pancakes, 1 cup rice")
        Totals: [calories]cal, [protein]g protein, [carbs]g carbs, [fat]g fat

        **MEAL PLAN 2: [Creative Name]**
        Food items with quantities
        Totals: [calories]cal, [protein]g protein, [carbs]g carbs, [fat]g fat

        **MEAL PLAN 3: [Creative Name]**
        Food items with quantities
        Totals: [calories]cal, [protein]g protein, [carbs]g carbs, [fat]g fat

        Be specific about portions and prioritize nutritional balance.
        """
        return prompt

    def get_meal_recommendations(self, user_preferences: Dict, court_data: Dict) -> str:
        food_data_text = self.format_food_data_for_ai(court_data)
        prompt = self.create_meal_plan_prompt(user_preferences, food_data_text)
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error calling Gemini API: {e}"

    def generate_all_court_recommendations(self, json_file_path: str, user_preferences: Dict, output_file: str) -> None:
        dining_data = self.load_dining_data(json_file_path)

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("PURDUE DINING MEAL PLAN RECOMMENDATIONS\n")
            f.write("=" * 50 + "\n\n")

            print("🤖 Generating AI meal plan recommendations for all courts...")

            for court_name, court_data in dining_data.items():
                if court_data.get('total_items', 0) > 0:
                    print(f"   Generating plans for {court_name}...")

                    recommendation = self.get_meal_recommendations(user_preferences, court_data)

                    f.write(f"🏛️ {court_name.upper()} DINING COURT\n")
                    f.write("-" * 40 + "\n")
                    f.write(recommendation)
                    f.write("\n\n" + "=" * 50 + "\n\n")

                    print(f"   ✅ {court_name} complete")
                else:
                    print(f"   ⚠️ Skipping {court_name} (no food data)")

def main():
    print("🍽️ AI-Powered Meal Plan Generator (Gemini)")
    print("=" * 40)
    json_file = input("Enter path to your dining data JSON file: ").strip()
    if not json_file:
        json_file = "purdue_lunch_2025-09-20.json"
    print("\nEnter your dietary preferences:")
    try:
        target_calories_input = input("Meal calorie target (default 2000): ").strip()
        protein_input = input("Protein % of calories (default 25): ").strip()
        carb_input = input("Carb % of calories (default 45): ").strip()
        fat_input = input("Fat % of calories (default 30): ").strip()

        target_calories = float(target_calories_input) if target_calories_input else 2000
        protein_percentage = float(protein_input) if protein_input else 25
        carb_percentage = float(carb_input) if carb_input else 45
        fat_percentage = float(fat_input) if fat_input else 30

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
            'meals_per_day': 1
        }

        planner = GeminiMealPlanner()

        output_file = "meal_recommendations.txt"
        planner.generate_all_court_recommendations(json_file, user_preferences, output_file)

        print(f"📄 Recommendations saved to {output_file}")

    except ValueError:
        print("❌ Invalid input. Please enter numbers for calorie and percentage values (integer or decimal).")
    except FileNotFoundError:
        print(f"❌ Could not find file: {json_file}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()