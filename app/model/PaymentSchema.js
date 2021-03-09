/**************************
 PAYMENT SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var PaymentSchema = new Schema({

    userId:{type: Schema.Types.ObjectId,ref:'users'},
    restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
    PaymentIntent: [],
    // state:{type:String},
    // status:{type: String, enum: ['successfull','cancelled']},
    // totalPrice:{ type:Number },
    // Item:[
    //     {
    //         itemId:{type: Schema.Types.ObjectId, ref: 'item'},
    //         quantity:{type:Number},
    //         price:{type:Number}
    //     },
    // ],
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var Orders = mongoose.model('orders', PaymentSchema);
module.exports = { Orders:Orders }