/**************************
 ORDER HISTORY SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var OrderHistorySchema = new Schema({

    orderId:{type: Schema.Types.ObjectId,ref:'orders'},
    status:{type:String},
    modifiedOn:{type:Date, default:Date.now()},
    createdOn:{type:Date, default:Date.now()},
});

var OrderHistory = mongoose.model('order_history', OrderHistorySchema);
module.exports = { OrderHistory:OrderHistory }