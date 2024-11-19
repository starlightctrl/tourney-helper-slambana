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
        console.error('Import error:', error);
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
        let importCount = { new: 0, updated: 0 };  // Track new vs updated players
        
        // Process and merge the data
        for (const row of data) {
            // Skip if no Tag provided
            if (!row.Tag) continue;

            const playerData = {
                tag: row.Tag.trim(), // Trim whitespace
                aliases: [],
                paymentMethods: {
                    venmo: (row.Venmo || '').trim(),
                    paypal: (row.Paypal || '').trim(),
                    zelle: (row.Zelle || '').trim()
                },
                notes: (row.Notes || '').trim()
            };

            // Check if player already exists (case-insensitive)
            const existingPlayer = existingPlayers.find(p => 
                p.tag.toLowerCase() === playerData.tag.toLowerCase()
            );
            
            if (existingPlayer) {
                // Only update if there's new payment information
                const updatedPlayer = {
                    ...existingPlayer,
                    paymentMethods: {
                        venmo: playerData.paymentMethods.venmo || existingPlayer.paymentMethods.venmo,
                        paypal: playerData.paymentMethods.paypal || existingPlayer.paymentMethods.paypal,
                        zelle: playerData.paymentMethods.zelle || existingPlayer.paymentMethods.zelle
                    }
                };

                // Only update if something changed
                if (JSON.stringify(updatedPlayer) !== JSON.stringify(existingPlayer)) {
                    await playerDb.updatePlayer(existingPlayer.tag, updatedPlayer);
                    importCount.updated++;
                }
            } else {
                // Only add if we have at least one payment method
                if (playerData.paymentMethods.venmo || 
                    playerData.paymentMethods.paypal || 
                    playerData.paymentMethods.zelle) {
                    await playerDb.addPlayer(playerData);
                    importCount.new++;
                }
            }
        }

        res.json({ 
            message: 'Import successful', 
            newPlayers: importCount.new,
            updatedPlayers: importCount.updated
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new route for clearing database
router.delete('/players/all', async (req, res) => {
    try {
        console.log('Starting database clear operation');
        const beforeCount = (await playerDb.getAllPlayers()).length;
        console.log('Players before clear:', beforeCount);
        
        await playerDb.clearDatabase();
        
        const afterCount = (await playerDb.getAllPlayers()).length;
        console.log('Players after clear:', afterCount);
        
        res.json({ 
            message: 'Database cleared successfully',
            beforeCount,
            afterCount
        });
    } catch (error) {
        console.error('Error clearing database:', error);
        res.status(500).json({ error: error.message || 'Failed to clear database' });
    }
});

export default router;
