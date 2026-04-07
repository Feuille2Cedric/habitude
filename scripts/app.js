import { COLORS, GRID_LENGTH, ICONS, normalizeHabit, uid } from "./data.js";
import {
    createHabitRecord,
    deleteHabitRecord,
    loadHabits,
    replaceWithSeedHabits,
    updateHabitRecord
} from "./store.js";
import {
    getCurrentUser,
    isSupabaseConfigured,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    subscribeToAuthChanges,
    supabase
} from "./supabase.js";
import { renderClock, renderFilters, renderFormOptions, renderHabits, renderSummary } from "./ui.js";

const elements = {
    setupNotice: document.getElementById("setupNotice"),
    authShell: document.getElementById("authShell"),
    appShell: document.getElementById("appShell"),
    authForm: document.getElementById("authForm"),
    authEmail: document.getElementById("authEmail"),
    authPassword: document.getElementById("authPassword"),
    authFeedback: document.getElementById("authFeedback"),
    userEmail: document.getElementById("userEmail"),
    syncStatus: document.getElementById("syncStatus"),
    clock: document.getElementById("clock"),
    hero: document.getElementById("hero"),
    habitCount: document.getElementById("habitCount"),
    completionRate: document.getElementById("completionRate"),
    todayCount: document.getElementById("todayCount"),
    habitList: document.getElementById("habitList"),
    filterTabs: document.getElementById("filterTabs"),
    habitDialog: document.getElementById("habitDialog"),
    habitDialogTitle: document.getElementById("habitDialogTitle"),
    habitDialogCopy: document.getElementById("habitDialogCopy"),
    habitForm: document.getElementById("habitForm"),
    deleteDialog: document.getElementById("deleteDialog"),
    deleteCopy: document.getElementById("deleteCopy"),
    colorSwatches: document.getElementById("colorSwatches"),
    iconChips: document.getElementById("iconChips"),
    habitName: document.getElementById("habitName"),
    habitDescription: document.getElementById("habitDescription"),
    signUpButton: document.getElementById("signUpButton")
};

const state = {
    habits: [],
    filter: "all",
    showHero: true,
    selectedColor: COLORS[0],
    selectedIcon: ICONS[0],
    editingId: null,
    deleteId: null,
    user: null
};

function setAuthFeedback(message = "", tone = "") {
    elements.authFeedback.textContent = message;
    elements.authFeedback.className = "auth-feedback";
    if (tone) {
        elements.authFeedback.classList.add(tone);
    }
}

function setSyncStatus(message, tone = "") {
    elements.syncStatus.textContent = message;
    elements.syncStatus.className = "board-status";
    if (tone) {
        elements.syncStatus.classList.add(tone);
    }
}

function toggleShells({ setup = false, auth = false, app = false }) {
    elements.setupNotice.classList.toggle("is-hidden", !setup);
    elements.authShell.classList.toggle("is-hidden", !auth);
    elements.appShell.classList.toggle("is-hidden", !app);
    elements.setupNotice.hidden = !setup;
    elements.authShell.hidden = !auth;
    elements.appShell.hidden = !app;
}

function renderApp() {
    renderSummary(state, elements);
    renderFilters(state, elements.filterTabs);
    renderHabits(state, elements.habitList);
    renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);
    elements.userEmail.textContent = state.user?.email || "utilisateur";
}

function resetFormState() {
    state.editingId = null;
    state.selectedColor = COLORS[0];
    state.selectedIcon = ICONS[0];
    elements.habitForm.reset();
    elements.habitDialogTitle.textContent = "Nouvelle habitude";
    elements.habitDialogCopy.textContent = "Ajoute une carte avec sa couleur, son icone et un historique vide pret a l'emploi.";
}

function openHabitDialog(habit = null) {
    resetFormState();

    if (habit) {
        state.editingId = habit.id;
        state.selectedColor = habit.color;
        state.selectedIcon = habit.icon;
        elements.habitName.value = habit.name;
        elements.habitDescription.value = habit.description;
        elements.habitDialogTitle.textContent = "Modifier l'habitude";
        elements.habitDialogCopy.textContent = "Ajuste le nom, la description, la couleur ou l'icone sans perdre l'historique.";
    }

    renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);
    elements.habitDialog.showModal();
    elements.habitName.focus();
}

async function refreshHabits() {
    if (!state.user || !supabase) return;

    setSyncStatus("Chargement des habitudes...");
    try {
        state.habits = await loadHabits(supabase);
        renderApp();
        setSyncStatus("Synchronise avec Supabase.");
    } catch (error) {
        console.error(error);
        setSyncStatus(`Erreur de synchronisation: ${error.message}`, "error");
    }
}

function updateHabitInState(updatedHabit) {
    const index = state.habits.findIndex((habit) => habit.id === updatedHabit.id);
    if (index === -1) {
        state.habits.unshift(updatedHabit);
    } else {
        state.habits[index] = updatedHabit;
    }
    renderApp();
}

async function persistHabitPatch(habitId, patch) {
    try {
        const updatedHabit = await updateHabitRecord(supabase, habitId, patch);
        updateHabitInState(updatedHabit);
        setSyncStatus("Modifications synchronisees.");
    } catch (error) {
        console.error(error);
        setSyncStatus(`Erreur de synchronisation: ${error.message}`, "error");
        await refreshHabits();
    }
}

async function toggleCell(habitId, index) {
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) return;

    const history = [...habit.history];
    history[index] = !history[index];
    await persistHabitPatch(habitId, { history });
}

async function toggleToday(habitId) {
    await toggleCell(habitId, GRID_LENGTH - 1);
}

function askDelete(habitId) {
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) return;
    state.deleteId = habitId;
    elements.deleteCopy.textContent = `Supprimer "${habit.name}" et son historique Supabase ?`;
    elements.deleteDialog.showModal();
}

async function confirmDelete() {
    if (!state.deleteId) return;

    try {
        await deleteHabitRecord(supabase, state.deleteId);
        state.habits = state.habits.filter((habit) => habit.id !== state.deleteId);
        state.deleteId = null;
        renderApp();
        setSyncStatus("Habitude supprimee.");
    } catch (error) {
        console.error(error);
        setSyncStatus(`Erreur de suppression: ${error.message}`, "error");
    }
}

async function submitHabit(event) {
    event.preventDefault();

    const name = elements.habitName.value.trim();
    const description = elements.habitDescription.value.trim();
    if (!name || !state.user) return;

    setSyncStatus("Enregistrement...");

    try {
        if (state.editingId) {
            const currentHabit = state.habits.find((habit) => habit.id === state.editingId);
            if (!currentHabit) return;

            const updatedHabit = await updateHabitRecord(supabase, state.editingId, {
                name,
                description: description || "Nouvelle routine personnelle",
                color: state.selectedColor,
                icon: state.selectedIcon,
                history: currentHabit.history
            });
            updateHabitInState(updatedHabit);
        } else {
            const createdHabit = await createHabitRecord(supabase, state.user.id, normalizeHabit({
                id: uid(),
                name,
                description: description || "Nouvelle routine personnelle",
                color: state.selectedColor,
                icon: state.selectedIcon,
                history: new Array(GRID_LENGTH).fill(false)
            }));
            state.habits.unshift(createdHabit);
            renderApp();
        }

        setSyncStatus("Habitude synchronisee.");
        elements.habitDialog.close();
        resetFormState();
    } catch (error) {
        console.error(error);
        setSyncStatus(`Erreur d'enregistrement: ${error.message}`, "error");
    }
}

function editHabit(habitId) {
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) return;
    openHabitDialog(habit);
}

async function seedHabits() {
    if (!state.user) return;
    const confirmed = window.confirm("Remplacer toutes tes habitudes par la demo ?");
    if (!confirmed) return;

    setSyncStatus("Recreation des habitudes de demo...");
    try {
        state.habits = await replaceWithSeedHabits(supabase, state.user.id);
        renderApp();
        setSyncStatus("Demo rechargee dans Supabase.");
    } catch (error) {
        console.error(error);
        setSyncStatus(`Erreur pendant le rechargement: ${error.message}`, "error");
    }
}

async function handleSignedInUser(user) {
    state.user = user;
    toggleShells({ app: true });
    setAuthFeedback("");
    await refreshHabits();
}

function handleSignedOutUser() {
    state.user = null;
    state.habits = [];
    resetFormState();
    toggleShells({ auth: true });
}

async function submitSignIn(event) {
    event.preventDefault();
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;

    setAuthFeedback("Connexion en cours...");
    try {
        await signInWithPassword(email, password);
        setAuthFeedback("Connexion reussie.", "success");
    } catch (error) {
        console.error(error);
        setAuthFeedback(error.message, "error");
    }
}

async function submitSignUp() {
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    if (!email || !password) {
        setAuthFeedback("Renseigne un email et un mot de passe.", "error");
        return;
    }

    setAuthFeedback("Creation du compte...");
    try {
        const data = await signUpWithPassword(email, password);
        if (data.session) {
            setAuthFeedback("Compte cree et connecte.", "success");
        } else {
            setAuthFeedback("Compte cree. Si la confirmation email est active dans Supabase, valide l'email avant connexion.", "success");
        }
    } catch (error) {
        console.error(error);
        setAuthFeedback(error.message, "error");
    }
}

async function boot() {
    renderClock(elements.clock);
    setInterval(() => renderClock(elements.clock), 30000);
    renderFormOptions({ color: state.selectedColor, icon: state.selectedIcon }, elements);

    if (!isSupabaseConfigured()) {
        toggleShells({ setup: true });
        return;
    }

    subscribeToAuthChanges(async (user) => {
        if (user) {
            await handleSignedInUser(user);
        } else {
            handleSignedOutUser();
        }
    });

    try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
            await handleSignedInUser(currentUser);
        } else {
            handleSignedOutUser();
        }
    } catch (error) {
        console.error(error);
        handleSignedOutUser();
        setAuthFeedback(`Impossible de contacter Supabase au chargement: ${error.message}`, "error");
    }
}

function bindEvents() {
    elements.authForm.addEventListener("submit", submitSignIn);
    elements.signUpButton.addEventListener("click", submitSignUp);

    document.getElementById("signOutButton").addEventListener("click", async () => {
        try {
            await signOut();
        } catch (error) {
            console.error(error);
            setSyncStatus(`Erreur de deconnexion: ${error.message}`, "error");
        }
    });

    document.getElementById("openDialogButton").addEventListener("click", () => openHabitDialog());
    document.getElementById("floatingAdd").addEventListener("click", () => openHabitDialog());
    document.getElementById("cancelDialog").addEventListener("click", () => {
        elements.habitDialog.close();
        resetFormState();
    });
    document.getElementById("cancelDelete").addEventListener("click", () => elements.deleteDialog.close());

    document.getElementById("toggleSummary").addEventListener("click", () => {
        state.showHero = !state.showHero;
        renderSummary(state, elements);
    });

    document.getElementById("seedButton").addEventListener("click", seedHabits);

    elements.filterTabs.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-filter]");
        if (!button) return;
        state.filter = button.dataset.filter;
        renderApp();
    });

    elements.habitList.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const { action, id, index } = button.dataset;
        if (action === "cell") await toggleCell(id, Number(index));
        if (action === "today") await toggleToday(id);
        if (action === "edit") editHabit(id);
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

    elements.habitForm.addEventListener("submit", submitHabit);
    document.getElementById("deleteForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        await confirmDelete();
        elements.deleteDialog.close();
    });
}

bindEvents();
boot().catch((error) => {
    console.error(error);
    handleSignedOutUser();
    setAuthFeedback(`Erreur de demarrage: ${error.message}`, "error");
});
