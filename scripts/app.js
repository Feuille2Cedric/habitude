import { COLORS, GRID_LENGTH, ICONS, buildSeedHabits, normalizeHabit, uid } from "./data.js";
import { loadHabits, saveHabits } from "./store.js";
import { renderClock, renderFilters, renderFormOptions, renderHabits, renderSummary } from "./ui.js";

const elements = {
    clock: document.getElementById("clock"),
    hero: document.getElementById("hero"),
    habitCount: document.getElementById("habitCount"),
    completionRate: document.getElementById("completionRate"),
    todayCount: document.getElementById("todayCount"),
    habitList: document.getElementById("habitList"),
    filterTabs: document.getElementById("filterTabs"),
    habitDialog: document.getElementById("habitDialog"),
    habitForm: document.getElementById("habitForm"),
    deleteDialog: document.getElementById("deleteDialog"),
    deleteCopy: document.getElementById("deleteCopy"),
    colorSwatches: document.getElementById("colorSwatches"),
    iconChips: document.getElementById("iconChips"),
    habitName: document.getElementById("habitName"),
    habitDescription: document.getElementById("habitDescription")
};

const state = {
    habits: loadHabits(),
    filter: "all",
    showHero: true,
    selectedColor: COLORS[0],
    selectedIcon: ICONS[0],
    deleteId: null
};

function persist() {
    saveHabits(state.habits);
}

function render() {
    renderSummary(state, elements);
    renderFilters(state, elements.filterTabs);
    renderHabits(state, elements.habitList);
    renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);
}

function resetFormState() {
    state.selectedColor = COLORS[0];
    state.selectedIcon = ICONS[0];
    elements.habitForm.reset();
}

function openHabitDialog() {
    resetFormState();
    renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);
    elements.habitDialog.showModal();
    elements.habitName.focus();
}

function toggleCell(habitId, index) {
    state.habits = state.habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const history = [...habit.history];
        history[index] = !history[index];
        return { ...habit, history };
    });
    persist();
    render();
}

function toggleToday(habitId) {
    toggleCell(habitId, GRID_LENGTH - 1);
}

function askDelete(habitId) {
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) return;
    state.deleteId = habitId;
    elements.deleteCopy.textContent = `Supprimer "${habit.name}" et son historique local ?`;
    elements.deleteDialog.showModal();
}

function confirmDelete() {
    if (!state.deleteId) return;
    state.habits = state.habits.filter((habit) => habit.id !== state.deleteId);
    state.deleteId = null;
    persist();
    render();
}

function createHabit(event) {
    event.preventDefault();

    const name = elements.habitName.value.trim();
    const description = elements.habitDescription.value.trim();
    if (!name) return;

    state.habits.unshift(normalizeHabit({
        id: uid(),
        name,
        description: description || "Nouvelle routine personnelle",
        color: state.selectedColor,
        icon: state.selectedIcon,
        history: new Array(GRID_LENGTH).fill(false)
    }));

    persist();
    render();
    elements.habitDialog.close();
}

function bindEvents() {
    document.getElementById("openDialogButton").addEventListener("click", openHabitDialog);
    document.getElementById("floatingAdd").addEventListener("click", openHabitDialog);
    document.getElementById("cancelDialog").addEventListener("click", () => elements.habitDialog.close());
    document.getElementById("cancelDelete").addEventListener("click", () => elements.deleteDialog.close());

    document.getElementById("toggleSummary").addEventListener("click", () => {
        state.showHero = !state.showHero;
        renderSummary(state, elements);
    });

    document.getElementById("seedButton").addEventListener("click", () => {
        state.habits = buildSeedHabits();
        persist();
        render();
    });

    elements.filterTabs.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-filter]");
        if (!button) return;
        state.filter = button.dataset.filter;
        render();
    });

    elements.habitList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const { action, id, index } = button.dataset;
        if (action === "cell") toggleCell(id, Number(index));
        if (action === "today") toggleToday(id);
        if (action === "delete") askDelete(id);
    });

    elements.colorSwatches.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-color]");
        if (!button) return;
        state.selectedColor = button.dataset.color;
        renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);
    });

    elements.iconChips.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-icon]");
        if (!button) return;
        state.selectedIcon = button.dataset.icon;
        renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);
    });

    elements.habitForm.addEventListener("submit", createHabit);

    document.getElementById("deleteForm").addEventListener("submit", (event) => {
        event.preventDefault();
        confirmDelete();
        elements.deleteDialog.close();
    });
}

function start() {
    bindEvents();
    renderClock(elements.clock);
    setInterval(() => renderClock(elements.clock), 30000);
    render();
}

start();
