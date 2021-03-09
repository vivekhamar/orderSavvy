/**************************
 LOGIN_DETAIL SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var Login_DetailSchema = new Schema({

    userId:{type: Schema.Types.ObjectId,ref:'login_accounts'},
    role: { type:String, enum:["admin_master","restaurant_master"] },
    status: {type:String, enum:["active","inactive"], default:"inactive" },
    username: { 
        type:String
    },
    password: { 
        type:String
    },
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var Login_Detail = mongoose.model('login_details', Login_DetailSchema);
module.exports = { Login_Detail:Login_Detail }