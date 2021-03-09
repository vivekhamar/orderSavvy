/**************************
 LOGIN_ACCOUNT SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var Login_AccountSchema = new Schema({

    name: { type:String },
    email: {
        type: String,
        unique: true
    },
    forgotToken: {
        type:String
    },
    profileImg: {
        type:String
    },
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var Login_Account = mongoose.model('login_accounts', Login_AccountSchema);
module.exports = { Login_Account:Login_Account }