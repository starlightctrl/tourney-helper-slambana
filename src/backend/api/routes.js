import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import startgg from './startgg.js';
import playerDb from '../database/playerDb.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/tournament/slambana', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        console.log('Fetching Slambana tournaments page:', page);
        const data = await startgg.getSlambanaData(page);
        console.log('Slambana API response:', JSON.stringify(data, null, 2));
        
        if (!data || !data.tournaments || !data.tournaments.nodes) {
            console.error('Unexpected API response structure:', data);
            return res.status(500).json({ error: 'Invalid API response structure' });
        }
        
        if (data.tournaments.nodes.length === 0) {
            console.log('No tournaments found in response');
        }
        
        res.json({ data: { tournaments: data.tournaments } });
    } catch (error) {
        console.error('Slambana API error:', error);
        res.status(500).json({ error: error.message });
    }
});

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


// Add new route for clearing database
router.delete('/players/all', async (req, res) => {
    console.log('Clear database route hit');
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

        let data;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        if (fileExtension === 'json') {
            // Handle JSON file
            try {
                data = JSON.parse(req.file.buffer.toString());
                // Ensure data is an array
                if (!Array.isArray(data)) {
                    data = [data];
                }
            } catch (error) {
                return res.status(400).json({ error: 'Invalid JSON file format' });
            }
        } else {
            // Handle Excel/CSV files as before
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            data = xlsx.utils.sheet_to_json(sheet);
        }

        // Get existing players
        const existingPlayers = await playerDb.getAllPlayers();
        let importCount = { new: 0, updated: 0 };  // Track new vs updated players
        
        // Process and merge the data
        for (const row of data) {
            // For JSON files, use direct property names, for Excel use capitalized names
            const playerData = {
                tag: (row.tag || row.Tag || '').trim(),
                aliases: row.aliases || [],  // JSON format might include aliases directly
                paymentMethods: {
                    venmo: (row.paymentMethods?.venmo || row.venmo || row.Venmo || '').trim(),
                    paypal: (row.paymentMethods?.paypal || row.paypal || row.Paypal || '').trim(),
                    zelle: (row.paymentMethods?.zelle || row.zelle || row.Zelle || '').trim()
                },
                notes: (row.notes || row.Notes || '').trim()
            };

            // Skip if no tag provided
            if (!playerData.tag) continue;

            // Check if player already exists (case-insensitive)
            const existingPlayer = existingPlayers.find(p => 
                p.tag.toLowerCase() === playerData.tag.toLowerCase()
            );
            
            if (existingPlayer) {
                // Only update if there's new payment information
                const updatedPlayer = {
                    ...existingPlayer,
                    aliases: [...new Set([...existingPlayer.aliases, ...playerData.aliases])], // Merge aliases
                    paymentMethods: {
                        venmo: playerData.paymentMethods.venmo || existingPlayer.paymentMethods.venmo,
                        paypal: playerData.paymentMethods.paypal || existingPlayer.paymentMethods.paypal,
                        zelle: playerData.paymentMethods.zelle || existingPlayer.paymentMethods.zelle
                    },
                    notes: playerData.notes || existingPlayer.notes
                };

                // Only update if something changed
                if (JSON.stringify(updatedPlayer) !== JSON.stringify(existingPlayer)) {
                    await playerDb.updatePlayer(existingPlayer.tag, updatedPlayer);
                    importCount.updated++;
                }
            } else {
                // Only add if we have at least one payment method or it's a JSON import
                if (fileExtension === 'json' || 
                    playerData.paymentMethods.venmo || 
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


export default router;
