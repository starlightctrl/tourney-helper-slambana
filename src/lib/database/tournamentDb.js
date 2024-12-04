import { kv } from '@vercel/kv';

class TournamentDatabase {
    constructor() {
        this.tournaments = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        try {
            const data = await kv.get('tournaments');
            this.tournaments = data || [];
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.tournaments = [];
        }
        this.initialized = true;
    }

    async save() {
        try {
            await kv.set('tournaments', this.tournaments);
        } catch (error) {
            console.error('Failed to save to database:', error);
            throw error;
        }
    }

    async addTournament(tournament) {
        if (!this.initialized) await this.initialize();
        this.tournaments.push(tournament);
        await this.save();
        return tournament;
    }

    async updateTournament(updatedTournament) {
        if (!this.initialized) await this.initialize();
        const index = this.tournaments.findIndex(t => t.id === updatedTournament.id);
        if (index === -1) throw new Error('Tournament not found');
        this.tournaments[index] = updatedTournament;
        await this.save();
        return updatedTournament;
    }

    async deleteTournament(id) {
        if (!this.initialized) await this.initialize();
        const index = this.tournaments.findIndex(t => t.id === id);
        if (index === -1) return;
        this.tournaments.splice(index, 1);
        await this.save();
    }

    async clearDatabase() {
        if (!this.initialized) await this.initialize();
        this.tournaments = [];
        await this.save();
    }

    async getAllTournaments() {
        if (!this.initialized) await this.initialize();
        return this.tournaments;
    }

    async getTournament(id) {
        if (!this.initialized) await this.initialize();
        return this.tournaments.find(t => t.id === id);
    }
}

export default new TournamentDatabase();
