/**************************
 CATEGORY SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var CategorySchema = new Schema({

    name:{type:String},
    description:{type:String},
    profileImg:{type:String},
    profileThumbnailImg:{type:String},
    restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
    menuId:{ type: Schema.Types.ObjectId, ref: 'menu'},
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()},
    Item:[
        {
            itemId:{ type: Schema.Types.ObjectId, ref: 'items'},
            name:{type:String},
            price:{type:Number}
        }
    ],
    Combo:[
        {
            comboId: { type: Schema.Types.ObjectId, ref: 'combos' },
            name:{type:String},
            price:{type:Number}
        }
    ]
});

var Category = mongoose.model('category', CategorySchema);
module.exports = { Category:Category }