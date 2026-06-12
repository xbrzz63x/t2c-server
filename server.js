const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
// URL alternative testée en direct : pas de bouclier Cloudflare anti-bot sur ce point d'accès
const URL_T2C_ALTERNATIVE = "https://www.t2c.fr/sites/default/files/positions/positions.txt";

app.get('/api/bus', async (req, res) => {
    try {
        const response = await fetch(URL_T2C_ALTERNATIVE, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Erreur T2C (${response.status})` });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send("Serveur T2C opérationnel. Allez sur /api/bus");
});

app.listen(PORT, () => console.log(`Serveur de test validé sur le port ${PORT}`));