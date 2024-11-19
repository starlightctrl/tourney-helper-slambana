import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import startgg from './startgg.js';
import playerDb from '../database/playerDb.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/tournament/:slug', async (req, res) => {
    try {
        console.log('Received request for tournament:', req.params.slug); // Debug log
        const data = await startgg.getTournamentData(req.params.slug);
        res.json(data);
    } catch (error) {
        console.error('API error:', error); // Debug log
        res.status(500).json({ error: error.message });
    }
});

router.get('/players', async (req, res) => {
    try {
        const players = await playerDb.getAllPlayers();
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/players', async (req, res) => {
    try {
        const player = await playerDb.addPlayer(req.body);
        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/players/:tag', async (req, res) => {
    try {
        const player = await playerDb.updatePlayer(req.params.tag, req.body);
        res.json(player);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/players/:tag', async (req, res) => {
    try {
        await playerDb.deletePlayer(req.params.tag);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/players/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Get existing players
        const existingPlayers = await playerDb.getAllPlayers();
        
        // Process and merge the data
        for (const row of data) {
            const playerData = {
                tag: row.Tag,
                aliases: [],
                paymentMethods: {
                    venmo: row.Venmo || '',
                    paypal: row.Paypal || '',
                    zelle: row.Zelle || ''
                },
                notes: row.Notes || ''
            };

            // Check if player already exists
            const existingPlayer = existingPlayers.find(p => p.tag.toLowerCase() === playerData.tag.toLowerCase());
            
            if (existingPlayer) {
                // Merge payment methods
                existingPlayer.paymentMethods = {
                    venmo: playerData.paymentMethods.venmo || existingPlayer.paymentMethods.venmo,
                    paypal: playerData.paymentMethods.paypal || existingPlayer.paymentMethods.paypal,
                    zelle: playerData.paymentMethods.zelle || existingPlayer.paymentMethods.zelle
                };
                await playerDb.updatePlayer(existingPlayer.tag, existingPlayer);
            } else {
                await playerDb.addPlayer(playerData);
            }
        }

        res.json({ message: 'Import successful', count: players.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new route for clearing database
router.delete('/players/all', async (req, res) => {
    try {
        console.log('Attempting to clear database...');
        await playerDb.clearDatabase();
        console.log('Database cleared successfully');
        res.json({ message: 'Database cleared successfully' });
    } catch (error) {
        console.error('Error clearing database:', error);
        res.status(500).json({ error: error.message || 'Failed to clear database' });
    }
});

export default router;
