/**************************
 MENU SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var MenuSchema = new Schema({

    restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants' },
    name:{ type: String },
    description:{ type: String },
    // categoryId:{ type: Schema.Types.ObjectId, ref: 'category'},///
    profileImg:{type:String},
    profileThumbnailImg:{type:String},
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()},
    Combo:[
        {
            comboId: { type: Schema.Types.ObjectId, ref: 'combos' },
            name:{type:String},
            price:{type:Number}
        }
    ]
});

var Menu = mongoose.model('menu', MenuSchema);
module.exports = { Menu:Menu }