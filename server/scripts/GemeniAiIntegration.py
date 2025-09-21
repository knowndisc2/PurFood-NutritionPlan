#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GemeniAiIntegration.py
Reads JSON from stdin in the shape { "goals": {...}, "menu": {...} },
generates a meal plan text, and writes it to stdout.
This is a lightweight template you can replace with real Gemini API logic.

Expected input (stdin JSON):
{
  "goals": {
    "calories": "2000",
    "macros": {"protein": 25, "carbs": 45, "fats": 30},
    "dietaryPrefs": ["Vegetarian", ...],
    "mealPrefs": ["Lunch", "Dinner"],
    "aiPrompt": "..."
  },
  "menu": { ... scraped menu JSON ... }
}

Output (stdout): plain text plan.
Any debug/errors should go to stderr so the Node process can capture them.
"""

import sys
import json
from datetime import datetime


def format_macros(macros):
    if not isinstance(macros, dict):
        return "(unspecified)"
    p = macros.get("protein")
    c = macros.get("carbs")
    f = macros.get("fats")
    parts = []
    if p is not None:
        parts.append(f"Protein: {p}%")
    if c is not None:
        parts.append(f"Carbs: {c}%")
    if f is not None:
        parts.append(f"Fats: {f}%")
    return ", ".join(parts) if parts else "(unspecified)"


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw else {}
        goals = payload.get("goals", payload)
        menu = payload.get("menu", {})

        calories = goals.get("calories", "unspecified")
        macros = goals.get("macros", {})
        dietary = goals.get("dietaryPrefs", []) or []
        meals = goals.get("mealPrefs", []) or []
        prompt = goals.get("aiPrompt", "")

        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        header = f"Your Personalized Meal Plan\nGenerated: {ts}\n"

        lines = [
            header,
            "",
            f"Daily Calories Target: {calories}",
            f"Macro Targets: {format_macros(macros)}",
            f"Dietary Preferences: {', '.join(dietary) if dietary else 'None'}",
            f"Meal Preferences: {', '.join(meals) if meals else 'None'}",
        ]
        if prompt:
            lines.append("")
            lines.append("Notes:")
            lines.append(prompt)

        # If menu data is provided, extract a few sample items as suggestions
        suggestions = []
        try:
            if isinstance(menu, dict):
                # menu structure: { courtName: { stations: { stationName: [items...] }, ... }, ... }
                for court_name, court in list(menu.items())[:3]:
                    stations = court.get('stations', {}) if isinstance(court, dict) else {}
                    for station_name, items in list(stations.items())[:2]:
                        for item in items[:2]:
                            name = item.get('name') if isinstance(item, dict) else None
                            kcal = item.get('total_calories') if isinstance(item, dict) else None
                            if name:
                                label = f"- {name} ({court_name} • {station_name})"
                                if isinstance(kcal, (int, float)):
                                    label += f" — {int(kcal)} kcal"
                                suggestions.append(label)
                            if len(suggestions) >= 8:
                                break
                        if len(suggestions) >= 8:
                            break
                    if len(suggestions) >= 8:
                        break
        except Exception:
            # ignore menu parsing issues gracefully
            pass

        lines.append("")
        lines.append("Menu-Based Suggestions:")
        if suggestions:
            lines.extend(suggestions)
        else:
            lines.extend([
                "- Suggestion A",
                "- Suggestion B",
                "- Suggestion C",
            ])

        plan_text = "\n".join(lines).strip() + "\n"
        sys.stdout.write(plan_text)
    except Exception as e:
        # Write errors to stderr and exit non-zero
        sys.stderr.write(str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
