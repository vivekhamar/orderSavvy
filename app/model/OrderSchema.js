/**************************
 Order SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var OrderSchema = new Schema({

    userId:{type: Schema.Types.ObjectId,ref:'users'},
    type:{type:String, enum: ['individual','foodparty']},
    foodpartyId:{type:  Schema.Types.ObjectId,ref:'orders'},
    name:{type:String},
    status:{type: String, enum: ['successfull','cancelled','queued','pending','preparing','ready']},
    ordertotalPrice:{ type:Number },
    payment_mode:{type:String, enum:['cash','card']},
    restaurantInfo:[
        {
            restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
            name:{ type:String },
            rating:{ type:String },
            totalPrice:{ type:Number },
            Item:[
                {
                    itemId:{type: Schema.Types.ObjectId, ref: 'item'},
                    name:{type:String},
                    quantity:{type:Number},
                    price:{type:Number},
                    Mods:[
                        {
                            modsId:{type: Schema.Types.ObjectId, ref: 'mods'},
                            name:{type:String},
                            price:{type:Number}
                        }
                    ]
                },
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
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var Orders = mongoose.model('orders', OrderSchema);
module.exports = { Orders:Orders }