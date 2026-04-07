import { STORAGE_KEY, buildSeedHabits, normalizeHabit } from "./data.js";

export function loadHabits() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return buildSeedHabits();
    }

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map(normalizeHabit);
        }
    } catch (error) {
        console.error("Impossible de lire les habitudes locales", error);
    }

    return buildSeedHabits();
}

export function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}
