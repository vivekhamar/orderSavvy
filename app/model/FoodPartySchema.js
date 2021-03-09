/**************************
 FOODPARTY SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var FoodParty = new Schema({

    userId:{type:String},
    billingScheme:{type:String, enum:["starter","individual"]},
    datetime:{type:Date},
    total:{type:Number},
    participants:[
        { 
            userId: { type: Schema.Types.ObjectId, ref: 'users' },
            Item: [ 
                {
                    itemId: { type: Schema.Types.ObjectId, ref: 'items' },
                    price:{type:Number},
                    quantity:{type:Number},
                    Mods:[
                        {
                            modsId:{type: Schema.Types.ObjectId, ref: 'mods'},
                            name:{type:String},
                            price:{type:Number}
                        }
                    ]
                }
            ],
            Combo:[
                {
                    comboId:{type: Schema.Types.ObjectId, ref: 'combo'},
                    name:{type:String},
                    quantity:{type:Number},
                    price:{type:Number}
                }
            ] 
        }
    ],
    restaurants:[
        {
            restaurantId: { type: Schema.Types.ObjectId, ref: 'restaurants' }
        }
    ],
    orderStatus:{type:String, enum:["inviting","outstanding","finished","payall"], default: "inviting"},
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var FoodParty = mongoose.model('foodparty', FoodParty);
module.exports = { FoodParty:FoodParty }