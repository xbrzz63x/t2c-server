const express = require('express');
const fetch = require('node-fetch');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const URL_BUS = "https://proxy.transport.data.gouv.fr/resource/t2c-clermont-gtfs-rt-trip-update";
// Augmentation de la limite à 2000 pour charger TOUT Clermont d'un coup
const URL_ARRETS = "https://opendata.clermontmetropole.eu/api/explore/v2.1/catalog/datasets/gtfs-smtc/records?limit=2000&select=stop_id%2Cstop_name%2Cstop_lat%2Cstop_lon";

let donneesClermont = [];
let dictionnaireArrets = {};

async function chargerArrets() {
    try {
        const response = await fetch(URL_ARRETS);
        if (response.ok) {
            const data = await response.json();
            if (data && data.results) {
                dictionnaireArrets = {}; // Reset
                data.results.forEach(arret => {
                    if (arret.stop_id && arret.stop_lat && arret.stop_lon) {
                        dictionnaireArrets[arret.stop_id.toUpperCase()] = {
                            nom: arret.stop_name,
                            coords: [parseFloat(arret.stop_lat), parseFloat(arret.stop_lon)]
                        };
                    }
                });
                console.log(`[Arrets] ${Object.keys(dictionnaireArrets).length} arrêts mémorisés.`);
            }
        }
    } catch (e) {
        console.error("Erreur chargement arrêts:", e.message);
    }
}

async function rafraichirDonnees() {
    try {
        const response = await fetch(URL_BUS, { headers: { 'Accept': 'application/x-protobuf' } });
        if (!response.ok) return;

        const buffer = await response.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
        
        let listeBus = [];
        feed.entity.forEach(entity => {
            if (entity.tripUpdate) {
                const tu = entity.tripUpdate;
                const stopIdRaw = tu.stopTimeUpdate && tu.stopTimeUpdate.length > 0 ? tu.stopTimeUpdate[0].stopId.toUpperCase() : null;
                
                if (stopIdRaw) {
                    const idTrouve = Object.keys(dictionnaireArrets).find(id => stopIdRaw.includes(id));
                    
                    // Sécurité : On n'ajoute le bus que si ses coordonnées existent dans notre dictionnaire
                    if (idTrouve && dictionnaireArrets[idTrouve] && dictionnaireArrets[idTrouve].coords) {
                        listeBus.push({
                            route_id: tu.trip.routeId,
                            vehicle_id: tu.vehicle ? tu.vehicle.id : null,
                            stop_id: idTrouve,
                            stop_name: dictionnaireArrets[idTrouve].nom,
                            coords: dictionnaireArrets[idTrouve].coords,
                            arrival_time: tu.stopTimeUpdate[0].arrival ? tu.stopTimeUpdate[0].arrival.time : null
                        });
                    }
                }
            }
        });
        
        donneesClermont = listeBus;
        console.log(`[Bus] ${donneesClermont.length} bus géo-localisés avec succès.`);
    } catch (error) {
        console.error("Erreur décodeur bus:", error.message);
    }
}

async function init() {
    await chargerArrets();
    await rafraichirDonnees();
    setInterval(rafraichirDonnees, 20000);
}
init();

app.get('/api/bus', (req, res) => {
    res.json(donneesClermont);
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));