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

        // Process and validate the data
        const players = data.map(row => ({
            tag: row.Tag || row.tag,
            aliases: row.Aliases ? row.Aliases.split(',').map(a => a.trim()) : [],
            paymentMethods: {
                venmo: row.Venmo || row.venmo || '',
                paypal: row.PayPal || row.Paypal || row.paypal || '',
                zelle: row.Zelle || row.zelle || ''
            },
            notes: row.Notes || row.notes || ''
        }));

        // Add each player to the database
        for (const player of players) {
            await playerDb.addPlayer(player);
        }

        res.json({ message: 'Import successful', count: players.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
