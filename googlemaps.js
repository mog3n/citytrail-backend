
const key = 'AIzaSyCFlDGfonHhuiuMxfaTBXnfUGlZKQ_YRUk';

const googleMapsClient = require('@google/maps').createClient({
    key
});


module.exports = { googleMapsClient, key };