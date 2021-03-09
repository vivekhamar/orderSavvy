var controller = require('../controller/controller');

class user {

    constructor(collection){
        this.collection = collection;
    }

    // get favorites data for user
    FavoriteAggregate(filter){
        return new Promise((resolve,reject) => {
            
            let lookup = { 
                "from" : "restaurants",
                "localField" : "restaurantId",
                "foreignField" : "_id",
                "as" : "resdata" 
            }
            let unwind = "$resdata"
            let lookup1 = {
                "from" : "restaurant_locations",
                "localField" : "resdata._id",
                "foreignField" : "restaurantId",
                "as" : "resdata.locations" 
            };
            let project = {
                _id:0,
                _id: "$restaurantId",
                userId:1,
                name: "$resdata.name",
                rating: "$resdata.rating",
                status: "$resdata.status",
                openAt:"$resdata.openAt",
                closeAt:"$resdata.closeAt",
                phoneNo:"$resdata.phoneNo",
                profileImg:"$resdata.profileImg",
                "locations": "$resdata.locations",
                // "locations.address": "$resdata.locations.address",
            }
            
            let control = new controller(this.collection);
            control.MultiAggregateData(filter, lookup, lookup1, unwind, project).then(data => {
                if(!data) return reject({status:0, message:"Error in aggregating the data"});
                return resolve(data);

            }).catch(error => {
                return reject({status:0, message:error});
            });
        });
    }

    // get user details
    getuser(filter){

        return new Promise((resolve, reject) => {

            this.collection.aggregate(
            // Pipeline
            [
                // Stage 1
                {
                    $match: filter
                },

                // Stage 2
                {
                    $lookup: {
                        "from" : "favorites",
                        "localField" : "_id",
                        "foreignField" : "userId",
                        "as" : "favorites"
                    }
                },

                // Stage 3
                {
                    $project: {
                        __v:0,
                        userId:0,
                        createdOn:0,
                        modifiedOn:0,
                        // otp:0,
                        // deviceToken:0,
                        forgotToken:0,
                        // isVerified:0,
                        last_signedIn:0,
                        // profileImg:0,
                        "favorites.__v":0,
                        "favorites.userId":0,
                        "favorites.createdOn":0,
                        "favorites.modifiedOn":0
                    }
                },

            ], (err, users) => {
                if (err) { return reject({message: err, status: 0 }); }

                return resolve(users);
            });
        });
    }

    // push the participantsdata in foodparty
    PushParticipantsData(filter = {},participantsdata = {}){
        return new Promise((resolve, reject) => {

            this.collection.updateOne(filter,{ $push: {participants : { $each: [participantsdata] } } }, (err, obj) => {
                if (err) { return reject({message: err, status: 0 }); }

                return resolve(obj);
            });
 
        });
    }

    // push the restaurantdata in foodparty
    PushRestaurantData(filter = {},restaurantsdata = {}){
        return new Promise((resolve, reject) => {

            this.collection.updateOne(filter,{ $push: {restaurants : { $each: [restaurantsdata] } } }, (err, obj) => {
                if (err) { return reject({message: err, status: 0 }); }

                return resolve(obj);
            });
    
        });
    }

    // // save-update the data for FoodParty except item
    // FoodPartySaveUpdate(filter,data){
    //     return new Promise((resolve,reject) => {
    //         let participantsdata = [];
    //         let restaurantsdata = [];

    //         if(data.participants){
    //             data.participants.split(',').forEach(x => { participantsdata.push({userId:x}); });
    //             participantsdata.forEach(x => {
    //                 this.PushParticipantsData(filter,x).then(participants => {
    //                     if(_.isEmpty(participants)) return reject({status:0, message:"Error updating Participantsdata"});
                    
    //                 }).catch(error => {
    //                     return reject({status:0, message:error});
    //                 });
    //             });
    //         }

    //         if(data.restaurants){
    //             data.restaurants.split(',').forEach(x => { restaurantsdata.push({restaurantId:x}); });
    //             restaurantsdata.forEach(x => {
    //                 this.PushRestaurantData(filter,x).then(restaurants => {
    //                     if(_.isEmpty(restaurants)) return reject({status:0, message:"Error updating Restaurantdata"});
    
    //                 }).catch(error => {
    //                     return reject({status:0, message:error});
    //                 });
    //             });
    //         }

    //         return resolve({status:1});
    //     });
    // }

    // filter foodparty it for users 
    FoodPartyFilter(foodparty){
        return new Promise((resolve,reject) => {
            foodparty.forEach(Element => {
                Element.total = 0;
                Element.participants.forEach(x => {
                    Element.items.forEach(z => x.Item.forEach(p => {
                        if(p.itemId.equals(z._id)){
                            delete p._id;
                            p._id = z._id
                            p.name = z.name
                            p.restaurantId = z.restaurantId
                        }
                    }));
                    Element.participant.forEach(y => {
                    if(x.userId.equals(y._id)){
                        y.Item = x.Item
                        y.Item.forEach(q => { 
                            Element.total += q.price;
                            // Element.total = parseFloat(Element.total).toFixed(2);
                            delete q.itemId;
                        })
                    }
                })});
                delete Element.items;
                delete Element.participants;
            });
            resolve(foodparty);
        })
    }

    // filter foodparty for admin
    FoodPartyAdminFilter(foodparty){
        return new Promise((resolve,reject) => {
            foodparty.forEach(Element => {
                Element.total = 0;
                Element.participants.forEach(x => {
                    Element.items.forEach(z => x.Item.forEach(p => {
                        if(p.itemId.equals(z._id)){
                            delete p._id;
                            p.item_id = z._id
                            p.item_price = p.price
                            p.item_name = z.name
                            p.restaurantId = z.restaurantId;
                            delete p.price;
                        }
                    }));
                    Element.participant.forEach(y => {
                    if(x.userId.equals(y._id)){
                        y.Item = x.Item
                        y.Item.forEach(q => { 
                            Element.total += q.item_price;
                            delete q.itemId;
                        })
                    }
                })});
                delete Element.items;
                delete Element.participants;
            });
            resolve(foodparty);
        })
    }

    // save-update the foodparty data for participants.items
    ParticipantsItems(filter = {},data = {}){
        return new Promise((resolve,reject) => {
            console.log(data)
            this.collection.updateOne(filter, {$push: {"participants.$.Item" : { $each: [data]}}}, (err, itemdata)  => {
                console.log(itemdata)
                if (err) { return reject({message: err, status: 0 }); }

                return resolve(itemdata);

            });
        });
    }

    // get foodparty aggregate
    getFoodPartyAggregate(filter){
        return new Promise((resolve,reject) => {
            this.collection.aggregate([
                //1
                {
                    $match: filter
                },
                
                //2
                {
                    $lookup: {
                        "from" : "restaurants",
                        "localField" : "restaurants.restaurantId",
                        "foreignField" : "_id",
                        "as" : "restaurants" 
                    } 
                },

                //3
                {
                    $lookup: {
                        "from" : "users",
                        "localField" : "participants.userId",
                        "foreignField" : "_id",
                        "as" : "participant" 
                    } 
                },

                //4
                {
                    $lookup: {
                        "from" : "items",
                        "localField" : "participants.Item.itemId",
                        "foreignField" : "_id",
                        "as" : "items" 
                    } 
                },

                //4
                {
                    $project: {
                        _id:1,
                        orderStatus:1,
                        userId:1,
                        billingScheme:1,
                        createdOn:1,
                        modifiedOn:1,
                        participants:1,
                        items:1,
                        "participant._id":1,
                        "participant.name":1,
                        "participant.profileImg":1,
                        "restaurants._id":1,
                        "restaurants.name":1,
                        "restaurants.profileImg":1,
                    } 
                },
            ],(err, data) => {
                if (err) return reject({message: err, status: 0 }); 
                return resolve(data);
            });
        });
    }

   

}

module.exports = user;

    /////////////////////////////sqlite3 development.db/////////////////////////////////

    // //listing user
    // getusers(){
    //     console.log("inside getuser")
    //     return new Promise((resolve,reject) => {
    //         let query = "Select * from user;"
    //         console.log("sql");
    //         db.serialize(() => {
    //             db.all(query,(err,user) => {
    //                 console.log("ihnuijnini")
    //                 if(err) reject(err);
    //                 // db.close();
    //                 console.log(user)
    //                 resolve(user);
    //             });
    //         });
    //     });
    // }

    // getuser(data){
    //     console.log(data)
    //     return new Promise((resolve,reject) => {
    //        let query =  "Select * from user;"
    //        db.serialize(() => {
    //             db.all(query,(err,user) => {
    //                 console.log("ihnuijnini")
    //                 if(err) reject(err);
    //                 console.log("user")
    //                 user.forEach(element => {
    //                     // console.log("inininini")
    //                     if(element.email == data.email && element.password == data.password){
    //                         console.log("match found")
    //                         resolve(element);
    //                     }
    //                 });
    //             });
    //         });
    //     });
    // }

    // updateuser(data){
    //     return new Promise((resolve,reject) => {
    //         console.log(data.updated_dt)
    //        let query =  "UPDATE user SET updated_dt = '" + data.updated_dt + "' WHERE email = '" + data.email + "';";
    //         console.log(query)
    //        db.serialize(() => {
    //             db.run(query,(error,updata) => {
    //                 if(error) reject(err);
    //                 console.log(updata,"updata")
    //                 resolve(updata);
    //             });
    //         });
    //     });
    // }