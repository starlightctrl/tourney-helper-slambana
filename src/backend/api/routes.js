import express from 'express';
import startgg from './startgg.js';
import playerDb from '../database/playerDb.js';

const router = express.Router();

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

export default router;
