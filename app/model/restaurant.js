var controller = require('../controller/controller');

class restaurant {

    constructor(collection) {
        this.collection = collection;
    }

    // select choice home aggregate
    CategoryAggregate(filter) {
        return new Promise((resolve, reject) => {

            let lookup = {
                "from": "restaurants",
                "localField": "restaurantId",
                "foreignField": "_id",
                "as": "resdata"
            }
            let unwind = "$resdata";
            let lookup1 = {
                "from": "restaurant_locations",
                "localField": "resdata._id",
                "foreignField": "restaurantId",
                "as": "resdata.locations"
            };
            let project = {
                _id: '$restaurantId',
                userId: 1,
                name: "$resdata.name",
                rating: "$resdata.rating",
                openAt: "$resdata.openAt",
                closeAt: "$resdata.closeAt",
                phoneNo: "$resdata.phoneNo",
                profileImg: "$resdata.profileImg",
                "locations": "$resdata.locations",
            }

            let control = new controller(this.collection);
            control.MultiAggregateData(filter, lookup, lookup1, unwind, project).then(data => {
                if (!data) return reject({ status: 0, message: "Error in aggregating the data" });

                return resolve(data);

            }).catch(error => {
                return reject({ status: 0, message: error });
            });
        });
    }

    // get the restaurant data with location
    GetRestaurants(filter, sort, limit) {
        if (filter.near) {
            return new Promise((resolve, reject) => {
                this.collection.aggregate(
                    // Pipeline
                    [
                        // Stage 1
                        { $geoNear: filter },

                        // Stage 2
                        {
                            $lookup: {
                                "from": "restaurants",
                                "localField": "restaurantId",
                                "foreignField": "_id",
                                "as": "resdata"
                            }
                        },

                        // Stage 3
                        {
                            $unwind: { path: "$resdata", preserveNullAndEmptyArrays: true }
                        },

                        // Stage 4
                        {
                            $project: {
                                _id: "$resdata._id",
                                name: "$resdata.name",
                                email: "$resdata.email",
                                rating: "$resdata.rating",
                                openAt: "$resdata.openAt",
                                closeAt: "$resdata.closeAt",
                                phoneNo: "$resdata.phoneNo",
                                status: "$resdata.status",
                                profileImg: "$resdata.profileImg",
                                address: 1,
                            }
                        },
                    ], (err, restaurant) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(restaurant);
                    });
            });
        }
        if (!filter.near) {
            return new Promise((resolve, reject) => {
                this.collection.aggregate(
                    // Pipeline
                    [
                        // Stage 1
                        { $match: filter },

                        // Stage 2
                        {
                            $lookup: {
                                "from": "restaurant_locations",
                                "localField": "_id",
                                "foreignField": "restaurantId",
                                "as": "locations"
                            }
                        },

                        // Stage 3
                        {
                            $sort: sort
                            // {
                            //     // createdOn: -1,
                            //     rating: -1,
                            // }
                        },

                        // Stage 4
                        { $limit: limit },

                        // Stage 5
                        {
                            $project: {
                                __v: 0,
                                createdOn: 0,
                                modifiedOn: 0,
                                "locations.__v": 0,
                                "locations._id": 0,
                                "locations.type": 0,
                                "locations.restaurantId": 0,
                                "locations.createdOn": 0,
                                "locations.modifiedOn": 0,
                                profileThumbnailImg: 0,
                            }
                        },

                    ], (err, restaurant) => {
                        if (err) { return reject({ message: err, status: 0 }); }
                        return resolve(restaurant);
                    });
            });
        }
    }

    // push images for restaurants
    PushImageData(filter = {}, data = {}) {

        return new Promise((resolve, reject) => {

            this.collection.updateOne(filter, { $push: { Img: { $each: [data] } } }, (err, obj) => {
                console.log(err)
                if (err) { return reject({ message: err, status: 0 }); }

                return resolve(obj);
            });

        });
    }

    // get menu details for restaurant
    MenuAggregate(filter) {
        return new Promise((resolve, reject) => {

            this.collection.aggregate(
                // Pipeline
                [
                    // Stage 1
                    { $match: filter },

                    // Stage 2
                    {
                        $lookup: {
                            "from": "categories",
                            "localField": "_id",
                            "foreignField": "menuId",
                            "as": "categories"
                        }
                    },

                    // Stage 3
                    {
                        $lookup: {
                            "from": "items",
                            "localField": "categories.Item.itemId",
                            "foreignField": "_id",
                            "as": "items"
                        }
                    },

                    // stage
                    {
                        $lookup: {
                            "from": "combos",
                            "localField": "categories.Combo.comboId",
                            "foreignField": "_id",
                            "as": "grpcombos"
                        }
                    },

                    // Stage 4
                    {
                        $lookup: {
                            "from": "combos",
                            "localField": "Combo.comboId",
                            "foreignField": "_id",
                            "as": "combos"
                        }
                    },

                    // Stage 5
                    {
                        $project: {
                            __v: 0,
                            createdOn: 0,
                            modifiedOn: 0,
                            "items.__v": 0,
                            "categories.__v": 0,
                            "categories.createdOn": 0,
                            "categories.modifiedOn": 0,
                            // "categories.profileImg":0,
                            // "categories.combos":"$combos",
                            "combos.__v": 0,
                            "combos.Item._id": 0,
                            // "combos.Item._id":"$combos.Item.itemId",
                            "combos.createdOn": 0,
                            "combos.modifiedOn": 0,
                            "combos.Item.createdOn": 0,
                            "combos.Item.modifiedOn": 0,
                            "combos.profileThumbnailImg": 0,
                            Combo: 0
                        }
                    },

                ], (err, menu) => {
                    console.log(menu)
                    if (err) { return reject({ message: err, status: 0 }); }
                    return resolve(menu);
                });

        });
    }

    // get item as per category filter
    MenuFilter(menu, data) {
        return new Promise((resolve, reject) => {
            menu.forEach(element => {

                let category = element.categories;
                let item = element.items;
                let grpcombo = element.grpcombos;
                let combo = element.combos;
                // resolve([{category:category, item:item, grpcombo:grpcombo, combo:combo}]);
                category.forEach(y => {
                    let insideitemarr = y.Item;
                    let insidecomboarr = y.Combo;

                    console.log(insidecomboarr, "insidecomboarr")
                    console.log(combo, 'commmmo')
                    insideitemarr.forEach(x => item.forEach(z => {
                        if (x.itemId.equals(z._id)) {
                            delete x._id;
                            x._id = z._id;
                            x.rating = z.rating;
                            x.profileImg = z.profileImg;
                            x.description = z.description;
                            x.Mods = z.Mods;
                            // delete x.itemId;
                        }
                    }));
                    if (insidecomboarr != undefined) {
                        insidecomboarr.forEach(x => grpcombo.forEach(z => {
                            if (x.comboId.equals(z._id)) {
                                console.log("match", z);
                                delete x._id;
                                x._id = z._id;
                                x.profileImg = z.profileImg;
                                x.name = z.name;
                                x.description = z.description;
                                x.totalPrice = z.totalPrice;
                                x.type = z.type;
                                x.Item = z.Item;
                            }
                        }))
                    }

                });
                // if(data=='menu'){

                // }
                if (data == 'restaurant' || data == 'menu') {
                    combo.forEach(x => {
                        // x.Item.forEach(z => {z._id = z.itemId; delete z.itemId})
                        category.push(x);
                    });
                    delete element.combos;
                }
                delete element.items;
                delete element.grpcombos;
            });
            resolve(menu);
        })
    }

    // // get menu details for restaurant
    // MenuAggregate(filter){
    //     return new Promise((resolve, reject) => {
    //         this.collection.aggregate(  
    //         // Pipeline
    //         [
    //             // Stage 1
    //             { $match: filter },

    //             // Stage 2
    //             {
    //                 $lookup: {
    //                     "from" : "categories",
    //                     "localField" : "_id",
    //                     "foreignField" : "menuId",
    //                     "as" : "categories"
    //                 }
    //             },

    //             // Stage 3
    //             {
    //                 $lookup: {
    //                     "from" : "items",
    //                     "localField" : "categories._id",
    //                     "foreignField" : "categoryId",
    //                     "as" : "items"
    //                 }
    //             },

    //             // Stage 4
    //             {
    //                 $lookup: {
    //                     "from" : "combos",
    //                     "localField" : "_id",
    //                     "foreignField" : "menuId",
    //                     "as" : "combos"
    //                 }
    //             },

    //             // Stage 5
    //             {
    //                 $project: {
    //                     __v:0,
    //                     createdOn:0,
    //                     modifiedOn:0,
    //                     "items.__v":0,
    //                     "categories.__v":0,
    //                     "categories.createdOn":0,
    //                     "categories.modifiedOn":0,
    //                     // "categories.profileImg":0,
    //                     // "categories.combos":"$combos",
    //                     "combos.__v":0,
    //                     "combos.Item._id":0,
    //                     // "combos.Item._id":"$combos.Item.itemId",
    //                     "combos.createdOn":0,
    //                     "combos.modifiedOn":0,
    //                     "combos.Item.createdOn":0,
    //                     "combos.Item.modifiedOn":0,
    //                 }
    //             },

    //         ], (err, menu) => {
    //             if (err) { return reject({message: err, status: 0 }); }
    //             return resolve(menu);
    //         });

    //     });
    // }

    // // get item as per category filter
    // MenuFilter(menu){
    //     return new Promise((resolve,reject) => {
    //         menu.forEach(element => {

    //             let category = element.categories;
    //             let item = element.items;
    //             let combo = element.combos;

    //             if(category != [] && item != []){
    //                 category.forEach(x => { x.Item = []; });
    //                 category.forEach(y => item.forEach(x => {

    //                     if(x.categoryId.equals(y._id)){
    //                         y.Item.push(x);
    //                     }

    //                 }))
    //                 if(category.items != []){
    //                     delete element.items;
    //                 }
    //             }
    //             combo.forEach(x => {
    //                 x.Item.forEach(z => {z._id = z.itemId; delete z.itemId})
    //                 category.push(x);
    //             });
    //             delete element.combos;
    //         });
    //         resolve(menu);
    //     })
    // }

    // get trending week restaurants
    TrendWeek(filter, limit) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate(
                [
                    {
                        $group: {
                            _id: "$restaurantInfo.restaurantId",
                            // restaurantId: { $sum: { $max : [ "$restaurantId" ] } },
                            // averageQuantity: { $avg: "$quantity" },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            "from": "restaurants",
                            "localField": "_id",
                            "foreignField": "_id",
                            "as": "resdata"
                        }
                    },
                    {
                        $lookup: {
                            "from": "restaurant_locations",
                            "localField": "_id",
                            "foreignField": "restaurantId",
                            "as": "locations"
                        }
                    },
                    { $limit: limit },
                    { $sort: { _id: 1 } },
                    {
                        $project: {
                            _id: 0,
                            "resdata._id": 1,
                            "resdata.name": 1,
                            "resdata.rating": 1,
                            "resdata.openAt": 1,
                            "resdata.closeAt": 1,
                            "resdata.phoneNo": 1,
                            "resdata.profileImg": 1,
                            "resdata.locations": "$locations",
                            // "resdata.locations.address": "$locations.address",
                        }
                    }
                ], (err, restaurants) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    return resolve(restaurants);
                });
        });
    }

    // get aggregate item per categories////////NU
    Grpaggregate(filter) {
        return new Promise((resolve, reject) => {
            this.collection.aggregate(
                // Pipeline
                [
                    // Stage 1
                    { $match: filter },

                    // Stage 2
                    {
                        $lookup: {
                            "from": "items",
                            "localField": "_id",
                            "foreignField": "categoryId",
                            "as": "items"
                        }
                    },

                    {
                        $lookup: {
                            "from": "menus",
                            "localField": "menuId",
                            "foreignField": "_id",
                            "as": "menu"
                        }
                    },

                    // Stage 3
                    {
                        $project: {
                            __v: 0,
                            createdOn: 0,
                            modifiedOn: 0,
                        }
                    },

                ], (err, menu) => {
                    if (err) { return reject({ message: err, status: 0 }); }
                    return resolve(menu);
                });
        });
    }

}

module.exports = restaurant;