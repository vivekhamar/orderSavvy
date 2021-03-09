var _ = require('lodash');
var controller = require('../controller/controller');
let ObjectId = require('mongodb').ObjectID;
var OrderSchema = require('../model/OrderSchema').Orders;
var StripeControl = require('../controller/Stripe.controller');
var Notification = require('../service/FCM-Notification');
var StaffSchema = require('../model/StaffSchema').Staff;
var UserSchema = require('../model/RegisterSchema').Users;
var RestaurantSchema = require('../model/RestaurantSchema').Restaurants;
var FoodPartySchema = require('../model/FoodPartySchema').FoodParty;
var OrderHistory = require('../model/OrderHistorySchema').OrderHistory;

class OrderControl {

    // {
    //     "_id": ObjectId("5e12cb0cb4cd4807c410a9ae"),
    //     "participants": {
    //         "$elemMatch": {
    //             "userId": ObjectId("5d6f5aad92138527c0b1fe55")
    //         }
    //     }
    // },
    // { "$set": { 
    //     "participants.$[outer].Item": { "itemId":ObjectId("5d79f495b49d972067adaaf4")},
    // } },
    // { "arrayFilters": [
    //     { "outer.oid": ObjectId("5d6f5aad92138527c0b1fe55") },
    // ] }


    // make order for user  
    async MakeOrders(req,res){

        if(!req.userId || !req.restaurantInfo || !req.ordertotalprice || !req.type) return res.send({status:0, message:"Enter the valid credentials"});

        let promise = new Promise((resolve) => {
            let itemids = [];
            let comboids = [];
            let filter = { _id: ObjectId(req.userId) };
            let projection = {name:1};
            let control = new controller(UserSchema);
            control.GetData(filter,projection).then(userdata => {
                if(!userdata) throw "Error in getting the user data.";
                req.name = userdata.name;
                // console.log(req,"req")
            });
            req.restaurantInfo.forEach((x) => {
                let filter = { _id:x.restaurantId };
                let projection = {name:1,rating:1};
                let control = new controller(RestaurantSchema);
                control.GetData(filter,projection).then(resdata => {
                    if(_.isEmpty(resdata)) throw "Error in getting the restaurant data";
                    x.name = resdata.name;
                    x.rating = resdata.rating;

                    //adding the items in foodparty===>start
                    if(req.type == "foodparty" && req.foodpartyId){
                        x.Item.forEach(itemid => itemids.push({ itemId:itemid.itemId,price:itemid.price,quantity:itemid.quantity,Mods:itemid.Mods }));
                        x.Combo.forEach(comboid => comboids.push({ comboId:comboid.comboId,name:comboid.name,price:comboid.price,quantity:comboid.quantity }));
                        console.log(itemids,"itemids");
                        console.log(comboids,"comboids");
                        let filter = { _id:ObjectId(req.foodpartyId) };
                        let projection = {};
                        let control = new controller(FoodPartySchema);
                        control.GetData(filter,projection).then(check => {
                            console.log(check,"check");
                            if(_.isEmpty(check)) return res.send({status:0, message:"No foodparty exists with this id"});
                            check.participants.forEach(x => {
                                if(x.userId.equals(req.userId)){
                                    console.log("match found",x.Item);
                                    let filter = { _id:req.foodpartyId, participants:{"$elemMatch": {userId:req.userId} } };
                                    let setdata = {"participants.$.Item": itemids, "participants.$.Combo": comboids};
                                    control.UpdateData(filter,setdata).then(foodparty => {
                                        console.log(foodparty,"foodparty")
                                        if(_.isEmpty(foodparty)) return res.send({status:0, message:"foodparty is not updated for participants items"});

                                    }).catch(error => {
                                        return res.send({status:0, message:error});
                                    });
                                }
                            });

                        }).catch(error => {
                            return res.send({status:0, message:error});
                        });
                    }
                    //adding the items in foodparty===>end

                    return resolve(null)
                }).catch(error => {
                    return reject({status:0, message:error});
                });
            });
        });
        
        promise.then(y => {
            let orderdata;
            if(req.type == "individual"){
                orderdata = {
                    // restaurantId : req.restaurantId,
                    // Item : req.item,
                    userId : req.userId,
                    name: req.name,
                    type: req.type,
                    ordertotalPrice : parseFloat(req.ordertotalprice).toFixed(2),
                    status:"pending",
                    restaurantInfo: req.restaurantInfo,
                    payment_mode: req.payment_mode,
                };
            }
            else if(req.type == "foodparty"){
                orderdata = {
                    userId : req.userId,
                    name: req.name,
                    type: req.type,
                    foodpartyId:req.foodpartyId,
                    ordertotalPrice : parseFloat(req.ordertotalprice).toFixed(2),
                    status:"queued",
                    restaurantInfo: req.restaurantInfo,
                    payment_mode: req.payment_mode,
                };
            }

            
            let control = new controller(OrderSchema);
            control.SaveData(orderdata).then(order => {
                if(_.isEmpty(order)) return res.send({status:0, message:"Error in ordering Plz.. try again later"});
                
                // store the order history record ===> start
                let historydata = { orderId:ObjectId(order._id),status:order.status }
                let control = new controller(OrderHistory);
                console.log(historydata,"historydata")
                control.SaveData(historydata).then(history => {
                    if(_.isEmpty(history)) return res.send({status:0, message:"Error in saving the order history data"});
                    console.log("Order history saved");
                }).catch(error => {
                    return res.send({status:0, message:error});
                });
                // store the order history record ===> end

                // notify restaurant for orders
                if(order.status == 'pending'){
                    req.restaurantInfo.forEach(ids => {
                        let filter = { "restaurantId": ObjectId(ids.restaurantId), role:"owner" };
                        let projection = { deviceToken:1 };
                        let control = new controller(StaffSchema);
                        control.GetMultiData(filter,projection).then(data => {
                            if(!data) throw "Error in getting the restaurant deviceToken";
                            
                            data.forEach(x => {
                                if(x.deviceToken){
                                    let message = { to: x.deviceToken , notification: {
                                        title: 'New Order', 
                                        body: 'You recieved new order.' 
                                    }, data: {
                                        type: 'order',
                                        status: orderdata.status
                                    }};
                                    let notify = new Notification();
                                    notify.PushNotification(message);
                                }
                            });
                            let d = new Date();
                            console.log('current Date',d);
                            return res.send({status:1, message:"Order is placed Successfully"});
            
                        }).catch(error => {
                            return res.send({status:0, message:error});
                        });
                    });
                }
                else{
                    return res.send({status:1, message:"Order is placed Successfully"});
                }
    
            }).catch(error => {
                return res.send({status:0,message:error});
            });
        }).catch(error => {
            return res.send({status:0, message:error});
        });
        
    }

    // update many order status by id from both side
    async UpdateOrderStataus(req,res){
        if(!req.id || !req.status) return res.send({status:0, message:"Please enter valid details"});
        
        // if(req.status == "pending"){
        //     // change the order status to pending for foodparty-->start
        //     let filter = { foodpartyId:ObjectId(req.id),status:"queued" };
        //     let projection = {};
        //     let control = new controller(OrderSchema);
        //     control.GetMultiData(filter,projection).then(orderdata => {
        //         if(!orderdata) throw "Error in getting orderdata of foodparty";
        //         let orderids = [];
        //         orderdata.forEach(x => { orderids.push(x._id); });
        //         let filter = { _id: { $in: orderids } };
        //         let setdata = { status:"pending" ,modifiedOn:new Date() };
        //         // let setdata = {};
        //         control.UpdateManyData(filter,setdata).then(data => {
        //             if(!data) throw "Error in updating order status";

        //             orderdata.forEach(x => x.restaurantInfo.forEach(ids => {
        //                 let filter = { "restaurantId": ObjectId(ids.restaurantId), role:"owner" };
        //                 let projection = { deviceToken:1 };
        //                 let control = new controller(StaffSchema);
        //                 control.GetMultiData(filter,projection).then(data1 => {
        //                     if(!data1) throw "Error in getting the restaurant deviceToken";

        //                     data1.forEach(y => {
        //                         if(y.deviceToken){
        //                             let message = { to: y.deviceToken , notification: {
        //                                     title: 'New Order',
        //                                     body: 'You recieved new order.'
        //                                 }, data: {
        //                                     type: 'order',
        //                                     status: x.status
        //                                 }};
        //                             let notify = new Notification();
        //                             notify.PushNotification(message);
        //                         }
        //                     });

        //                 }).catch(error => {
        //                     return res.send({status:0, message:error});
        //                 });
        //             }));

        //         }).catch(error => {
        //             return res.send({status:0, message:error});
        //         });

        //     }).catch(error => {
        //         return res.send({status:0, message:error});
        //     });
        //     // change the order status to pending for foodparty-->end
        // }
        // else{        
            let id = [];
            req.id.split(",").forEach(x => { 
                id.push(ObjectId(x));
                // store the order history record ===> start
                let historydata = { orderId:ObjectId(x),status:req.status }
                let control = new controller(OrderHistory);
                console.log(historydata,"historydata")
                control.SaveData(historydata).then(history => {
                    if(_.isEmpty(history)) return res.send({status:0, message:"Error in saving the order history data"});
                    console.log("Order history saved");
                }).catch(error => {
                    return res.send({status:0, message:error});
                });
                // store the order history record ===> end
            });
            let filter = { _id: { $in: id } };
            let projection = {};
            let control = new controller(OrderSchema);
            control.GetMultiData(filter,projection).then(check => {
                if(_.isEmpty(check)) return res.send({status:0, message:"Order doesn't exsits!!"});

                let setdata = { status:req.status };
                control.UpdateManyData(filter,setdata).then(order => {
                    if(_.isEmpty(order)) return res.send({status:0, message:"Error in updating the order status"});

                    // notify user for order status
                    let userids = [];
                    check.forEach(x => userids.push(x.userId));
                    let filter = { _id: { $in: userids } };
                    let projection = {};
                    let control = new controller(UserSchema);
                    control.GetMultiData(filter,projection).then(userdata => {
                        if(!userdata) throw "Error in getting the devicetoken of users";

                        userdata.forEach(x => {
                            if(x.deviceToken){
                                let notifydata;
                                if(req.status == 'preparing'){
                                    notifydata = { title: 'Order ' + req.status, body: "Your Order is being prepared by the restaurant." };
                                }
                                else if(req.status == 'ready'){
                                    notifydata = { title: 'Order ' + req.status, body: "Your Order is ready for pickup." };
                                }
                                let message = { to: x.deviceToken , notification: notifydata, data: {
                                    type: 'order',
                                    status: req.status
                                }};
                                let notify = new Notification();
                                notify.PushNotification(message);
                            }
                        });

                        return res.send({status:1, message:"Order status updated successfully"});

                    }).catch(error => {
                        return res.send({status:0, message:error});
                    });

                }).catch(error => {
                    return res.send({status:0, message:error});
                });

            }).catch(error => {
                return res.send({status:0, message:error});
            });
        // }
    }

    // orderlist for restaurant report
    GetOrderReport(req,res){
        // res.send({status:'success'});
        let restaurantId = req.params.id;
        let startDate;
        let endDate;
        let status;
        
        // console.log('status');
        // console.log('startdate',req.query.startDate);
        req.query.startDate ? startDate = new Date(req.query.startDate): startDate = '';
        req.query.endDate ? endDate = new Date(req.query.endDate): endDate = '';
        req.query.status ? status = req.query.status: status = '';
        console.log(status)
        if(status == 'all'){
            status = '';
        }

        let control = new controller(OrderSchema);
        let promise = new Promise((resolve) => {
            let filter = {};
            if(startDate && endDate){
                if(status){
                    console.log('status yes and date yes');
                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'createdOn': { '$gte': startDate, '$lte': endDate }, 'status': status};
                }
                else{
                    console.log('date yes and status no');

                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'createdOn': { '$gte': startDate, '$lte': endDate }};
                }
            }
            else{
                if(status){
                    console.log('status yes and date no');

                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'status': status};
                }
                else{
                    console.log('status no and date no');

                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}};
                }
            }
            let projection = {createdOn:1, name:1, ordertotalPrice:1, status:1};
            control.GetMultiData(filter, projection).then(orders => {
                if(_.isEmpty(orders)) return res.send({status:0, message:"No orders found."});
                
                resolve(orders);
            });
            
        });
        
        promise.then((orders) => {
            let filter
            if(startDate && endDate){
                if(status){
                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'createdOn': { '$gte': startDate, '$lte': endDate }, 'status': status};
                }
                else{
                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'createdOn': { '$gte': startDate, '$lte': endDate }};
                }
            }
            else{
                if(status){
                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'status': status};
                }
                else{
                    filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}};
                }
            }
            let group = {
                _id: null,
                totalSum: {
                    $sum:"$ordertotalPrice"
                }
            };

            control.AggregateReportByOrderData(filter, group).then(sum => {

                res.send({status: 1, data: orders, totalCost: sum});
            
            })
            
        })
    }

    // itemlist for report
    GetItemReport(req,res){
        let restaurantId = req.params.id;
        let startDate;
        let endDate;

        // console.log('startdate',req.query.startDate);
        req.query.startDate ? startDate = new Date(req.query.startDate): startDate = '';
        req.query.endDate ? endDate = new Date(req.query.endDate): endDate = '';
        let control = new controller(OrderSchema);
        let filter = {};
        if(startDate && endDate){
            filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}, 'createdOn': { '$gte': startDate, '$lte': endDate }, status:'successfull'};
        }
        else{
            filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}};
        }
        let project1 = {"items": "$restaurantInfo.Item", _id: 0};
        let unwind = "$items";
        let project2 = {"itemId": "$items.itemId","name": "$items.name","price": "$items.price","quantity": "$items.quantity"};
        let group = {_id: {"name":"$name", "itemId":"$itemId"}, count:{$sum:"$quantity"}};
        let project3 = {"name":"$_id.name", "itemId":"$_id.itemId", count:1, _id:0};
        let lookup = {
            "from" : "items",
            "localField" : "itemId",
            "foreignField" : "_id",
            "as" : "itemDetail"
        };
        let unwind2 = '$itemDetail';
        let project4 = {count:1, name:1, itemId:1, 'price': "$itemDetail.price"}; 

        control.AggregateReportByItemData(filter, project1, unwind, project2, group, project3, lookup, unwind2, project4).then(items => {

            res.send({status: 1, data: items});
        
        })
    }

    // provide list of restaurant earning
    GetResOrderEarning(req, res){
        let filter = {status: 'successfull'};
        let control = new controller(OrderSchema);
        control.AggregateGetTotalEarning(filter).then(earning => {
            res.send({status:1, data:earning});
        })
    }

    // orderlist for restaurants by status
    GetOrderByRes(req,res){

        let restaurantId = req.params[0];
        if(!restaurantId || !req.body.status) return res.send({status:0, message:"Bad Request. Invalid Id"});

        let filter = {'restaurantInfo.restaurantId': {$in: [ObjectId(restaurantId)]}};
        (req.body.status != "all") ? filter.status = req.body.status : delete filter.status;
        if(req.body.startDate && req.body.endDate){
            console.log(req.body,"body")
            filter.createdOn = { $gte: req.body.startDate, $lt: req.body.endDate }
        }
        let projection = {__v:0};//,ordertotalPrice:0,userId:0,modifiedOn:0
        let control = new controller(OrderSchema);
        control.GetMultiData(filter,projection).then(orders => {
            if(_.isEmpty(orders)) return res.send({status:0, message:"No orders found."});
            orders.forEach(y => y.restaurantInfo.forEach((x,index) => {
                if(y.restaurantInfo.length > 0 && !x.restaurantId.equals(ObjectId(restaurantId))){
                    y.restaurantInfo.splice(index,1)
                }
            }));
            // orders.reverse();
            // db.orders.find({"createdOn": { $gte: ISODate("2020-01-01T00:00:00Z"), $lt: ISODate("2020-02-01T00:00:00Z"),}});

            return res.send({status:1, message:"Orders are found.", orders:orders});
            
        }).catch(error => {
            return res.send({status:0, message:error});
        });
        // let filter = {};
        // filter.restaurantId = ObjectId(restaurantId);
        // (req.body.status != "all") ? filter.status = req.body.status : delete filter.status; 

        // let control = new controller(OrderSchema);
        // let lookup = { 
            // "from" : "users",
            // "localField" : "userId",
            // "foreignField" : "_id",
            // "as" : "userdata"
        // }
        // let unwind = "$userdata"
        // let project = {
        //     _id:1,
        //     userId:1,
        //     // restaurantId:1,
        //     payment_mode:1,
        //     name: "$userdata.name",
        //     // rating: "$userdata.rating",
        //     // Item:1,
        //     // "Item._id":1,
        //     "Item.itemId":1,
        //     "Item.name":1,
        //     "Item.price":1,
        //     "Item.quantity":1,
        //     totalPrice:1,
        //     status:1,
        //     createdOn:1
        // }
        // control.AggregateData(filter, lookup, unwind, project).then(orders => {
        //     if(_.isEmpty(orders)) return res.send({status:0, message:"No orders found."});
        //     orders.forEach(x => x.Item.forEach(y => {y._id = y.itemId; delete y.itemId}))
        //     return res.send({status:1, message:"Orders are found.",orders:orders});
            
        // }).catch(error => {
        //     return res.send({status:0, message:error});
        // });
    }

    // orderlist for user
    GetOrderByUser(req,res){

        let userid = ObjectId(req.params[0]);
        if(!userid) return res.send({status:0, message:"Bad Request. Invalid Id"});

        let filter = {userId: userid};
        let projection = {type:1,_id:1,userId:1,ordertotalPrice:1,payment_mode:1,status:1,createdOn:1,restaurantInfo:1};
        let control = new controller(OrderSchema);
        control.GetMultiData(filter,projection).then(orders => {
            if(_.isEmpty(orders)) return res.send({status:0, message:"No orders found."});
            // orders.reverse();

            return res.send({status:1, message:"Orders are found.",orders:orders});

        }).catch(error => {
            return res.send({status:0, message:error});
        });
        // let lookup = {
        //     "from" : "restaurants",
        //     "localField" : "restaurantId",
        //     "foreignField" : "_id",
        //     "as" : "resdata"
        // }
        // let unwind = "$resdata"
        // let project = {
        //     _id:1,
        //     userId:1,
        //     restaurantId:1,
        //     payment_mode:1,
        //     name: "$resdata.name",
        //     rating: "$resdata.rating",
        //     // Item:1,
        //     // "Item._id":1,
        //     "Item.itemId":1,
        //     "Item.name":1,
        //     "Item.price":1,
        //     "Item.quantity":1,
        //     totalPrice:1,
        //     status:1,
        //     createdOn:1
        // }
        // control.AggregateData(filter, lookup, unwind, project).then(orders => {
        //     if(_.isEmpty(orders)) return res.send({status:0, message:"No orders yet!!!"});
        //     orders.forEach(x => x.Item.forEach(y => {y._id = y.itemId; delete y.itemId}))
        //     return res.send({status:1, message:"Orders are found.",orders:orders});
            
        // }).catch(error => {
        //     return res.send({status:0, message:error});
        // });
    }

    // get order history in admin portal
    GetOrderHistory(req,res){

        if(!req.params[0]) return res.send({status:0, message:"Enter the valid credentials."});

        let filter = { orderId:ObjectId(req.params[0]) };
        let projection = { orderId:1, status:1, createdOn:1 };
        let control = new controller(OrderHistory);
        control.GetMultiData(filter,projection).then(data => {
            if(_.isEmpty(data)) return res.send({status:0, message:"No Order History found."});

            return res.send({status:1, message:"Order History found.",data:data});

        }).catch(error => {
            return res.send({status:0, message:error});
        });
    }

    // get order  by id in admin portal
    GetOrderById(req,res){

        if(!req.params[0]) return res.send({status:0, message:"Bad Request. Invalid Id"});

        let filter = { _id: ObjectId(req.params[0]) };
        let lookup = {
            "from" : "users",
            "localField" : "userId",
            "foreignField" : "_id",
            "as" : "userdata" 
        };
        let unwind = '$userdata';
        let projection = { 
            type:1,_id:1,userId:1,ordertotalPrice:1,payment_mode:1,status:1,createdOn:1,restaurantInfo:1,
            user_name:"$userdata.name", user_img:"$userdata.profileImg"
        };
        let control = new controller(OrderSchema);

        control.AggregateData(filter,lookup,unwind,projection).then(data => {
            if(_.isEmpty(data)) return res.send({status:0, message:"No Orders Found."}) ;

            return res.send({status:1,message:"Order found successfully", orders:data[0]});

        }).catch(error => {
            return res.send({status:0, message:error});
        });

        // control.GetData(filter,projection).then(orders => {
        //     if(_.isEmpty(orders)) return res.send({status:0, message:"No orders found."});
        //     // orders.reverse();

        //     return res.send({status:1, message:"Orders are found.",orders:orders});

        // }).catch(error => {
        //     return res.send({status:0, message:error});
        // });

    }

    // ephemeral key when there is no user 
    Ephemeralkey(req,res){
        if(!req.api_version || !req.customerId) return res.send({status:0, message:"Enter the valid credentials"});
        
        const stripe_version = req.api_version;
        if (!stripe_version) {
            return res.status(400).end();
        }
        let data = {
            customerId:req.customerId,
            stripe_version:stripe_version
        }
        let control = new StripeControl();
        control.StripeEphemeralkey(data).then(key => {
            if(_.isEmpty(key)) return res.send({status:0, message:"Error in generating the key"});

            return res.status(200).json(key);

        }).catch(error => {
            console.log(error);
            return res.status(500).end();
        });
    }

    // generate payment in stripe
    Payment(req,res){

        if(!req.body.amount || !req.body.currency || !req.body.customerId) return res.send({status:0, message:"Enter the valid credentials"});

        let data = {
            amount: req.body.amount,
            currency: req.body.currency,
            customerId: req.body.customerId,
            // payment_method_types: ['card'],
            // receipt_email:
            // payment_method: req.body.paymentMethod
        }
        let control = new StripeControl();
        control.PaymentIntents(data).then(paymentIntent => {
            if(_.isEmpty(paymentIntent)) return res.send({status:0, message:"Error in payment"});

            return res.send({status:1, message:"paymentIntents found.", paymentIntent:paymentIntent});

        }).catch(error => {
            return res.send({status:0, message:error});
        });
    }

    // list the payment_method for customer
    ListPayment(req,res){
        if(!req.customerId) returnres.send({status:0, message:"Enter the valid credentaila"});

        let control = new StripeControl();
        control.ListPaymentMethod(req.customerId).then(paymentMethods => {
            if(_.isEmpty(paymentMethods)) return res.send({status:0, message:"Error in listing the payment_methods"});

            return res.send({status:1, message:"List of payments found", paymentMethods:paymentMethods});
            
        }).catch(error => {
            return res.send({status:0, message:error});
        });
        
    }

    // attach payment_method for customer in stripe
    AttachPayment(req,res){
        if(!req.customerId || !req.paymentMethod_id) return res.send({status:0, message:"Enter the valid credentaila"});
        
        let control = new StripeControl();
        control.AttachPaymentMethod(req.customerId,req.paymentMethod_id).then(paymentMethod => {
            if(_.isEmpty(paymentMethod)) return res.send({status:0, message:"Error in attaching the payment_methods"});

            return res.send({status:1, message:"Payment Method is attached successfully", paymentMethod:paymentMethod});
            
        }).catch(error => {
            return res.send({status:0, message:error});
        });
        
    }

    // set default payment_method for customer in stripe
    DefaultPayment(req,res){
        if(!req.customerId || !req.paymentMethod_id) return res.send({status:0, message:"Enter the valid credentials"});
        
        let control = new StripeControl();
        control.DefaultPaymentMethod(req.customerId,req.paymentMethod_id).then(customer => {
            if(_.isEmpty(customer)) return res.send({status:0, message:"Error in setting the default payment_method"});

            return res.send({status:1, message:"Default payment successfully added",customer:customer});

        }).catch(error => {
            return res.send({status:0, message:error});
        });
       
    }

}

module.exports = OrderControl;


    // SetupIntent(req,res){
    
    //     if(!req.params[0]) return res.send({status:0, message:"Enter the valid cdredentials"});

    //     stripe.setupIntents.create(
    //         {payment_method_types: ['card'],
    //             usage: 'on_session',
    //             customer:req.params[0]}, (err, setupIntent) => {
    //             // asynchronously called
    //             if(err) return res.send({status:0, message:err});
    //             return res.send({status:1, message:"SetupIntent successfull", SetupIntent:setupIntent});
    //         }
    //     );
    // }

    // // get cards for a StripeCustomer with default card
    // Cards(req,res){
    //     if(!req.params[0]) return res.send({status:0, message:"Enter the valid credentials"});

    //     let control = new StripeControl();
    //     control.GetCards(req.params[0]).then(cards => {
    //         if(_.isEmpty(cards)) return res.send({status:0, message:"Cards not found."});

    //         return res.send({status:1, message:"Cards found.", cards:cards});
    //     }).catch(error => {
    //         return res.send({status:0, message:error});
    //     });
    // }

    // // change the default card for the StripeCustomer
    // DefaultCard(req,res){
    //     if(!req.customerId || !req.cardId) return res.send({status:0, message:"Enter the valid credentials"});
    //     stripe.customers.update(req.customerId,{default_source: req.cardId},(err, customer) => {
    //         if(err) return res.send({status:0, message:err});
    //         console.log(customer.default_source,"default_source");
    //         return res.send({status:1, message:"default card changes successfully.", customer:customer})
    //     });
    // }
    
    // // save the card for the StripeCustomer
    // SaveCard(req,res){
    //     if(!req.token || !req.customerId) return res.send({status:0, message:"Enter the valid credentials"});

    //     let control = new StripeControl();
    //     control.SaveCards(req.customerId,req.token.toString()).then(card => {
    //         if(_.isEmpty(card)) return res.send({status:0, message:"Error in adding the card for customer"});

    //         return res.send({status:1, message:"Card successfully added",card:card});
    //     }).catch(error => {
    //         return res.send({status:0, message:error});
    //     });
    // }