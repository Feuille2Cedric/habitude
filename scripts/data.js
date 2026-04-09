export const GRID_LENGTH = 84;

export const COLORS = [
    "#42d89f",
    "#b678ff",
    "#ff7474",
    "#ff9d3f",
    "#47c97b",
    "#5bc0ff"
];

export const ICONS = ["walk", "language", "fruit", "stretch", "breathe", "book"];

export const ICON_PATHS = {
    walk: '<path d="M9 4.5a1.5 1.5 0 1 0 0 .01"></path><path d="M7.5 20 9 13l2.4-2.2 2.1 2.2 1.2 7"></path><path d="M10.5 8.2 7 10.4l-2.2 4.1"></path><path d="m12 9 3 2 2.8-.8"></path>',
    language: '<path d="M4 6h8v8H4z"></path><path d="M12 8h8v8h-8z"></path><path d="M7 15l2-6 2 6"></path><path d="M6.5 12.5h3"></path><path d="M15 10c.5 1.8 1.8 4.2 4 5"></path><path d="M19 10c-.4 2.1-1.4 3.8-3 5"></path>',
    fruit: '<path d="M12.2 7.2c1.6-2 3.7-2.3 5-1.2"></path><path d="M12 8c-4.3 0-7 2.9-7 6.5C5 18 7.5 20 11 20s8-2 8-5.5C19 10.6 16.3 8 12 8Z"></path><path d="M12 8c-.3-2.6.6-4.2 2.5-5"></path>',
    stretch: '<path d="M12 4a1.7 1.7 0 1 0 0 .01"></path><path d="M7 10.5 12 8l5 2.5"></path><path d="M12 8v5"></path><path d="M9 20l3-7 3 7"></path><path d="M6 13h12"></path>',
    breathe: '<path d="M6 14c0-2.5 1.8-4 4-4 2.6 0 4 1.7 4 4s-1.7 4-4 4c-2.7 0-4-1.7-4-4Z"></path><path d="M14 10c0-2.7 1.8-4.5 4.3-4.5S22 7 22 9.5 20.3 14 17.8 14"></path><path d="M2 14h2"></path><path d="M14 18h4"></path>',
    book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21z"></path><path d="M5 5.5v13"></path><path d="M9 7h6"></path><path d="M9 11h6"></path>'
};

export const DEFAULT_HABITS = [
    { name: "Walk around the block", description: "Go for a short walk to clear the mind", color: "#42d89f", icon: "walk" },
    { name: "Learn Norwegian", description: "Three lessons per day", color: "#b678ff", icon: "language" },
    { name: "Eat a piece of fruit", description: "Stay healthy and do not overeat", color: "#ff7474", icon: "fruit" },
    { name: "Stretch for 5 minutes", description: "Improve flexibility and relax muscles", color: "#ff9d3f", icon: "stretch" },
    { name: "Deep breathing exercise", description: "Calm your mind with a quick exercise", color: "#47c97b", icon: "breathe" }
];

export function uid() {
    return Math.random().toString(36).slice(2, 10);
}

export function createHistory(seedOffset = 0) {
    return Array.from(
        { length: GRID_LENGTH },
        (_, index) => ((index + seedOffset) % 5 !== 0) && ((index + seedOffset) % 9 !== 0)
    );
}

function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTodayDateKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

export function getHabitAnchorDate(habit) {
    const rawDate = habit.updatedAt || habit.updated_at || habit.createdAt || habit.created_at;
    if (!rawDate) return new Date();

    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getDayDifference(fromDate, toDate = new Date()) {
    const from = startOfLocalDay(fromDate);
    const to = startOfLocalDay(toDate);
    const diff = Math.round((to.getTime() - from.getTime()) / 86400000);
    return Math.max(0, diff);
}

export function shiftHistory(history, days) {
    if (days <= 0) return [...history];
    if (days >= history.length) return new Array(history.length).fill(false);
    return history.slice(days).concat(new Array(days).fill(false));
}

export function alignHabitToToday(habit) {
    const normalizedHabit = normalizeHabit(habit);
    const daysElapsed = getDayDifference(getHabitAnchorDate(habit));

    if (daysElapsed <= 0) {
        return { habit: normalizedHabit, changed: false };
    }

    return {
        habit: {
            ...normalizedHabit,
            history: shiftHistory(normalizedHabit.history, daysElapsed)
        },
        changed: true
    };
}

export function normalizeHabit(habit) {
    return {
        id: habit.id || uid(),
        name: habit.name || "Nouvelle habitude",
        description: habit.description || "Description a definir",
        color: habit.color || COLORS[0],
        icon: ICON_PATHS[habit.icon] ? habit.icon : ICONS[0],
        createdAt: habit.createdAt || habit.created_at || null,
        updatedAt: habit.updatedAt || habit.updated_at || null,
        history: Array.from(
            { length: GRID_LENGTH },
            (_, index) => Boolean(habit.history && habit.history[index])
        )
    };
}

export function buildSeedHabits() {
    return DEFAULT_HABITS.map((habit, index) => normalizeHabit({
        id: uid(),
        ...habit,
        history: createHistory(index * 3)
    }));
}
