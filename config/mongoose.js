let config = require('./config');
let mongoose = require('mongoose');

var url = config.db;

mongoose.connect(url);
mongoose.connection.on("connected",function(){
    console.log("mongoose is connected on " +url);
});

mongoose.connection.on("error", function(err){
    console.log(err);
});

mongoose.connection.on("disconnected", function(){
    console.log("mongoose is now disconnected");
});

// module.exports = function() {
//     var db = mongoose.connect(config.db, config.mongoDBOptions).then(
//         () => { console.log('MongoDB connected') },
//         (err) => { console.log('MongoDB connection error') }
//     );

//     //Load all Models 
//     // require('../app/models/admin.server.model');
//     // require('../app/models/location.server.model');
//     // require('../app/models/users.server.model');
//     // require('../app/models/authorization.server.model');
    
//     return db;
// };