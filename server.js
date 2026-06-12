const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // C'est cette ligne qui débloque la sécurité pour Netlify !

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
        res.json(data); // On envoie le JSON brut de l'appli T2C
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Serveur T2C en ligne`));