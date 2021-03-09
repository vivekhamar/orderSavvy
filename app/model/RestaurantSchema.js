/**************************
 RESTAURANT SCHEMA FILE INITIALISATION
**************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var restaurantSchema = new Schema({

    email: { type: String },
    name: { type: String },
    openAt: { type: Date },
    closeAt: { type: Date },
    timezone: { type: String },
    // phoneNo:{ type:Number },
    phoneNo: [],
    profileImg: { type: String },
    profileThumbnailImg: { type: String },
    rating: { type: Number },
    // stripe_account: { type:String },
    RestaurantAdminId: { type: Schema.Types.ObjectId, ref: 'login_accounts' },
    status: { type: String },
    createdOn: { type: Date, default: Date.now() },
    modifiedOn: { type: Date, default: Date.now() },
});

var restaurantLocationSchema = mongoose.Schema({

    restaurantId: { type: Schema.Types.ObjectId, ref: 'restaurants' },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postCode: { type: String },
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        createdOn: { type: Date, default: Date.now() },
        modifiedOn: { type: Date, default: Date.now() },
    }

});

var restaurantImagesSchema = mongoose.Schema({

    restaurantId: { type: Schema.Types.ObjectId, ref: 'restaurants' },
    Img: [
        {
            profileImg: { type: String },
            profileThumbnailImg: { type: String },
            createdOn: { type: Date, default: Date.now() },
            modifiedOn: { type: Date, default: Date.now() },
        }
    ]

});

// restaurantSchema.index({ "location": "2dsphere" });
restaurantLocationSchema.index({ "address.location": "2dsphere" });

var Restaurants = mongoose.model('restaurants', restaurantSchema);
var RestaurantLocationInfo = mongoose.model('restaurant_locations', restaurantLocationSchema);
var RestaurantImages = mongoose.model('restaurant_images', restaurantImagesSchema);

module.exports = {
    Restaurants: Restaurants,
    RestaurantLocationInfo: RestaurantLocationInfo,
    RestaurantImages: RestaurantImages
}
