/**************************
 AuthToken SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var AuthTokenSchema = new Schema({

    userId:{type: Schema.Types.ObjectId,ref:'users'},
    token:String,
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var AuthToken = mongoose.model('authtoken', AuthTokenSchema);
module.exports = { AuthToken:AuthToken }