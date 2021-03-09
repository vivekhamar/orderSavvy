/**************************
 ITEM SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var ItemSchema = new Schema({

    // Item:[
        // {
            // menuId:{type: Schema.Types.ObjectId, ref: 'menu'},
            restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
            categoryId:{ type: Schema.Types.ObjectId, ref: 'category'},////
            name:{ type: String },
            description:{ type: String },
            ingredients:{ type:String },
            profileImg:{type:String},
            profileThumbnailImg:{type:String},
            price:{ type:Number },
            rating:{ type: Number},
            Mods:[
                {
                    modsId:{ type: Schema.Types.ObjectId, ref: 'mods'},
                    name:{ type:String },
                    price:{ type: Number },
                    createdOn: {type: Date, default: Date.now()},
                    modifiedOn: {type: Date, default: Date.now()},
                }
            ],
            Review:[
                {
                    userName: {type:String},
                    review: {type:String},
                    createdOn: {type: Date, default: Date.now()},
                    modifiedOn: {type: Date, default: Date.now()},
                }
            ], 
        // }
    // ],
});

var Item = mongoose.model('item', ItemSchema);
module.exports = { Item:Item }