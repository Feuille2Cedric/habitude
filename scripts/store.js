import { buildSeedHabits, normalizeHabit } from "./data.js";

const TABLE_NAME = "habits";
const SELECT_FIELDS = "id, user_id, name, description, color, icon, history, created_at, updated_at";

function mapRowToHabit(row) {
    return normalizeHabit(row);
}

function mapHabitToRow(userId, habit) {
    return {
        user_id: userId,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        icon: habit.icon,
        history: habit.history
    };
}

export async function loadHabits(client) {
    const { data, error } = await client
        .from(TABLE_NAME)
        .select(SELECT_FIELDS)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToHabit);
}

export async function createHabitRecord(client, userId, habit) {
    const { data, error } = await client
        .from(TABLE_NAME)
        .insert(mapHabitToRow(userId, habit))
        .select(SELECT_FIELDS)
        .single();

    if (error) throw error;
    return mapRowToHabit(data);
}

export async function updateHabitRecord(client, id, patch) {
    const { data, error } = await client
        .from(TABLE_NAME)
        .update(patch)
        .eq("id", id)
        .select(SELECT_FIELDS)
        .single();

    if (error) throw error;
    return mapRowToHabit(data);
}

export async function deleteHabitRecord(client, id) {
    const { error } = await client
        .from(TABLE_NAME)
        .delete()
        .eq("id", id);

    if (error) throw error;
}

export async function replaceWithSeedHabits(client, userId) {
    const { error: deleteError } = await client
        .from(TABLE_NAME)
        .delete()
        .eq("user_id", userId);

    if (deleteError) throw deleteError;

    const seedHabits = buildSeedHabits().map((habit) => mapHabitToRow(userId, habit));
    const { data, error } = await client
        .from(TABLE_NAME)
        .insert(seedHabits)
        .select(SELECT_FIELDS);

    if (error) throw error;
    return (data || []).map(mapRowToHabit);
}
