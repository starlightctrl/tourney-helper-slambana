import express from 'express';
import startgg from './startgg.js';

const router = express.Router();

router.get('/tournament/:slug', async (req, res) => {
    try {
        const data = await startgg.getTournamentData(req.params.slug);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
