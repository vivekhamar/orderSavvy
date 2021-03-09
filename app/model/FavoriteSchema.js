/**************************
 FAVORITE SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var FavoriteSchema = new Schema({

    userId: {type: Schema.Types.ObjectId, ref: 'users'},
    restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var Favorites = mongoose.model('favorites', FavoriteSchema);
module.exports = { Favorites:Favorites }