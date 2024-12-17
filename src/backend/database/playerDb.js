import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = path.join(__dirname, '../../../local-data/players.json');

class PlayerDatabase {
    constructor() {
        this.players = [];
        this.initialized = false;
    }

    async initialize() {
        try {
            // Try to read from local-data/players.json
            const data = await fs.readFile(DB_PATH, 'utf8');
            if (data && data.trim()) {
                this.players = JSON.parse(data);
            } else {
                this.players = [];
            }
        } catch (error) {
            // If file doesn't exist, start with empty array
            this.players = [];
            // Create the file
            await this.save();
        }
        this.initialized = true;
    }

    async save() {
        try {
            console.log('Saving database with players:', this.players.length);
            await fs.writeFile(DB_PATH, JSON.stringify(this.players, null, 2));
            console.log('Database saved successfully');
        } catch (error) {
            console.error('Could not save to file system:', error);
            throw error;
        }
    }

    async addPlayer(player) {
        if (!this.initialized) await this.initialize();
        this.players.push(player);
        await this.save();
        return player;
    }

    async updatePlayer(tag, updatedPlayer) {
        if (!this.initialized) await this.initialize();
        const index = this.players.findIndex(p => p.tag === tag);
        if (index === -1) throw new Error('Player not found');
        this.players[index] = updatedPlayer;
        await this.save();
        return updatedPlayer;
    }

    async deletePlayer(tag) {
        if (!this.initialized) await this.initialize();
        const index = this.players.findIndex(p => p.tag === tag);
        if (index === -1) {
            console.log(`Player ${tag} not found, skipping deletion`);
            return; // Just return instead of throwing error
        }
        this.players.splice(index, 1);
        await this.save();
    }

    async clearDatabase() {
        if (!this.initialized) await this.initialize();
        console.log('Before clear - Players count:', this.players.length);
        console.log('Current players before clear:', JSON.stringify(this.players));
        
        this.players = [];  // Direct reset
        
        console.log('After clear - Players count:', this.players.length);
        console.log('Current players after clear:', JSON.stringify(this.players));
        
        await this.save();
        
        // Verify the file was actually cleared
        const fileContents = await fs.readFile(DB_PATH, 'utf8');
        console.log('Database file contents after save:', fileContents);
        
        console.log('Database clear operation completed');
    }

    async getAllPlayers() {
        if (!this.initialized) await this.initialize();
        console.log('Getting all players, count:', this.players.length);
        return this.players;
    }

    async searchPlayers(query) {
        if (!this.initialized) await this.initialize();
        query = query.toLowerCase();
        return this.players.filter(player => 
            player.tag.toLowerCase().includes(query) ||
            player.aliases.some(alias => alias.toLowerCase().includes(query))
        );
    }
}

export default new PlayerDatabase();
