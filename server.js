const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const URL_T2C_REALTIME = "https://www.t2c.fr/app/positions-vehicules.json";

app.get('/api/bus', async (req, res) => {
    try {
        const response = await fetch(URL_T2C_REALTIME, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Android; Mobile; rv:100.0) Gecko/100.0 Firefox/100.0',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) return res.status(response.status).json({ error: "Erreur T2C" });
        
        const data = await response.json();
        // On envoie la totalité du fichier brut de l'appli T2C à Netlify
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Passerelle T2C Active`));