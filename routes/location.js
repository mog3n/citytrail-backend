var express = require('express');
var router = express.Router();
const {googleMapsClient, key} = require('../googlemaps');
const axios = require('axios');


//################################################### routes

router.get('/', function(req, res, next) {
    res.json('lol');
});

router.post('/search', ((req, res, next) => {
    // query
    //console.log(find_cool_places(['ChIJLU7jZClu5kcR4PcOOO6p3I0']));

    const { query } = req.body;
    find_location(query)
        .then(data => {

            // FILTER DATA
            filter_search(data)
                // GET FILTER DATA RESULTS
                .then((filter_result) => {
                    res.status(200).json(filter_result)
                })
                // CATCH FILTER DATA ERROR
                .catch(err=> res.status(400).json(err));


        })
        .catch(err => {
            // CATCH FIND_LOCATION ERROR
            res.status(200).json(err);
        })
}));

router.post("/compute", async function(req,res,next){
    // compute
    let { locations } = req.body;
    console.warn(req.body);
    console.warn(typeof req.body);
    console.warn(typeof req.body.locations);

    //console.log(locations);
    const locationstr = '{"locations": ' + locations + '}';
    const locations_arr = JSON.parse(locationstr).locations;
    // CHECK IF THE INPut is an array of placeid
    if (!Array.isArray(locations) && locations.length<2) {
        res.status(200).json({success: false, error: 'I need two location inputs'});
    }

    const cool_places = await find_cool_places(locations_arr);
    res.status(200).json(cool_places);

});


router.get('/search', ((req, res, next) => {
    res.status(200).json(JSON.stringify({hello: 'general kenobi'}));
}));

// ####################################################### actions

async function find_cool_places (list_of_places) {
    // LOOP THROUGH LIST OF PLACES AND FIND NEARBY PLACES
    const list_of_locations = [];

    for(let placeid of list_of_places){
        console.log(placeid);

        // FIND THE PLACE'S GEOLOCATION
        let place;
        try{
            const url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' +placeid
                + "&key=" + key;
            //console.log(url);
            place = await axios.get(url);
            place = place.data;
        }catch (err) {
            console.warn(err);
        }

        //console.log(place.result);
        const location = place.result.geometry.location;
        const { geometry, name, place_id, rating, url, website, vicinity } = place.result;

        //cleaned_place = place.result;

        // GET CITY AND COUNTRY AND EMOJI
        let city, country;
        for(let comp of place.result.address_components) {
            switch(comp.types[0]){
                case "locality":
                    city = comp.long_name;
                    break;
                case "country":
                    country = comp.long_name;
            }
        }

        cleaned_place = {
                city,
                country,
                address: vicinity,
                geometry,
                name,
                place_id,
                rating,
                url,
                website
        };


        // STORE THIS NEAT LITTLE GUY IN A DICTIONARY
        let this_location = {
            place: cleaned_place,
            nearby: null,
        };
        const nearby_data = await find_nearby(location);
        this_location.nearby = nearby_data;

        // Add this location and its nearby points of interest to the list of locations
        list_of_locations.push(this_location);
    }


    return list_of_locations;
}

const find_nearby = (location) => {
    return new Promise((resolve, reject) => {
        // GET GEO LOCATION FOR PLACE ID

        const types = ['restaurant'];

        // FIND NEARBY PLACES
        googleMapsClient.placesNearby({
            location: [location.lat, location.lng],
            type: types[0],
            radius: 888,
            rankby: 'prominence',
        }, (err, nearby_response) => {
            if (err) console.log(err.json);
            const nearby = nearby_response.json.results;
            const nearby_filtered = [];

            for (i=0;i<nearby.length;i++){
                const nearby_place = nearby[i];
                const { geometry, name, place_id, rating, user_ratings_total, vicinity } = nearby_place;
                nearby_filtered.push({
                    geometry,
                    name,place_id,rating,user_ratings_total,vicinity
                });
            }
            resolve(nearby_filtered);
        })
    });


};

async function get_city_country (placeid) {
    let place;
    try{
        const url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' +placeid
            + "&key=" + key;
        //console.log(url);
        place = await axios.get(url);
        place = place.data;
    }catch (err) {
        console.warn(err);
    }


    //console.log(place.result);
    const location = place.result.geometry.location;
    const { geometry, name, place_id, rating, url, website } = place.result;

    //cleaned_place = place.result;

    // GET CITY AND COUNTRY AND EMOJI
    let city, country;
    for(let comp of place.result.address_components) {
        switch(comp.types[0]){
            case "locality":
                city = comp.long_name;
                break;
            case "country":
                country = comp.long_name;
        }
    }

    return ({country, city});
}


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

function filter_search (data) {
    return new Promise( async function(resolve, reject) {
        if (data.json.status === "ZERO_RESULTS") {
            reject({error: true})
        }
        var list_of_places = [];

        for(const place_index in data.json.results){
            const place = data.json.results[place_index];
            const {
                formatted_address,
                geometry,
                name,
                place_id,
                rating,
            } = place;

            // get country
            const countrycity = await get_city_country(place_id);
            console.log(data.json);

            list_of_places.push({
                name,
                formatted_address,
                location: geometry.location,
                place_id,
                rating,
                ...countrycity
            })
        }

        // Return array
        resolve({places: list_of_places});

    });
};





module.exports = router;