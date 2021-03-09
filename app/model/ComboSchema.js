/**************************
 COMBO SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var ComboSchema = new Schema({
    
    restaurantId:{type: Schema.Types.ObjectId, ref: 'restaurants'},
    menuId:{type: Schema.Types.ObjectId, ref: 'menu'},////
    name:{type:String},
    type:{type:String,default:"combo"},
    description:{type:String},
    totalPrice:{type:Number},
    profileImg:{type:String},
    profileThumbnailImg:{type:String},
    Item:[
        {
            itemId:{ type: Schema.Types.ObjectId, ref: 'items'},
            name:{type:String},
            price:{type:Number},
            quantity:{type:Number},
            createdOn:{type:Date, default:Date.now()},
            modifiedOn:{type:Date, default:Date.now()}
        }
    ],
    createdOn:{type:Date, default:Date.now},
    modifiedOn:{type:Date, default:Date.now}
});

var Combo = mongoose.model('combos', ComboSchema);
module.exports = { Combo:Combo }