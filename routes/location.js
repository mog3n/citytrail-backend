var express = require('express');
var router = express.Router();
const googleMapsClient = require('../googlemaps');


// routes

router.get('/', function(req, res, next) {
    res.send('lol');
});

router.post('/search', ((req, res, next) => {
    // query
    const { query } = req.body;
    find_location(query)
        .then(data => {

            // FILTER DATA
            filter_search(data)
                // GET FILTER DATA RESULTS
                .then((filter_result) => {
                    res.status(200).send(filter_result)
                })
                // CATCH FILTER DATA ERROR
                .catch(err=> res.status(200).send(err));


        })
        .catch(err => {
            // CATCH FIND_LOCATION ERROR
            res.status(200).send(err);
        })
}));


router.get('/search', ((req, res, next) => {
    res.send('meme review');
}));

// actions
const find_location = (query) => {
    return new Promise((resolve, reject) => {
        console.log("Getting " + query);

        // Get places
        googleMapsClient.places({
            query
        },
            function(err, data){
                if (err) reject(err);
                resolve(data);
            })
    })
};

const filter_search = (data) => {
    return new Promise((resolve, reject) => {

        var list_of_places = [];

        for(const place_index in data.json.results){
            const place = data.json.results[place_index];
            const {
                formatted_address,
                geometry,
                name,
                place_id,
                rating
            } = place;

            list_of_places.push({
                name,
                formatted_address,
                location: geometry.location,
                place_id,
                rating
            })
        }

        // Return array
        resolve(list_of_places);

    })
};



module.exports = router;