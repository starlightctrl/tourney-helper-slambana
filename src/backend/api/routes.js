const express = require('express');
const router = express.Router();
const startgg = require('./startgg');

router.get('/tournament/:slug', async (req, res) => {
    try {
        const data = await startgg.getTournamentData(req.params.slug);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
