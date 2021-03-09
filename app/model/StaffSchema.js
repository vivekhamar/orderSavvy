/**************************
 STAFF SCHEMA FILE INITIALISATION
**************************/ 
var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var StaffSchema = new Schema({

    role:{type:String, enum:["owner","staff"]},
    restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
    profileImg:{type:String},
    profileThumbnailImg:{type:String},
    name:{type:String},
    username:{type:String},
    phoneNo:{type:Number},
    email:{type:String},
    password:{type:String},
    deviceToken: {type:String},
    forgotToken:{type:String},
    last_signedIn: Date,
    createdOn:{type:Date, default:Date.now()},
    modifiedOn:{type:Date, default:Date.now()}
});

var Staff = mongoose.model('staff', StaffSchema);
module.exports = { Staff:Staff }