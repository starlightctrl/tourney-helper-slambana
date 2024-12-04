import { writable } from 'svelte/store';

export const playerDatabaseVersion = writable(0);
export const useLocalStorage = writable(false);

export function notifyDatabaseUpdate() {
    playerDatabaseVersion.update(n => n + 1);
    // Also update localStorage if we're using it
    if (typeof window !== 'undefined' && localStorage.getItem('playerDatabase')) {
        useLocalStorage.set(true);
    }
}
