const express = require('express');
const fetch = require('node-fetch');
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const URL_T2C = "https://proxy.transport.data.gouv.fr/resource/t2c-clermont-gtfs-rt-trip-update";

let donneesClermont = [];

async function rafraichirDonnees() {
    try {
        const response = await fetch(URL_T2C, {
            headers: { 'Accept': 'application/x-protobuf' }
        });
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

        const buffer = await response.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
        
        let listeBus = [];
        feed.entity.forEach(entity => {
            if (entity.tripUpdate) {
                const tu = entity.tripUpdate;
                listeBus.push({
                    route_id: tu.trip.routeId,
                    vehicle_id: tu.vehicle ? tu.vehicle.id : "T2C",
                    stop_id: tu.stopTimeUpdate && tu.stopTimeUpdate.length > 0 ? tu.stopTimeUpdate[0].stopId : null,
                    arrival_time: tu.stopTimeUpdate && tu.stopTimeUpdate.length > 0 && tu.stopTimeUpdate[0].arrival ? tu.stopTimeUpdate[0].arrival.time : null
                });
            }
        });
        
        donneesClermont = listeBus;
        console.log(`[${new Date().toISOString()}] Synchro T2C réussie : ${donneesClermont.length} véhicules.`);
    } catch (error) {
        console.error("Échec de la récupération T2C :", error.message);
    }
}

// Récupération toutes les 20 secondes
rafraichirDonnees();
setInterval(rafraichirDonnees, 20000);

app.get('/api/bus', (req, res) => {
    res.json(donneesClermont);
});

app.listen(PORT, () => {
    console.log(`Serveur T2C actif sur le port ${PORT}`);
});