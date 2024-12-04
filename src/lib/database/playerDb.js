import { Storage } from './storage';

class PlayerDatabase {
    constructor() {
        this.players = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        try {
            const data = await Storage.get('players');
            this.players = data || [];
        } catch (error) {
            console.error('Failed to initialize database:', error);
            this.players = [];
        }
        this.initialized = true;
    }

    async save() {
        try {
            await Storage.set('players', this.players);
        } catch (error) {
            console.error('Failed to save to database:', error);
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
        if (index === -1) return;
        this.players.splice(index, 1);
        await this.save();
    }

    async clearDatabase() {
        if (!this.initialized) await this.initialize();
        this.players = [];
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

    async mergePlayers(newPlayers) {
        if (!this.initialized) await this.initialize();
        
        let importCount = { new: 0, updated: 0 };
        
        for (const newPlayer of newPlayers) {
            const existingPlayer = this.players.find(p => 
                p.tag.toLowerCase() === newPlayer.tag.toLowerCase()
            );
            
            if (existingPlayer) {
                const mergedPlayer = {
                    ...existingPlayer,
                    tag: existingPlayer.tag,
                    aliases: [...new Set([...existingPlayer.aliases, ...(newPlayer.aliases || [])])],
                    paymentMethods: {
                        venmo: newPlayer.paymentMethods?.venmo || existingPlayer.paymentMethods.venmo,
                        paypal: newPlayer.paymentMethods?.paypal || existingPlayer.paymentMethods.paypal,
                        zelle: newPlayer.paymentMethods?.zelle || existingPlayer.paymentMethods.zelle
                    },
                    notes: newPlayer.notes || existingPlayer.notes
                };
                
                if (JSON.stringify(mergedPlayer) !== JSON.stringify(existingPlayer)) {
                    const index = this.players.indexOf(existingPlayer);
                    this.players[index] = mergedPlayer;
                    importCount.updated++;
                }
            } else {
                this.players.push(newPlayer);
                importCount.new++;
            }
        }
        
        await this.save();
        return importCount;
    }
}

export default new PlayerDatabase();
