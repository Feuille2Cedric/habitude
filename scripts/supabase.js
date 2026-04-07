import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

function isPlaceholder(value, token) {
    return !value || value.includes(token);
}

export function isSupabaseConfigured() {
    return !isPlaceholder(SUPABASE_URL, "YOUR_PROJECT_ID")
        && !isPlaceholder(SUPABASE_ANON_KEY, "YOUR_PUBLIC_ANON_KEY");
}

export const supabase = isSupabaseConfigured()
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : null;

export async function getCurrentUser() {
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user ?? null;
}

export async function signInWithPassword(email, password) {
    if (!supabase) throw new Error("Supabase n'est pas configure.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUpWithPassword(email, password) {
    if (!supabase) throw new Error("Supabase n'est pas configure.");
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`
        }
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export function subscribeToAuthChanges(callback) {
    if (!supabase) {
        return { data: { subscription: { unsubscribe() {} } } };
    }

    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}
