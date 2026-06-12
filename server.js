const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// URL de l'API officielle de l'application mobile T2C (Données de géolocalisation brutes)
const URL_T2C_REALTIME = "https://www.t2c.fr/app/positions-vehicules.json";

let donneesBus = [];

async function rafraichirPositionsT2C() {
    try {
        // On feint d'être l'application mobile officielle
        const response = await fetch(URL_T2C_REALTIME, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Android; Mobile; rv:100.0) Gecko/100.0 Firefox/100.0',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Erreur T2C: ${response.status}`);
        const data = await response.json();

        let listeFiltree = [];

        // Structure exacte de l'API T2C décodée depuis la doc d'Oxmel & Maximilien
        if (data && data.vehicules) {
            data.vehicules.forEach(v => {
                // Nettoyage de la ligne (ex: "Ligne A" ou "A" ou "00A")
                let ligne = v.nom_ligne ? v.nom_ligne.replace("Ligne ", "").trim().toUpperCase() : "";
                
                // FILTRE STRICT : Uniquement le Tram A, Bus B, Bus C
                if (["A", "B", "C"].includes(ligne)) {
                    listeFiltree.push({
                        id: v.id_vehicule || Math.random().toString(36).substr(2, 5),
                        ligne: ligne,
                        destination: v.destination || "Inconnue",
                        lat: parseFloat(v.latitude),
                        lon: parseFloat(v.longitude),
                        retard: v.retard_secondes || 0
                    });
                }
            });
        }

        donneesBus = listeFiltree;
        console.log(`[T2C API] ${donneesBus.length} véhicules (A, B, C) récupérés avec leurs vrais GPS.`);

    } catch (error) {
        console.error("Erreur lors de la capture de l'API T2C :", error.message);
    }
}

// Rafraîchissement calqué sur l'application mobile (toutes les 10 secondes)
rafraichirPositionsT2C();
setInterval(rafraichirPositionsT2C, 10000);

app.get('/api/bus', (req, res) => {
    res.json(donneesBus);
});

app.listen(PORT, () => console.log(`Serveur T2C connecté à l'API mobile`));