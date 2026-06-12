const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const URL_T2C_REALTIME = "https://www.t2c.fr/app/positions-vehicules.json";

// On écoute l'adresse avec ou sans /api/bus pour être compatible avec tous tes tests
const handler = async (req, res) => {
    try {
        const response = await fetch(URL_T2C_REALTIME, {
            method: 'GET',
            headers: {
                'User-Agent': 'okhttp/4.9.2', // Le moteur réseau officiel de l'application Android T2C
                'Accept': 'application/json',
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'Connection': 'keep-alive'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Erreur T2C Serveur (Code ${response.status})` 
            });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

app.get('/', handler);
app.get('/api/bus', handler);

app.listen(PORT, () => console.log("Passerelle Camouflée T2C Active"));
// Force deploy
