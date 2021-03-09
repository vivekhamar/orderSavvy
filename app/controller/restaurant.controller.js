var _ = require('lodash');
var validator = require("email-validator");
let ObjectId = require('mongodb').ObjectID;
var RestaurantSchema = require('../model/RestaurantSchema').Restaurants;
var CategorySchema = require('../model/CategorySchema').Category;
var controller = require('../controller/controller');
var Form = require('../service/Form');
var File = require('../service/File');
var restaurantjs = require('../model/restaurant');
var RestaurantLocationSchema = require('../model/RestaurantSchema').RestaurantLocationInfo;
var RestaurantImageSchema = require('../model/RestaurantSchema').RestaurantImages;
var MenuSchema = require('../model/MenuSchema').Menu;
var OrderSchema = require('../model/OrderSchema').Orders;

class RestaurantControl {

    // get the restaurant list as per the category
    Categories(req, res) {

        let category = req.params[0];
        if (!category) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { name: category };
        let control = new restaurantjs(CategorySchema);
        control.CategoryAggregate(filter).then(data => {
            if (!data) return res.send({ status: 0, message: "this category has no restaurants yet!!" });

            return res.send({ status: 1, message: "Restaurants successfully found", restaurant: data });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // search restaurant by name
    SearchRestaurants(req, res) {

        let searchName = req.params[0];
        if (!searchName) return res.send({ status: 0, message: "Search Empty!!" });

        let searchText = new RegExp(searchName, "i")
        let filter = { name: searchText };
        let sort = { createdOn: -1 };
        let limit = 10;
        let control = new restaurantjs(RestaurantSchema);
        control.GetRestaurants(filter, sort, limit).then(restaurants => {
            if (_.isEmpty(restaurants)) return res.send({ status: 0, message: "No Restaurants found." });

            return res.send({ status: 1, message: "Restaurants List searched successfully", restaurants: restaurants });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get nearBy restaurant list with in 10km 
    NearBy(req, res) {

        let lat = req.lat;
        let lon = req.lon;
        let filter = {
            near: { type: "Point", coordinates: [Number(lon), Number(lat)] },
            distanceField: "dist.calculated",
            minDistance: 0,
            maxDistance: 1000000,
            // includeLocs: "dist.location",
            spherical: true
        };
        let sort = {};
        let limit = 10;

        let control = new restaurantjs(RestaurantLocationSchema);
        control.GetRestaurants(filter, sort, limit).then(restaurants => {
            if (_.isEmpty(restaurants)) return res.send({ status: 0, message: "No Restaurants found." });

            return res.send({ status: 1, message: "Nearby Restaurants are found successfully", restaurants: restaurants });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // get the home page list data
    HomeList(req, res) {

        // SelectChoice data
        CategorySchema.aggregate([{ $group: { _id: '$name', profileImg: { $addToSet: "$profileImg" } } }, { $unwind: "$profileImg" }, { $limit: 10 }, { $project: { _id: 0, name: "$_id", profileImg: 1 } }], (err, choice) => {

            if (_.isEmpty(choice)) return res.send({ status: 0, message: "No choices Found." });

            // PopularPlaces data
            let filter = {};
            let sort = { rating: -1 }
            let limit = 10;
            let control = new restaurantjs(RestaurantSchema);
            control.GetRestaurants(filter, sort, limit).then(async (restaurant) => {
                if (_.isEmpty(restaurant)) return res.send({ status: 0, message: "No restaurant found." });
                let Pres = [];
                await restaurant.forEach(x => {
                    if (Pres.length != 5) {
                        Pres.push(x);
                    }
                });
                // TrendingWeek data
                let filter = {};
                let control = new restaurantjs(OrderSchema);
                control.TrendWeek(filter, 5).then(async (Trestaurant) => {
                    if (_.isEmpty(Trestaurant)) return res.send({ status: 0, message: "No restaurants found." });
                    let data = [];
                    await Trestaurant.forEach(x => {
                        data.push(x.resdata[0]);
                    });

                    // Collections data
                    let filter = {};
                    let sort = { createdOn: -1 }
                    let limit = 10;
                    let control = new restaurantjs(RestaurantSchema);
                    control.GetRestaurants(filter, sort, limit).then(async (crestaurant) => {
                        if (_.isEmpty(crestaurant)) return res.send({ status: 0, message: "No restaurant found." });
                        let Cres = [];
                        await restaurant.forEach(x => {
                            if (Cres.length != 5) {
                                Cres.push(x);
                            }
                        });

                        return res.send({ status: 1, message: "Home Data Found.", choice: choice, popularplace: Pres, trendingweek: data, collections: Cres });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get the category name limit 10
    SelectChoice(req, res) {
        CategorySchema.aggregate([{ $group: { _id: '$name', profileThumbnailImg: { $addToSet: "$profileThumbnailImg" } } }, { $unwind: "$profileThumbnailImg" }, { $limit: 10 }, { $project: { _id: 0, name: "$_id", profileThumbnailImg: 1 } }], (err, data) => {
            if (err) return res.send({ message: err, status: 0 });

            return res.send({ status: 1, message: "Category successfully found", data: data });
        });
    }

    // get popular restaurant list by ratings limit 10
    PopularPlaces(req, res) {
        let filter = {};
        let sort = { rating: -1 };
        let limit = 10;
        let control = new restaurantjs(RestaurantSchema);
        control.GetRestaurants(filter, sort, limit).then(restaurant => {
            if (_.isEmpty(restaurant)) return res.send({ status: 0, message: "No restaurant found." });

            return res.send({ status: 1, message: "Restaurant are found", restaurant: restaurant });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get trending restaurant list by orders limit 10
    TrendingWeek(req, res) {
        let filter = {};
        let control = new restaurantjs(OrderSchema);
        control.TrendWeek(filter, 10).then(async (restaurant) => {
            if (_.isEmpty(restaurant)) return res.send({ status: 0, message: "No restaurants found." });
            let data = [];
            await restaurant.forEach(x => {
                data.push(x.resdata[0]);
            });
            return res.send({ status: 1, message: "Restaurant found.", restaurant: data })

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get the restaurant list by createdOn limit 10
    Collections(req, res) {
        let filter = {};
        let sort = { createdOn: -1 };
        let limit = 10;
        let control = new restaurantjs(RestaurantSchema);
        control.GetRestaurants(filter, sort, limit).then(restaurant => {
            if (_.isEmpty(restaurant)) return res.send({ status: 0, message: "No restaurant found." });

            return res.send({ status: 1, message: "Restaurant are found", restaurant: restaurant });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get the restaurant details 
    RestaurantDetail(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { _id: ObjectId(req.params[0]) };
        let sort = { createdOn: -1 };
        let limit = 10;
        let control = new restaurantjs(RestaurantSchema);

        control.GetRestaurants(filter, sort, limit).then(restaurant => {
            if (_.isEmpty(restaurant)) return res.send({ status: 0, message: "No restaurant found." });

            return res.send({ status: 1, message: "Restaurant is found", restaurants: restaurant });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get restaurant images
    GetResImages(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let projection = { "Img.profileImg": 1, "Img._id": 1 };

        let control = new controller(RestaurantImageSchema);
        control.GetData(filter, projection).then(images => {
            if (_.isEmpty(images)) return res.send({ status: 0, message: "No Images found" });

            return res.send({ status: 1, message: "Images are found", images: images.Img });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get restaurant menu
    GetResMenu(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let control = new restaurantjs(MenuSchema);

        control.MenuAggregate(filter).then(menu => {
            if (_.isEmpty(menu)) return res.send({ status: 0, message: "Menu not found." });

            control.MenuFilter(menu, 'restaurant').then(menu => {
                if (_.isEmpty(menu)) throw "Error in filtering the menu data";

                return res.send({ status: 1, message: "Menu found.", menu: menu });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

}

module.exports = RestaurantControl;

//nearBy data for location without res details
// let filter = {
//     "address.location": {
//         $near: {
//             $minDistance:0,
//             $maxDistance: 1000000, //10km
//             $geometry: {
//                 type: "Point",
//                 coordinates: [Number(lon), Number(lat)]
//             }
//         }
//     }
// }
// let projection = {__v:0,createdOn:0,modifiedOn:0};
// let control = new controller(RestaurantLocationSchema);
// control.GetMultiData(filter,projection).then(restaurants => {
//     if(_.isEmpty(restaurants)) return res.send({status:0, message:"No Restaurants found."});

//     return res.send({status:1, message:"Nearby Restaurants are found successfully", restaurants:restaurants});

// }).catch(error => {
//     return res.send({status:0, message:error});
// });