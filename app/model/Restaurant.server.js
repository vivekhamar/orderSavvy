/**************************
 RESTAURANT SCHEMA FILE INITIALISATION
**************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var restaurantSchema = new Schema({

    email: {
        type: String,
        // unique: true
    },
    name: {
        type:String
    },
    address:{
        type:String
    },
    openAt:{
        type:Date
    },
    closeAt:{
        type:Date
    },
    phoneNo:{
        type:Number,
        // unique: true
    },
    profileImg:{
        type:String
    },
    rating:{ type:Number,set: function (v) { return Math.round(v) ;} },

    location:[
        {
            // branchName:{type:String},
            latitude:{type:String , 
                // unique: true
            },
            longitude:{type:String , 
                // unique: true
            },
        }
    ],

    Menu:[
        {
            name:{ 
                type: String
            },
            categoryId:{ type: Schema.Types.ObjectId, ref: 'category'},
            Item:[
                {
                    name:{
                        type: String 
                    },
                    ingredients:{ 
                        type:String 
                    },
                    img:{
                        type: String,
                    },
                    Mods:[
                        {
                            name:{ type:String },
                            price:{ type: Number },
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
                }
            ],
        }
    ],
    
    Combos:[
        {
            name:{type:String}, 
            foodType:{type:String},
            price:{type:Number},
            Item:[
                {
                    name:{
                        type: String 
                    },
                    ingredients:{ 
                        type:String 
                    },
                    img:{
                        type: String,
                    },
                    Mods:[
                        {
                            name:{ type:String },
                            price:{ type: Number },
                        }
                    ],
                }
            ],
        },
    ],

    // Offers:[
    //     {
    //         name:{type:String},
    //         price:{type:String},
    //         Item:[
    //             {
    //                 name:{
    //                     type: String 
    //                 },
    //                 ingredients:{ 
    //                     type:String 
    //                 },
    //                 Mods:[
    //                     {
    //                         name:{ type:String },
    //                         price:{ type: Number },
    //                     }
    //                 ],
    //             }
    //         ],
    //     }
    // ],

    createdOn: {type: Date, default: Date.now()},
    modifiedOn: {type: Date, default: Date.now()},
});

var Restaurants = mongoose.model('restaurants', restaurantSchema);

module.exports = {
    Restaurants: Restaurants,
}
