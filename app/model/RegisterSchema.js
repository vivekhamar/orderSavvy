/**************************
 USER SCHEMA FILE INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var userSchema = new Schema({

    email: {
        type: String,
        unique: true
    },
    socialType:{
        type: String,
        enum: ['email','gmail','facebook'],
        default: 'email'   
    },
    socialId: {
        type: String
    },
    password: { 
        type:String
    },
    phoneNo: {
        type:String,
    },
    deviceToken: {
        type:String
    },
    otp: {
        type:String
    },
    forgotToken: {
        type:String
    },
    name: {
        type:String
    },
    profileImg: {
        type:String
    },
    profileThumbnailImg:{
        type:String
    },
    dob: {type: String},
    customer_stripe_id: { type:String },
    last_signedIn: Date,
    isVerified: {type: Boolean, default: false},

    // Orders:[
    //     {
    //         orderId: {type: Schema.Types.ObjectId, ref: 'orders'},
    //     }
    // ],

    // Favorites:[ 
    //     { 
    //         restaurantId:{ type: Schema.Types.ObjectId, ref: 'restaurants'},
    //         createdOn: { type: Date, default: Date.now }, 
    //     }
    // ],

    // Payment:[
    //     {
            
    //     }
    // ],

    createdOn: {type: Date, default: Date.now()},
    modifiedOn: {type: Date, default: Date.now()},

    // isDeleted: {type: Boolean, default: false},
    // userInfo:{
    //     name: {
    //         type:String
    //     },
    //     profileImg: {
    //         type:String
    //     },
    //     dob: {type: String},
    // },
});

var Users = mongoose.model('users', userSchema);

module.exports = {
    Users: Users,
}
