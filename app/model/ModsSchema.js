/**************************
 MODS SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var ModsSchema = new Schema({

    restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants' },
    name:{ type: String },
    description:{ type: String },
    price:{ type:Number },
    profileImg:{type:String},
    profileThumbnailImg:{type:String},
    createdOn:{type:Date, default:Date.now},
    modifiedOn:{type:Date, default:Date.now}
});

var Mods = mongoose.model('mods', ModsSchema);
module.exports = { Mods:Mods }