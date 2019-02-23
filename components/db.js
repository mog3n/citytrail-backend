var mongoose = require('mongoose');
let url = "";
mongoose.connect(url);

// handle error
db.on('error', (err) => {
	console.warn(err)
});


module.exports = mongoose;