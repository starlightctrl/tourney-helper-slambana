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
            const data = await fs.readFile(DB_PATH, 'utf8');
            this.players = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create empty database
            this.players = [];
            await this.save();
        }
        this.initialized = true;
    }

    async save() {
        await fs.writeFile(DB_PATH, JSON.stringify(this.players, null, 2));
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
        if (index === -1) throw new Error('Player not found');
        this.players.splice(index, 1);
        await this.save();
    }

    async getAllPlayers() {
        if (!this.initialized) await this.initialize();
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
