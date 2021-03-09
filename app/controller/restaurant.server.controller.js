var _ = require('lodash');
let ObjectId = require('mongodb').ObjectID;
var Form = require('../service/Form');
var File = require('../service/File');
var controller = require('../controller/controller');
var restaurantjs = require('../model/restaurant');
var RestaurantImageSchema = require('../model/RestaurantSchema').RestaurantImages;
var MenuSchema = require('../model/MenuSchema').Menu;
var ItemSchema = require('../model/ItemSchema').Item;
var CategorySchema = require('../model/CategorySchema').Category;
var ComboSchema = require('../model/ComboSchema').Combo;
var StaffSchema = require('../model/StaffSchema').Staff;
var validator = require("email-validator");
var Email = require('../service/Email');
var DateHelper = require('../service/DateHelper');
var jwtToken = require('../service/AuthToken');
let crypto = require('crypto');
var Bcrypt = require('bcrypt');
var authenticationSchema = require('../model/AuthTokenSchema').AuthToken;
var fs = require('fs');
var Path = require('path');
var RestaurantSchema = require('../model/RestaurantSchema').Restaurants;
var RestaurantLocationSchema = require('../model/RestaurantSchema').RestaurantLocationInfo;
var OrderSchema = require('../model/OrderSchema').Orders;
var StripeController = require('../controller/Stripe.controller');
var config = require('../../config/config');

class RestaurantServerControl {

    // get Rescurrentuser
    ResGetCurrent(req, res) {
        if (!req.token) return res.send({ status: 0, message: "Error in getting the user details" });

        let filter = { _id: ObjectId(req.token.id) }
        let projection = { profileThumbnailImg: 0, modifiedOn: 0, createdOn: 0, __v: 0, password: 0, last_signedIn: 0, forgotToken: 0 };
        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then(staff => {
            if (_.isEmpty(staff)) return res.send({ status: 0, message: "staff not found." });

            // let filter = { _id:ObjectId(staff.restaurantId) };
            // let projection = {};
            // let control = new controller(RestaurantSchema);
            // control.GetData(filter,projection).then(async (check) => {
            //     if(_.isEmpty(check)) return res.send({status:0, message:"Invalid restaurant!!!"});

            let setdata = {};
            //     if(!check.customer_stripe_id){
            //         let Stripecontrol = new StripeController();
            //         await Stripecontrol.CreateStripeCustomer(check.email).then(customer => {
            //             customer ? setdata.customer_stripe_id = customer.id : delete setdata.customer_stripe_id;
            //         }).catch(error => {
            //             return res.send({status:0 ,message:error});
            //         });
            //     }
            //     else if(check.customer_stripe_id){
            //         let Stripecontrol = new StripeController();
            //         await Stripecontrol.CheckStripeId(check.customer_stripe_id,check.email).then(customer => {
            //             customer ? setdata.customer_stripe_id = customer.id : delete setdata.customer_stripe_id;
            //         }).catch(error => {
            //             return res.send({status:0, message:error});
            //         });
            //     }
            setdata.modifiedOn = new Date();
            // console.log(setdata)
            // let control = new controller(RestaurantSchema);
            control.UpdateData(filter, setdata).then(data => {
                if (!data) throw "Error in updating staff";

                return res.send({ status: 1, message: "Data found.", user: staff });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

            //     }).catch(error => {
            //         return res.send({state:0, message:error});
            //     });


        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // login for restaurant by staff role
    ResLogin(req, res) {

        if (!req.email || !req.password) return res.send({ status: 0, message: "Please Enter all the credentials" });

        let filter = { email: new RegExp('^' + req.email + '$', "i"), role: "owner" };
        let projection = { profileThumbnailImg: 0, modifiedOn: 0, createdOn: 0, __v: 0, last_signedIn: 0, forgotToken: 0 };

        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then(async (user) => {
            if (_.isEmpty(user)) return res.send({ status: 0, message: "User does not exists" })

            Bcrypt.compare(req.password, user.password).then((response) => {
                if (!response) return res.send({ status: 0, message: "Enter the valid password" });

                // let filter = { _id:ObjectId(user.restaurantId) };
                // let projection = {};
                // let control = new controller(RestaurantSchema);
                // control.GetData(filter,projection).then(async (check) => {
                //     if(_.isEmpty(check)) return res.send({status:0, message:"Invalid restaurant!!!!"});

                //     // let filter = {_id : user._id};
                let setuser = {};
                setuser.modifiedOn = new Date();
                setuser.last_signedIn = new Date();
                setuser.deviceToken = req.deviceToken;
                //     if(!check.customer_stripe_id){
                //         // Generate customer.id for stripe payments if null
                //         let Stripecontrol = new StripeController();
                //         await Stripecontrol.CreateStripeCustomer(check.email).then(customer => {
                //             // this.customer = customer;
                //             customer ? setuser.customer_stripe_id = customer.id : delete setuser.customer_stripe_id;
                //         }).catch(error => {
                //             return res.send({status:0 ,message:error});
                //         });
                //     }
                //     if(check.customer_stripe_id){
                //         // Check if the customer_stripe_id exists in stripe
                //         let Stripecontrol = new StripeController();
                //         await Stripecontrol.CheckStripeId(check.customer_stripe_id,check.email).then(customer => {
                //             // this.customer = customer;
                //             customer ? setuser.customer_stripe_id = customer.id : delete setuser.customer_stripe_id;
                //         }).catch(error => {
                //             return res.send({status:0, message:error});
                //         });
                //     }
                //     console.log(setuser)
                control.UpdateData(filter, setuser).then((upuser) => {
                    if (!upuser) throw "User is not get updated by device token";

                    let authtoken = new jwtToken();
                    authtoken.GenerateToken(upuser._id).then((token) => {
                        if (!token) throw "Error in generating token";
                        if (user.password) { user.password = undefined }

                        return res.send({ status: 1, message: "User is authenticated successfully", user: user, token: token });

                    }).catch((error) => {
                        return res.send({ status: 0, message: error });
                    });
                }).catch((error) => {
                    return res.send({ status: 0, message: error });
                });

                // }).catch(error => {
                //     return res.send({status:0, message:error});
                // });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        }).catch((error) => {
            return res.send({ status: 0, message: error });
        });
    }

    // signout/logout for restaurant by staff
    ResSignOut(req, res) {

        let reqid = req.params[0];
        if (!reqid) return res.send({ status: 0, message: "Bad Request. Invalid Id" });
        // , isVerified: true
        let filter = { _id: ObjectId(reqid) };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1, password: 1, isVerified: 1, deviceToken: 1 };

        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then((user) => {

            if (_.isEmpty(user)) throw "User dosn't exists";

            let userId = String(reqid);

            let filter = { userId: userId };
            let Authcontrol = new controller(authenticationSchema);
            Authcontrol.DeleteData(filter).then(data => {
                if (!data) return res.send({ status: 0, message: error });

                let filter = { _id: ObjectId(reqid) };
                let setdata = { deviceToken: '', modifiedOn: new Date() };

                control.UpdateData(filter, setdata).then(user => {

                    if (!user) throw "User is not updated by device token";

                    return res.send({ status: 1, message: "SignOut Successfull" });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            });
        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // forgot/reset password for restaurant staff
    ResForgotPassword(req, res) {

        if (!req.email || !validator.validate(req.email)) return res.send({ status: 0, message: 'Please enter valid email' });

        let filter = { email: new RegExp('^' + req.email + '$', "i") };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, isVerified: 1, forgotToken: 1 };

        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then((user) => {

            if (_.isEmpty(user)) throw "User doesn't exist";
            if (!_.isEmpty(user) && (user.forgotToken && user.forgotToken != "")) throw 'Recover password link is already sent to the registered email.';

            crypto.randomBytes(48, (err, buffer) => {
                if (err) throw "error in generating verifyToken";
                let verifyToken = buffer.toString('hex');
                // var ForgetPassLink = '';
                var ForgetPassLink = config.ServerLink + config.ResForgetPassLink + verifyToken + '&id=' + user._id;

                let mailoptions = {
                    to: req.email,
                    subject: "ResetPassword for OrderSavvy",
                    text: "Please click on the link below to reset your password.",
                    html: "<b>Please click on the link below to reset your password: </b><br><br><a href='" + ForgetPassLink + "'>" + ForgetPassLink + "</a>"
                }

                let mail = new Email();
                mail.SendMail(mailoptions).then(() => {

                    let filter = { email: new RegExp('^' + req.email + '$', "i") };
                    let setuser = { forgotToken: verifyToken, modifiedOn: new Date() };

                    control.UpdateData(filter, setuser).then((user) => {

                        if (!user) throw "Token is not updated for the user";

                        return res.send({ status: 1, message: "PasswordLink is send to the registered email" });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            });
        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // reset password for restaurant staff
    ResResetPassword(req, res) {

        if (!req.token || !req.password || !req.id) return res.send({ status: 0, message: "Please enter all the details" });

        let filter = { _id: ObjectId(req.id) };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1 };

        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then((user) => {

            if (_.isEmpty(user)) return res.send({ status: 0, message: "User with above details doesn't exist" });
            if (!_.isEmpty(user) && !user.forgotToken) return res.send({ status: 0, message: "Link is expired" });

            DateHelper.calculateTimeDifference(new Date(), user.modifiedOn).then((min) => {
                if (min > 2) {
                    let setdata = { forgotToken: "", modifiedOn: new Date() };

                    control.UpdateData(filter, setdata).then((user) => {
                        if (_.isEmpty(user)) return res.send({ status: 0, message: "User is not updated with the Link Expired" });

                        return res.send({ status: 0, message: "Link is expired" });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }
                else {
                    let bcrypt = new controller();
                    let password = bcrypt.bcryptpass(req.password);
                    let setdata = { forgotToken: "", modifiedOn: new Date(), password: password };

                    control.UpdateData(filter, setdata).then((user) => {
                        if (_.isEmpty(user)) return res.send({ status: 0, message: "User is not updated with the password" });

                        return res.send({ status: 1, message: "Password is changed successfully" });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }


            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // change the password for restaurant staff
    ResChangePassword(req, res) {

        if (!req.id || !req.oldpassword || !req.newpassword) return res.send({ status: 0, message: "Please enter the valid credentials" });

        let filter = { _id: ObjectId(req.id) };
        let projection = { _id: 1, email: 1, password: 1, socialType: 1, createdOn: 1, modifiedOn: 1 };
        let bcrypt = new controller();

        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then((user) => {

            if (_.isEmpty(user)) return res.send({ status: 0, message: "User with the details does not exsits" });

            Bcrypt.compare(req.oldpassword, user.password).then((response) => {

                if (!response) throw "Authentication failed, invalid password";
                let password = bcrypt.bcryptpass(req.newpassword);
                let setdata = { modifiedon: new Date(), password: password };

                control.UpdateData(filter, setdata).then(user => {

                    if (!user) return res.send({ status: 0, message: "Password is not changed" });

                    return res.send({ status: 1, message: "Password has been changed successfully" });

                }).catch(error => {
                    return res.send({ status: 0, message: error })
                });
            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get the staff from restaurantId
    GetStaff(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let projection = { profileThumbnailImg: 0, last_signedIn: 0, modifiedOn: 0, createdOn: 0, __v: 0, password: 0, forgotToken: 0, restaurantId: 0 };
        let control = new controller(StaffSchema);
        control.GetMultiData(filter, projection).then(data => {
            if (_.isEmpty(data)) return res.send({ status: 0, message: "Staff member doesn't exsits!!" });
            let owner = [];
            let staff = [];
            data.forEach(x => { if (x.role == "owner") { owner.push(x); } else { staff.push(x); } });

            return res.send({ status: 1, message: "Staff found successfully", owner: owner, staff: staff });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // add staff to restaurants and set the role
    AddStaff(req, res) {
        let form = new Form();
        form.Parse(req).then((FormParseObj) => {

            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });

            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreStaffProfileImgFile(FormParseObj.files, '/public/uploads/StaffProfileImg/').then((FileObj) => {
                    console.log(FileObj)
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {

                if (!FormParseObj.fields.restaurantId || !FormParseObj.fields.role || !FormParseObj.fields.email &&
                    (!FormParseObj.fields.name && !FormParseObj.fields.username && !FormParseObj.fields.phoneNo)) return res.send({ status: 0, message: "Please Enter valid details" });

                let staffdata = {};
                staffdata.role = FormParseObj.fields.role[0];
                staffdata.restaurantId = FormParseObj.fields.restaurantId[0];
                FileObject != null ? staffdata.profileImg = FileObject.filePath : delete staffdata.profileImg
                FileObject != null ? staffdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete staffdata.profileThumbnailImg
                FormParseObj.fields.name ? staffdata.name = FormParseObj.fields.name[0] : delete staffdata.name
                FormParseObj.fields.email ? staffdata.email = FormParseObj.fields.email[0] : delete staffdata.email
                FormParseObj.fields.username ? staffdata.username = FormParseObj.fields.username[0] : delete staffdata.username
                FormParseObj.fields.phoneNo ? staffdata.phoneNo = FormParseObj.fields.phoneNo[0] : delete staffdata.phoneNo
                staffdata.modifiedOn = new Date();

                let filter = { email: FormParseObj.fields.email[0] };
                let projection = {};
                let control = new controller(StaffSchema);
                control.GetData(filter, projection).then(check => {
                    if (!_.isEmpty(check)) return res.send({ status: 0, message: "Staff with this email already exsits!!" });

                    control.SaveData(staffdata).then(staff => {
                        if (_.isEmpty(staff)) return res.send({ status: 0, message: "Error in saving the data" });

                        return res.send({ status: 1, message: "Staff saved successfully", staff });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        });
    }

    // update staff of restaurants
    UpdateStaff(req, res) {
        let form = new Form();
        form.Parse(req).then((FormParseObj) => {

            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });

            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreStaffProfileImgFile(FormParseObj.files, '/public/uploads/StaffProfileImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {

                if (!FormParseObj.fields.id || !FormParseObj.fields.restaurantId || !FormParseObj.fields.role &&
                    (!FormParseObj.fields.email || !FormParseObj.fields.name && !FormParseObj.fields.username && !FormParseObj.fields.phoneNo)) return res.send({ status: 0, message: "Please Enter valid details" });

                let staffdata = {};
                staffdata.role = FormParseObj.fields.role[0];
                staffdata.restaurantId = FormParseObj.fields.restaurantId[0];
                FileObject != null ? staffdata.profileImg = FileObject.filePath : delete staffdata.profileImg
                FileObject != null ? staffdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete staffdata.profileThumbnailImg
                FormParseObj.fields.name ? staffdata.name = FormParseObj.fields.name[0] : delete staffdata.name
                FormParseObj.fields.email ? staffdata.email = FormParseObj.fields.email[0] : delete staffdata.email
                FormParseObj.fields.username ? staffdata.username = FormParseObj.fields.username[0] : delete staffdata.username
                FormParseObj.fields.phoneNo ? staffdata.phoneNo = FormParseObj.fields.phoneNo[0] : delete staffdata.phoneNo
                staffdata.modifiedOn = new Date();

                let filter = { _id: FormParseObj.fields.id[0] };
                let projection = {};
                let control = new controller(StaffSchema);
                control.GetData(filter, projection).then(check => {
                    if (_.isEmpty(check)) return res.send({ status: 0, message: "Staff with this credentials doesn't exsits!!" });

                    if (staffdata.profileImg && check.profileImg) {
                        fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                            if (err) console.log(err)
                        });
                    }
                    control.UpdateData(filter, staffdata).then(staff => {
                        if (_.isEmpty(staff)) return res.send({ status: 0, message: "Error in updating the data" });

                        return res.send({ status: 1, message: "Staff updated successfully", staff });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        });
    }

    // delete staff of restaurants
    DeleteStaff(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then(check => {
            if (_.isEmpty(check)) return res.send({ status: 0, message: "Staff member doesn't exsits!!" });

            if (check.profileImg) {
                fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                    if (err) console.log(err)
                });
            }

            control.DeleteData(filter).then(staff => {
                if (_.isEmpty(staff)) return res.send({ status: 0, message: "Error in deleting the staff" });

                return res.send({ status: 1, message: "Staff member is deleted successfully" });
            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // myrestaurant details for staff
    MyRestaurantDetails(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then(staff => {
            if (_.isEmpty(staff)) return res.send({ status: 0, message: "Staff member doesn't exsits!!" });

            let filter = { _id: ObjectId(staff.restaurantId) };
            let sort = { createdOn: -1 };
            let limit = 10;

            let control = new restaurantjs(RestaurantSchema);
            control.GetRestaurants(filter, sort, limit).then(restaurant => {
                if (_.isEmpty(restaurant)) return res.send({ status: 0, message: "No restaurant found." });

                let control = new controller(OrderSchema);
                var today = new Date();
                var dd = String(today.getDate()).padStart(2, '0');
                var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                var yyyy = today.getFullYear();
                today = yyyy + '-' + mm + '-' + dd;
                console.log(today + "T00:00:00Z");
                console.log(today + "T23:59:59Z");

                let filter = { createdOn: { $gte: today + "T00:00:00Z", $lt: today + "T23:59:59Z" } };
                let projection = {};
                control.GetMultiData(filter, projection).then(count => {
                    console.log('count', count);
                    if (!count) throw "Error in getting the orders count";

                    return res.send({ status: 1, message: "Restaurant is found", TotalOrders: count.length, restaurants: restaurant });

                }).catch(error => {
                    return res.send({ state: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // create the account for restaurants in stripe
    // craeteaccount(req,res){
    //     let control = new StripeController();
    //     control.CreateAccount().then(account => {
    //        console.log(account) 
    //     }).catch(error => {
    //         return res.send({status:0, message:error});
    //     });
    // }

    // save the restaurant data
    SaveRestaurant(req, res) {
        if (!req.RestaurantAdminId || !req.name && (!req.openAt || !validator.validate(req.email) || !req.closeAt || !req.rating || !req.status || !req.longitude || !req.latitude))
            return res.send({ status: 0, message: "Enter the valid credentials" });

        // let filter = {$or: [{name: req.name}, {email:req.email}]};
        let filter = { name: req.name };
        let projection = {};
        let control = new controller(RestaurantSchema);
        control.GetData(filter, projection).then(restaurant => {
            if (!_.isEmpty(restaurant)) return res.send({ status: 0, message: "Restaurant with this name already exists" });

            let restaurantdata = {};
            req.name ? restaurantdata.name = req.name : delete restaurantdata.name;
            req.openAt ? restaurantdata.openAt = req.openAt : delete restaurantdata.openAt;
            req.closeAt ? restaurantdata.closeAt = req.closeAt : delete restaurantdata.closeAt;
            req.rating ? restaurantdata.rating = req.rating : delete restaurantdata.rating;
            req.status ? restaurantdata.status = req.status : delete restaurantdata.status;
            req.email ? restaurantdata.email = req.email : delete restaurantdata.email;
            req.phoneNo ? restaurantdata.phoneNo = req.phoneNo : delete restaurantdata.phoneNo;
            req.RestaurantAdminId ? restaurantdata.RestaurantAdminId = ObjectId(req.RestaurantAdminId) : delete restaurantdata.RestaurantAdminId;

            control.SaveData(restaurantdata).then(restaurant => {
                if (!restaurant) return res.send({ status: 0, message: "Error please signup for restaurant again later" });

                if (req.longitude || req.latitude) {
                    let control = new controller(RestaurantLocationSchema);
                    let reslocdata = {};
                    reslocdata.restaurantId = ObjectId(restaurant._id);
                    reslocdata.address = {
                        street: req.street,
                        city: req.city,
                        state: req.state,
                        postCode: req.postCode,
                        location: { type: "Point", coordinates: [Number(req.longitude), Number(req.latitude)] }
                    }

                    control.SaveData(reslocdata).then(data => {
                        if (!data) return res.send({ status: 0, message: "error in pushing the location data" });

                        return res.send({ status: 1, message: "Restaurant saved successfully" });
                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }
                else {
                    return res.send({ status: 1, message: "Restaurant saved successfully" });
                }

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // update the restaurant data
    UpdateRestaurant(req, res) {

        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });

            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreResImgFile(FormParseObj.files, '/public/uploads/ResImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                // && !FormParseObj.fields.phoneNo
                if (!FormParseObj.fields.id || (!FormParseObj.fields.name && !FormParseObj.fields.email && !FormParseObj.fields.status
                    && !FormParseObj.fields.openAt && !FormParseObj.fields.closeAt && !FormParseObj.fields.rating && !FormParseObj.fields.street && !FormParseObj.fields.city
                    && !FormParseObj.fields.state && !FormParseObj.fields.postCode && !FormParseObj.fields.longitude && !FormParseObj.fields.latitude
                )) return res.send({ status: 0, message: "Please Enter valid details" });

                let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };
                let projection = {};
                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg;
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileThumbnailImg;
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name;
                FormParseObj.fields.email ? setdata.email = FormParseObj.fields.email[0] : delete setdata.email;
                FormParseObj.fields.status ? setdata.status = FormParseObj.fields.status[0] : delete setdata.status;
                let temp = [];
                if (FormParseObj.fields.phoneNo) {
                    FormParseObj.fields.phoneNo[0].split(',').forEach(x => { temp.push(x); })
                }
                FormParseObj.fields.phoneNo ? setdata.phoneNo = temp : setdata.phoneNo = [];
                FormParseObj.fields.openAt ? setdata.openAt = FormParseObj.fields.openAt[0] : delete setdata.openAt;
                FormParseObj.fields.closeAt ? setdata.closeAt = FormParseObj.fields.closeAt[0] : delete setdata.closeAt;
                FormParseObj.fields.timezone ? setdata.timezone = FormParseObj.fields.timezone[0] : delete setdata.timezone;
                FormParseObj.fields.rating ? setdata.rating = FormParseObj.fields.rating[0] : delete setdata.rating;
                setdata.modifiedOn = new Date();

                // console.log(setdata)
                let control = new controller(RestaurantSchema);
                control.GetData(filter, projection).then(check => {
                    if (_.isEmpty(check)) return res.send({ status: 0, message: "Restaurant doesn't exsits" });

                    if (check.profileImg && setdata.profileImg) {
                        fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                            if (err) console.log(err)
                        });
                    }
                    control.UpdateData(filter, setdata).then(data => {
                        if (!data) throw "Restaurant is not updated";

                        if (FormParseObj.fields.street || FormParseObj.fields.city || FormParseObj.fields.state || FormParseObj.fields.postCode || FormParseObj.fields.longitude || FormParseObj.fields.latitude) {

                            let filter = { restaurantId: ObjectId(FormParseObj.fields.id[0]) };
                            let projection = {};
                            let control = new controller(RestaurantLocationSchema);
                            control.GetData(filter, projection).then(checklocdata => {

                                let reslocdata = {};
                                reslocdata.address = {};
                                FormParseObj.fields.street ? reslocdata.address.street = FormParseObj.fields.street[0] : delete reslocdata.address.street;
                                FormParseObj.fields.city ? reslocdata.address.city = FormParseObj.fields.city[0] : delete reslocdata.address.city;
                                FormParseObj.fields.state ? reslocdata.address.state = FormParseObj.fields.state[0] : delete reslocdata.address.state;
                                FormParseObj.fields.postCode ? reslocdata.address.postCode = FormParseObj.fields.postCode[0] : delete reslocdata.address.postCode;
                                (FormParseObj.fields.longitude || FormParseObj.fields.latitude) ?
                                    reslocdata.address.location = { type: "Point", coordinates: [Number(FormParseObj.fields.longitude[0]), Number(FormParseObj.fields.latitude[0])] }
                                    : delete reslocdata.address.location;
                                // city : req.city,
                                // state : req.state,
                                // postCode : req.postCode,
                                // location: {type : "Point",coordinates : [Number(req.longitude), Number(req.latitude)]}
                                if (_.isEmpty(checklocdata)) {

                                    reslocdata.restaurantId = ObjectId(FormParseObj.fields.id[0]);
                                    control.SaveData(reslocdata).then(data => {
                                        if (!data) return res.send({ status: 0, message: "error in pushing the location data" });

                                        return res.send({ status: 1, message: "Restaurant is updated successfully" });
                                    }).catch(error => {
                                        return res.send({ status: 0, message: error });
                                    });
                                }
                                else if (!_.isEmpty(checklocdata)) {

                                    control.UpdateData(filter, reslocdata).then(locdata => {
                                        console.log(locdata, "locdata")
                                        if (!locdata) return res.send({ status: 0, message: "error in pushing the location data" });

                                        return res.send({ status: 1, message: "Restaurant is updated successfully" });

                                    }).catch(error => {
                                        return res.send({ status: 0, message: error });
                                    });
                                }

                            }).catch(error => {
                                return res.send({ status: 0, message: error });
                            });

                        }
                        else {
                            return res.send({ status: 1, message: "Restaurant is updated successfully", data: data });
                        }

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        });
        // 
    }

}

module.exports = RestaurantServerControl
