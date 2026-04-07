import { COLORS, GRID_LENGTH, ICONS, ICON_PATHS } from "./data.js";

function buildIcon(name) {
    return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            ${ICON_PATHS[name]}
        </svg>
    `;
}

function getCompletionRate(habit) {
    const done = habit.history.filter(Boolean).length;
    return Math.round((done / habit.history.length) * 100);
}

function getStreak(habit) {
    let streak = 0;
    for (let index = habit.history.length - 1; index >= 0; index -= 1) {
        if (!habit.history[index]) break;
        streak += 1;
    }
    return streak;
}

function renderEmptyState() {
    return `
        <div class="empty-state">
            <div>
                <strong>Aucune habitude dans ce filtre</strong>
                <p>Passe sur "Toutes" ou ajoute une nouvelle carte.</p>
            </div>
        </div>
    `;
}

function renderGrid(habit) {
    return habit.history.map((active, index) => `
        <button
            type="button"
            class="grid-cell ${active ? "is-active" : ""}"
            style="--habit-color:${habit.color}"
            data-action="cell"
            data-id="${habit.id}"
            data-index="${index}"
            aria-label="${habit.name}, jour ${index + 1}, ${active ? "fait" : "non fait"}"
        ></button>
    `).join("");
}

function renderHabitCard(habit) {
    const todayDone = habit.history[GRID_LENGTH - 1];
    const streak = getStreak(habit);
    const rate = getCompletionRate(habit);

    return `
        <article class="habit-card" style="--habit-color:${habit.color}">
            <div class="habit-head">
                <div class="habit-icon">${buildIcon(habit.icon)}</div>
                <div class="habit-content">
                    <h2 class="habit-title">${habit.name}</h2>
                    <p class="habit-description">${habit.description}</p>
                    <div class="habit-meta">
                        <span>${streak} jours de suite</span>
                        <span>${rate}% reussi</span>
                        <button type="button" class="inline-button" data-action="edit" data-id="${habit.id}">Modifier</button>
                        <button type="button" class="inline-button" data-action="delete" data-id="${habit.id}">Supprimer</button>
                    </div>
                </div>
                <button
                    type="button"
                    class="habit-cta ${todayDone ? "done" : ""}"
                    data-action="today"
                    data-id="${habit.id}"
                    aria-label="${todayDone ? "Retirer" : "Valider"} ${habit.name} aujourd'hui"
                >
                    ${todayDone
                        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17l9-10"></path></svg>'
                        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>'}
                </button>
            </div>
            <div class="habit-grid">${renderGrid(habit)}</div>
        </article>
    `;
}

export function renderClock(clockElement) {
    clockElement.textContent = new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function renderSummary(state, elements) {
    const totalCells = state.habits.reduce((sum, habit) => sum + habit.history.length, 0);
    const completedCells = state.habits.reduce((sum, habit) => sum + habit.history.filter(Boolean).length, 0);
    const doneToday = state.habits.filter((habit) => habit.history[GRID_LENGTH - 1]).length;

    elements.habitCount.textContent = String(state.habits.length);
    elements.completionRate.textContent = `${totalCells ? Math.round((completedCells / totalCells) * 100) : 0}%`;
    elements.todayCount.textContent = String(doneToday);
    elements.hero.hidden = !state.showHero;
}

export function renderFilters(state, filtersRoot) {
    filtersRoot.querySelectorAll("button[data-filter]").forEach((button) => {
        const active = button.dataset.filter === state.filter;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });
}

export function renderHabits(state, listElement) {
    const habits = state.filter === "today"
        ? state.habits.filter((habit) => !habit.history[GRID_LENGTH - 1])
        : state.habits;

    listElement.innerHTML = habits.length
        ? habits.map(renderHabitCard).join("")
        : renderEmptyState();
}

export function renderFormOptions(selection, elements) {
    elements.colorSwatches.innerHTML = COLORS.map((color) => `
        <button
            type="button"
            class="swatch ${selection.color === color ? "active" : ""}"
            style="background:${color}"
            data-color="${color}"
            aria-label="Choisir ${color}"
        ></button>
    `).join("");

    elements.iconChips.innerHTML = ICONS.map((icon) => `
        <button
            type="button"
            class="chip ${selection.icon === icon ? "active" : ""}"
            data-icon="${icon}"
        >${icon}</button>
    `).join("");
}
