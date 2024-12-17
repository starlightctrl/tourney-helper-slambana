import { writable } from 'svelte/store';

export const playerDatabaseVersion = writable(0);

export function notifyDatabaseUpdate() {
    playerDatabaseVersion.update(n => n + 1);
}
