var _ = require('lodash');
var Bcrypt = require('bcrypt');
var controller = require('../controller/controller');
var validator = require("email-validator");
var jwtToken = require('../service/AuthToken');
let ObjectId = require('mongodb').ObjectID;
let crypto = require('crypto');
let Email = require('../service/Email');
var authenticationSchema = require('../model/AuthTokenSchema').AuthToken;
var Form = require('../service/Form');
var File = require('../service/File');
var DateHelper = require('../service/DateHelper');
var Notification = require('../service/FCM-Notification');
var login_account = require('../model/Login_AccountSchema').Login_Account;
var login_detail = require('../model/Login_DetailSchema').Login_Detail;
var config = require('../../config/config');
var restaurantjs = require('../model/restaurant');
var RestaurantSchema = require('../model/RestaurantSchema').Restaurants;
var ItemSchema = require('../model/ItemSchema').Item;
var ComboSchema = require('../model/ComboSchema').Combo;
var MenuSchema = require('../model/MenuSchema').Menu;
var fs = require('fs');
var Path = require('path');
var CategorySchema = require('../model/CategorySchema').Category;
var StaffSchema = require('../model/StaffSchema').Staff;
var userjs = require('../model/user');
var FoodPartySchema = require('../model/FoodPartySchema').FoodParty;
var ModsSchema = require('../model/ModsSchema').Mods;
var RestaurantImageSchema = require('../model/RestaurantSchema').RestaurantImages;

class AdminControl {

    // signup user in admin portal
    SignUp(req, res) {

        if (!req.username || !req.email || !req.password || !req.name) return res.send({ status: 0, message: 'Enter the valid credentials' });

        let filter = { email: new RegExp('^' + req.email + '$', "i") };
        let projection = { _id: 1, email: 1 };

        let control = new controller(login_account);
        control.GetData(filter, projection).then((user) => {
            if (!_.isEmpty(user)) return res.send({ status: 0, message: "User already exists!" });

            let userdata = {
                name: req.name,
                email: req.email,
            }
            control.SaveData(userdata).then((createduser) => {
                if (!createduser) return res.send({ status: 0, message: "Error please signup again later" });

                let filter = { username: req.username };
                let projection = { _id: 1, username: 1 };
                var bcrypt = new controller();
                req.password = bcrypt.bcryptpass(req.password);
                let data = {
                    userId: createduser._id,
                    username: req.username,
                    password: req.password,
                    role: "restaurant_master"
                }
                let control = new controller(login_detail);
                control.GetData(filter, projection).then(check => {
                    if (!_.isEmpty(check)) return res.send({ status: 0, message: "User already exists" });

                    control.SaveData(data).then(user => {
                        if (_.isEmpty(user)) return res.send({ status: 0, message: "Error please signup again later" });

                        return res.send({ status: 1, message: "User save successfully" });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                if (error.message.name == 'MongoError') {
                    return res.send({ status: 0, message: "User already exists" });
                }
                else {
                    return res.send({ status: 0, message: error });
                }
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // login user in admin portal
    LogIn(req, res) {
        if (!req.username || !req.password) return res.send({ status: 0, message: "Please Enter all the credentials" });

        let filter = { username: req.username };
        let projection = { createdOn: 1, username: 1, password: 1 };

        let control = new controller(login_detail);
        control.GetData(filter, projection).then((user) => {
            if (_.isEmpty(user)) return res.send({ status: 0, message: "User does not exists" })

            Bcrypt.compare(req.password, user.password).then((response) => {
                if (!response) return res.send({ status: 0, message: "Enter the valid password" });

                let filter = { _id: user._id };
                let setuser = { modifiedOn: new Date() };

                control.UpdateData(filter, setuser).then((upuser) => {
                    if (!upuser) throw "User is not updated";

                    let authtoken = new jwtToken();
                    authtoken.GenerateToken(upuser.userId).then((token) => {
                        if (!token) throw "Error in generating token";
                        upuser.token = token;
                        // console.log(token)
                        let filter = { _id: ObjectId(upuser.userId) };
                        let projection = { name: 1, email: 1 };
                        let control = new controller(login_account);
                        control.GetData(filter, projection).then(account => {
                            if (_.isEmpty(account)) return res.send({ status: 0, message: "Error in getting the user account details." });

                            let data = {
                                createdOn: upuser.createdOn,
                                userId: upuser.userId,
                                username: upuser.username,
                                password: upuser.password,
                                role: upuser.role,
                                name: account.name,
                                email: account.email
                            }
                            return res.send({ status: 1, message: "User is authenticated successfully", user: data, token: token });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch((error) => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch((error) => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch((error) => {
            return res.send({ status: 0, message: error });
        });
    }

    // signout/logout for user in admin portal
    SignOut(req, res) {

        let reqid = req.params[0];
        if (!reqid) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { userId: ObjectId(reqid) };
        let projection = { _id: 1, username: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1, password: 1 };

        let control = new controller(login_detail);
        control.GetData(filter, projection).then((user) => {

            if (_.isEmpty(user)) throw "User dosn't exists";

            let userId = String(reqid);

            let filter = { userId: userId };
            let Authcontrol = new controller(authenticationSchema);
            Authcontrol.DeleteData(filter).then(data => {
                if (!data) return res.send({ status: 0, message: error });

                let filter = { userId: ObjectId(reqid) };
                let setdata = { modifiedOn: new Date() };

                control.UpdateData(filter, setdata).then(user => {

                    if (!user) throw "User is modified";

                    return res.send({ status: 1, message: "SignOut Successfull" });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            });
        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // forgot/reset password in admin portal
    ForgotPassword(req, res) {

        if (!req.email || !validator.validate(req.email)) return res.send({ status: 0, message: 'Please enter correct email' });

        let filter = { email: new RegExp('^' + req.email + '$', "i") };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1 };

        let control = new controller(login_account);
        control.GetData(filter, projection).then((user) => {
            console.log('1');
            if (_.isEmpty(user)) throw "User doesn't exist";
            if (!_.isEmpty(user) && (user.forgotToken && user.forgotToken != "")) throw 'Recover password link is already sent to the registered email.';

            crypto.randomBytes(48, (err, buffer) => {
                console.log('2', err)
                if (err) throw "error in generating verifyToken";
                let verifyToken = buffer.toString('hex');
                var ForgetPassLink = '';
                var ForgetPassLink = config.AdminForgetPassLink + verifyToken + '&id=' + user._id;

                let mailoptions = {
                    to: req.email,
                    subject: "ResetPassword for OrderSavvy Admin",
                    text: "Please click on the link below to reset your password.",
                    html: "<b>Please click on the link below to reset your password: </b><br><br><a href='" + ForgetPassLink + "'>" + ForgetPassLink + "</a>"
                }
                console.log('3');
                let mail = new Email();
                mail.SendMail(mailoptions).then(() => {
                    console.log('4');
                    let filter = { email: new RegExp('^' + req.email + '$', "i") };
                    let setuser = { forgotToken: verifyToken, modifiedOn: new Date() };

                    control.UpdateData(filter, setuser).then((user) => {

                        if (!user) throw "Token is not updated for the user";

                        return res.send({ status: 1, message: "Reset Password Link is send to registered email" });

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

    // reset password in admin portal
    ResetPassword(req, res) {

        if (!req.token || !req.password || !req.id) return res.send({ status: 0, message: "Please enter all the details" });

        let filter = { _id: ObjectId(req.id), forgotToken: req.token };
        let projection = {};

        let control = new controller(login_account);
        control.GetData(filter, projection).then((user) => {
            // console.log('1',user);
            if (_.isEmpty(user)) return res.send({ status: 0, message: "User with above details doesn't exist" });
            if (!_.isEmpty(user) && !user.forgotToken) return res.send({ status: 0, message: "Link is expired" });

            DateHelper.calculateTimeDifference(new Date(), user.modifiedOn).then((min) => {
                if (min > 5) return res.send({ status: 0, message: "Link is expired" });

                let filter = { userId: ObjectId(req.id) };
                let bcrypt = new controller();
                let password = bcrypt.bcryptpass(req.password);
                let setdata = { modifiedOn: new Date(), password: password };
                let control = new controller(login_detail);

                control.UpdateData(filter, setdata).then((upuser) => {

                    if (_.isEmpty(upuser)) return res.send({ status: 0, message: "User is not updated with the password" });

                    let filter = { _id: ObjectId(req.id) };
                    let settoken = { forgotToken: "" };
                    let control = new controller(login_account);
                    control.UpdateData(filter, settoken).then(uptoken => {
                        if (_.isEmpty(uptoken)) return res.send({ status: 0, message: "Error in updating forgotToken." });

                        return res.send({ status: 1, message: "Password is changed successfully" });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    })

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

    // change the password in admin portal
    ChangePassword(req, res) {

        if (!req.id || !req.oldpassword || !req.newpassword) return res.send({ status: 0, message: "Please enter the valid credentials" });

        let filter = { userId: ObjectId(req.id) };
        let projection = { _id: 1, userId: 1, password: 1 };
        // let bcrypt = new controller();
        console.log('1');
        let control = new controller(login_detail);
        control.GetData(filter, projection).then((user) => {

            if (_.isEmpty(user)) return res.send({ status: 0, message: "User with the details does not exsits" });

            Bcrypt.compare(req.oldpassword, user.password).then((response) => {
                console.log(response);
                if (!response) throw "Authentication failed, invalid password";
                var bcrypt = new controller();
                // req.password =  bcrypt.bcryptpass(req.password);
                let password = bcrypt.bcryptpass(req.newpassword);
                // console.log(password);
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

    // get all the restaurant list in admin portal
    GetAllRestaurants(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { userId: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(login_detail);
        control.GetData(filter, projection).then(check => {
            if (_.isEmpty(check)) return res.send({ status: 0, message: error });

            let filter = {};
            (check.role == 'restaurant_master') ? filter.RestaurantAdminId = ObjectId(check.userId) : delete filter.RestaurantAdminId;
            let sort = { createdOn: -1 };
            let limit = 1000;
            let control = new restaurantjs(RestaurantSchema);
            control.GetRestaurants(filter, sort, limit).then(restaurants => {
                if (_.isEmpty(restaurants)) return res.send({ status: 1, message: "No Restaurants found.", restaurants: [] });
                let restaurant = [];
                restaurants.forEach(x => { restaurant.push({ _id: x._id, name: x.name, RestaurantAdminId: x.RestaurantAdminId }) });
                return res.send({ status: 1, message: "Restaurants List found successfully", restaurants: restaurant });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // get all item list of restaurant in admin portal
    GetAllItems(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let projection = { _id: 1, name: 1, description: 1, profileImg: 1, price: 1, Mods: 1 };
        let control = new controller(ItemSchema);
        control.GetMultiData(filter, projection).then(items => {
            if (_.isEmpty(items)) return res.send({ status: 0, message: "No Items found." });

            return res.send({ status: 1, message: "Items List found successfully", data: items });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // get all combos list of restaurant in admin portal
    GetAllCombos(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let projection = { _id: 1, profileImg: 1, name: 1, menuId: 1, restaurantId: 1, description: 1, totalPrice: 1, Item: 1 };
        let control = new controller(ComboSchema);
        control.GetMultiData(filter, projection).then(combos => {
            if (_.isEmpty(combos)) return res.send({ status: 0, message: "No Combos found." });

            return res.send({ status: 1, message: "Combo List found successfully", data: combos });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // get all mods list of restaurant in admin portal
    GetAllMods(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let projection = { _id: 1, profileImg: 1, name: 1, restaurantId: 1, description: 1, price: 1 };
        let control = new controller(ModsSchema);
        control.GetMultiData(filter, projection).then(mods => {
            console.log(mods, "mods")
            if (_.isEmpty(mods)) return res.send({ status: 0, message: "No Mods found." });

            return res.send({ status: 1, message: "Mods List found successfully", data: mods });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // get all menu list of restaurant in admin portal
    GetAllMenus(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(MenuSchema);
        control.GetMultiData(filter, projection).then(menus => {
            if (_.isEmpty(menus)) return res.send({ status: 0, message: "No Menus found." });

            return res.send({ status: 1, message: "Menu List found successfully", data: menus });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // add update item in restaurants for admin panel
    AddUpdateItem(req, res) {

        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });
            // console.log(FormParseObj,"FormParseObj")
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreItemImgFile(FormParseObj.files, '/public/uploads/ItemImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                // console.log(FileObject,"FileObject")

                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg;
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileThumbnailImg;
                FormParseObj.fields.restaurantId ? setdata.restaurantId = FormParseObj.fields.restaurantId[0] : delete setdata.restaurantId;
                FormParseObj.fields.categoryId ? setdata.categoryId = FormParseObj.fields.categoryId[0] : delete setdata.categoryId;
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name;
                FormParseObj.fields.description ? setdata.description = FormParseObj.fields.description[0] : delete setdata.description;
                FormParseObj.fields.price ? setdata.price = FormParseObj.fields.price[0] : delete setdata.price;
                FormParseObj.fields.Mods ? setdata.Mods = JSON.parse(FormParseObj.fields.Mods[0]) : delete setdata.Mods;
                setdata.modifiedOn = new Date();
                if (!FormParseObj.fields.id) {

                    if (!FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.price) return res.send({ status: 0, message: "Enter the valid credentials" });

                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { restaurantId: 1, name: 1 };
                    let control = new controller(ItemSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check)) return res.send({ status: 0, message: "Item with this name already exists!!" });

                        control.SaveData(setdata).then(item => {
                            // console.log(item,"item")
                            if (_.isEmpty(item)) return res.send({ status: 0, message: "Error in saving the item data" });

                            return res.send({ status: 1, message: "Item saved successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }
                else {

                    if (!FormParseObj.fields.id || !FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.price || !FormParseObj.fields.description && (!FormParseObj.fields.categoryId)) return res.send({ status: 0, message: "Enter the valid credentials" });
                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { _id: 1, restaurantId: 1, name: 1, profileImg: 1 };
                    let control = new controller(ItemSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check) && !check._id.equals(FormParseObj.fields.id[0])) return res.send({ status: 0, message: "Item with this name already exists!!" });
                        let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };

                        if (setdata.profileImg && check.profileImg) {
                            fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                                if (err) console.log(err)
                            });
                        }
                        control.UpdateData(filter, setdata).then(item => {
                            // console.log("done",item)
                            if (_.isEmpty(item)) return res.send({ status: 0, message: "Error in updating item data" });

                            return res.send({ status: 1, message: "Item updated successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }

            });
        });
    }

    // add update mods in restaurants for admin panel
    AddUpdateMods(req, res) {
        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });
            console.log(FormParseObj, "FormParseObj")
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreModsImgFile(FormParseObj.files, '/public/uploads/ModImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                console.log(FileObject);
                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg;
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileThumbnailImg;
                FormParseObj.fields.restaurantId ? setdata.restaurantId = FormParseObj.fields.restaurantId[0] : delete setdata.restaurantId;
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name;
                FormParseObj.fields.description ? setdata.description = FormParseObj.fields.description[0] : delete setdata.description;
                FormParseObj.fields.price ? setdata.price = FormParseObj.fields.price[0] : delete setdata.price;
                setdata.modifiedOn = new Date();
                console.log(setdata)

                if (!FormParseObj.fields.id) {

                    if (!FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.price) return res.send({ status: 0, message: "Enter the valid credentials" });

                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { restaurantId: 1, name: 1 };
                    let control = new controller(ModsSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check)) return res.send({ status: 0, message: "Mod with this name already exist." });

                        control.SaveData(setdata).then(mods => {
                            console.log(mods);
                            if (_.isEmpty(mods)) return res.send({ status: 0, message: "Error in saving the combo" });

                            return res.send({ status: 1, message: "Mod is saved successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }
                else {

                    if (!FormParseObj.fields.id || !FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.price || !FormParseObj.fields.description) return res.send({ status: 0, message: "Enter the valid credentials" });
                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { _id: 1, restaurantId: 1, name: 1, profileImg: 1 };
                    let control = new controller(ModsSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check) && !check._id.equals(FormParseObj.fields.id[0])) return res.send({ status: 0, message: "Item with this name already exists!!" });
                        let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };

                        if (setdata.profileImg && check.profileImg) {
                            fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                                if (err) console.log(err)
                            });
                        }
                        control.UpdateData(filter, setdata).then(mods => {
                            // console.log("done",mods)
                            if (_.isEmpty(mods)) return res.send({ status: 0, message: "Error in updating item data" });

                            return res.send({ status: 1, message: "Mod updated successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        });
    }

    // add update combo in restaurant for admin portal
    AddUpdateCombo(req, res) {

        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });
            console.log(FormParseObj, "FormParseObj")
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreComboImgFile(FormParseObj.files, '/public/uploads/ComboImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                console.log(FileObject);
                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg;
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileThumbnailImg;
                FormParseObj.fields.restaurantId ? setdata.restaurantId = FormParseObj.fields.restaurantId[0] : delete setdata.restaurantId;
                FormParseObj.fields.menuId ? setdata.menuId = FormParseObj.fields.menuId[0] : delete setdata.menuId;
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name;
                FormParseObj.fields.description ? setdata.description = FormParseObj.fields.description[0] : delete setdata.description;
                FormParseObj.fields.totalPrice ? setdata.totalPrice = FormParseObj.fields.totalPrice[0] : delete setdata.totalPrice;
                FormParseObj.fields.item ? setdata.Item = JSON.parse(FormParseObj.fields.item[0]) : delete setdata.Item;
                setdata.modifiedOn = new Date();
                console.log(setdata)

                if (!FormParseObj.fields.id) {

                    if (!FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.totalPrice) return res.send({ status: 0, message: "Enter the valid credentials" });

                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { restaurantId: 1, name: 1 };
                    let control = new controller(ComboSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check)) return res.send({ status: 0, message: "Combo with this name already exist." });

                        control.SaveData(setdata).then(combos => {
                            console.log(combos);
                            if (_.isEmpty(combos)) return res.send({ status: 0, message: "Error in saving the combo" });

                            return res.send({ status: 1, message: "Combo is saved successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }
                else {

                    if (!FormParseObj.fields.id || !FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.totalPrice || !FormParseObj.fields.description && (!FormParseObj.fields.menuId)) return res.send({ status: 0, message: "Enter the valid credentials" });
                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { _id: 1, restaurantId: 1, name: 1, profileImg: 1 };
                    let control = new controller(ComboSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check) && !check._id.equals(FormParseObj.fields.id[0])) return res.send({ status: 0, message: "Item with this name already exists!!" });
                        let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };

                        if (setdata.profileImg && check.profileImg) {
                            fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                                if (err) console.log(err)
                            });
                        }
                        control.UpdateData(filter, setdata).then(combo => {
                            // console.log("done",combo)
                            if (_.isEmpty(combo)) return res.send({ status: 0, message: "Error in updating item data" });

                            return res.send({ status: 1, message: "Combo updated successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        });
    }

    // get item by id in admin portal
    GetItemById(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = { _id: 1, restaurantId: 1, categoryId: 1, name: 1, price: 1, description: 1, profileImg: 1, Mods: 1 };
        let control = new controller(ItemSchema);
        control.GetData(filter, projection).then(item => {
            if (_.isEmpty(item)) return res.send({ status: 0, message: "Invalid Id!!" });

            return res.send({ status: 1, message: "Item found successfully.", data: item });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get mods by id in admin portal
    GetModsById(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = { _id: 1, restaurantId: 1, name: 1, price: 1, description: 1, profileImg: 1 };
        let control = new controller(ModsSchema);
        control.GetData(filter, projection).then(mod => {
            if (_.isEmpty(mod)) return res.send({ status: 0, message: "Invalid Id!!" });

            return res.send({ status: 1, message: "Mod found successfully.", data: mod });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get combo by id in admin portal
    GetComboById(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        // let projection = { _id:1, restaurantId:1, categoryId:1, name:1, totalprice:1, description:1, profileImg:1 };
        let control = new controller(ComboSchema);
        control.GetData(filter, projection).then(combo => {
            if (_.isEmpty(combo)) return res.send({ status: 0, message: "Invalid Id!!" });

            return res.send({ status: 1, message: "Combo found successfully.", data: combo });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get menu by id in admin portal
    GetMenuByID(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { _id: ObjectId(req.params[0]) };
        let control = new restaurantjs(MenuSchema);

        control.MenuAggregate(filter).then(menu => {
            if (_.isEmpty(menu)) return res.send({ status: 0, message: "Menu not found." });

            control.MenuFilter(menu, 'menu').then(menu => {
                if (_.isEmpty(menu)) throw "Error in filtering the menu data";

                return res.send({ status: 1, message: "Menu found.", data: menu[0] });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });

    }

    // add update category in restaurant in admin portal
    AddUpdateCategory(req, res) {

        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });
            console.log(FormParseObj, "FormParseObj")
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreCategoryImgFile(FormParseObj.files, '/public/uploads/CategoryImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                console.log(FileObject, "FileObject");
                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg;
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileThumbnailImg;
                FormParseObj.fields.restaurantId ? setdata.restaurantId = FormParseObj.fields.restaurantId[0] : delete setdata.restaurantId;
                FormParseObj.fields.menuId ? setdata.menuId = FormParseObj.fields.menuId[0] : delete setdata.menuId;
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name;
                FormParseObj.fields.description ? setdata.description = FormParseObj.fields.description[0] : delete setdata.description;
                FormParseObj.fields.Item ? setdata.Item = JSON.parse(FormParseObj.fields.Item[0]) : delete setdata.Item;
                FormParseObj.fields.Combo ? setdata.Combo = JSON.parse(FormParseObj.fields.Combo[0]) : delete setdata.Combo;
                setdata.modifiedOn = new Date();

                if (!FormParseObj.fields.id) {

                    if (!FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.menuId) return res.send({ status: 0, message: "Enter the valid credentials" });

                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), menuId: ObjectId(FormParseObj.fields.menuId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { restaurantId: 1, name: 1, menuId: 1 };
                    let control = new controller(CategorySchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check)) return res.send({ status: 0, message: "Category with this name already exist." });

                        control.SaveData(setdata).then(category => {
                            console.log(category);
                            if (_.isEmpty(category)) return res.send({ status: 0, message: "Error in saving the category" });

                            return res.send({ status: 1, message: "Category is saved successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }
                else {

                    if (!FormParseObj.fields.id || !FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.menuId || !FormParseObj.fields.description) return res.send({ status: 0, message: "Enter the valid credentials" });
                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), menuId: ObjectId(FormParseObj.fields.menuId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { _id: 1, restaurantId: 1, name: 1, menuId: 1, description: 1, profileImg: 1 };
                    let control = new controller(CategorySchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check) && !check._id.equals(FormParseObj.fields.id[0])) return res.send({ status: 0, message: "Category with this name already exists!!" });
                        let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };

                        if (setdata.profileImg && check.profileImg) {
                            fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                                if (err) console.log(err);
                            });
                        }
                        control.UpdateData(filter, setdata).then(category => {
                            if (_.isEmpty(category)) return res.send({ status: 0, message: "Error in updating category" });

                            return res.send({ status: 1, message: "Category is updated successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }
            });
        });

    }

    // app update menu in restaurant in admin portal
    AddUpdateMenu(req, res) {
        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });
            console.log(FormParseObj, "FormParseObj")
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreMenuImgFile(FormParseObj.files, '/public/uploads/MenuImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                console.log(FileObject, 'okkaaaay');
                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg;
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileThumbnailImg;
                FormParseObj.fields.restaurantId ? setdata.restaurantId = FormParseObj.fields.restaurantId[0] : delete setdata.restaurantId;
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name;
                FormParseObj.fields.description ? setdata.description = FormParseObj.fields.description[0] : delete setdata.description;
                FormParseObj.fields.Combo ? setdata.Combo = JSON.parse(FormParseObj.fields.Combo[0]) : delete setdata.Combo;
                setdata.modifiedOn = new Date();

                if (!FormParseObj.fields.id) {
                    if (!FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.description) return res.send({ status: 0, message: "Enter the valid credentials" });

                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { _id: 1, restaurantId: 1, name: 1, description: 1, profileImg: 1 };
                    let control = new controller(MenuSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check)) return res.send({ status: 0, message: "Menu with this name already exists." });

                        control.SaveData(setdata).then(menu => {

                            if (_.isEmpty(menu)) return res.send({ status: 0, message: "Error in saving the menu" });

                            return res.send({ status: 1, message: "Menu is saved successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }
                else {
                    if (!FormParseObj.fields.id || !FormParseObj.fields.restaurantId || !FormParseObj.fields.name || !FormParseObj.fields.description) return res.send({ status: 0, message: "Enter the valid credentials" });

                    let filter = { restaurantId: ObjectId(FormParseObj.fields.restaurantId[0]), name: FormParseObj.fields.name[0] };
                    let projection = { _id: 1, restaurantId: 1, name: 1, description: 1, profileImg: 1 };
                    let control = new controller(MenuSchema);

                    control.GetData(filter, projection).then(check => {

                        if (!_.isEmpty(check) && !check._id.equals(FormParseObj.fields.id[0])) return res.send({ status: 0, message: "Category with this name already exists!!" });
                        let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };

                        if (setdata.profileImg && check.profileImg) {
                            fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                                if (err) console.log(err);
                            });
                        }
                        control.UpdateData(filter, setdata).then(menu => {
                            if (_.isEmpty(menu)) return res.send({ status: 0, message: "Error in updating menu" });

                            return res.send({ status: 1, message: "Menu is updated successfully" });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }
            });
        });
    }

    // delete item in restaurant in admin portal
    DeleteItem(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(ItemSchema);
        control.GetData(filter, projection).then(check => {

            if (_.isEmpty(check) || check.categoryId) return res.send({ status: 0, message: "Item is already assigned to menu." });

            let filter = { _id: ObjectId(req.params[0]) };
            control.DeleteData(filter).then(item => {
                if (_.isEmpty(item)) return res.send({ status: 0, message: "Error in deleting the data" });

                return res.send({ status: 1, message: "Item deleted successfully." });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // delete mod in restaurant in admin portal
    DeleteMods(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { "Mods.modsId": ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(ItemSchema);
        control.GetData(filter, projection).then(check => {

            if (!_.isEmpty(check)) return res.send({ status: 0, message: "Mod is assigned to item." });

            let filter = { _id: ObjectId(req.params[0]) };
            let control = new controller(ModsSchema);
            control.DeleteData(filter).then(mods => {
                if (_.isEmpty(mods)) return res.send({ status: 0, message: "Error in deleting the data" });

                return res.send({ status: 1, message: "Mod deleted successfully." });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // delete combo in restaurant in admin portal
    DeleteCombo(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(ComboSchema);
        control.GetData(filter, projection).then(check => {
            if (_.isEmpty(check) || check.menuId) return res.send({ status: 0, message: "Combo is already assigned to menu." });

            let filter = { _id: ObjectId(req.params[0]) };
            control.DeleteData(filter).then(combo => {
                if (_.isEmpty(combo)) return res.send({ status: 0, message: "Error in deleting the data" });

                return res.send({ status: 1, message: "Combo deleted successfully." });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // delete category in restaurant in admin portal
    DeleteCategory(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { categoryId: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(ItemSchema);
        control.GetMultiData(filter, projection).then(check => {
            if (!_.isEmpty(check)) return res.send({ status: 0, message: "Items are assigned to this group." });

            let filter = { _id: ObjectId(req.params[0]) };
            let control = new controller(CategorySchema);
            control.DeleteData(filter).then(category => {
                if (_.isEmpty(category)) return res.send({ status: 0, message: "Error in deleting the data" });

                return res.send({ status: 1, message: "Category deleted successfully." });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // delete menu in restaurant in admin portal
    DeleteMenu(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { menuId: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(CategorySchema);
        control.GetMultiData(filter, projection).then(check => {
            if (!_.isEmpty(check)) return res.send({ status: 0, message: "Menu has data." });

            let filter = { _id: ObjectId(req.params[0]) };
            let control = new controller(MenuSchema);
            control.DeleteData(filter).then(menu => {
                if (_.isEmpty(menu)) return res.send({ status: 0, message: "Error in deleting the data" });

                return res.send({ status: 1, message: "Menu deleted successfully." });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get category by id in admin portal
    GetCategoryById(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(CategorySchema);
        control.GetData(filter, projection).then(category => {
            if (_.isEmpty(category)) return res.send({ status: 0, message: "Invalid Id!!" });

            let filter = { categoryId: req.params[0] };
            let projection = { _id: 1, name: 1, price: 1 };
            let control = new controller(ItemSchema);
            control.GetMultiData(filter, projection).then(items => {
                if (_.isEmpty(items)) return res.send({ status: 0, message: "Invalid Id!!" });

                return res.send({ status: 1, message: "Category found successfully.", data: category, items: items });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get staff by id in admin portal
    GetStaffById(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(StaffSchema);
        control.GetData(filter, projection).then(staff => {
            if (_.isEmpty(staff)) return res.send({ status: 0, message: "Invalid Id!!" });

            return res.send({ status: 1, message: "Staff found successfully.", staff: staff });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get all foodparty by restaurant in admin portal
    GetAllFoodPartyByRes(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { "restaurants.restaurantId": ObjectId(req.params[0]) };
        let control = new userjs(FoodPartySchema);
        control.getFoodPartyAggregate(filter).then(party => {
            if (_.isEmpty(party)) return res.send({ status: 0, message: "FoodParty not found." });

            control.FoodPartyFilter(party).then(data => {
                if (!data) return res.send({ status: 0, message: "Error in filtering the data" });
                data.reverse();
                return res.send({ status: 1, message: "FoodParty found.", foodparty: data });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get foodparty by id in restaurant in admin portal
    GetFoodPartyById(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials." });

        let filter = { _id: ObjectId(req.params[0]) };
        let projection = {};
        let control = new userjs(FoodPartySchema);
        control.getFoodPartyAggregate(filter, projection).then(foodparty => {
            if (_.isEmpty(foodparty)) return res.send({ status: 0, message: "Invalid Id!!" });

            control.FoodPartyAdminFilter(foodparty).then(data => {
                if (!data) return res.send({ status: 0, message: "Error in filtering the data" });

                data[0].participant.forEach(x => {
                    x.Item.forEach(y => {
                        let index = data[0].restaurants.findIndex(x => x._id.equals(y.restaurantId));
                        if (index > -1) {
                            y.restaurant_name = data[0].restaurants[index].name;
                        }
                    });
                });

                return res.send({ status: 1, message: "Food Party found successfully.", data: data[0] });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get restaurant menu in admin portal
    GetResMenu(req, res) {

        if (!req.params[0]) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { restaurantId: ObjectId(req.params[0]) };
        let control = new restaurantjs(MenuSchema);

        control.MenuAggregate(filter).then(menu => {
            if (_.isEmpty(menu)) return res.send({ status: 0, message: "Menu not found." });

            control.MenuFilter(menu, 'admin').then(menu => {
                if (_.isEmpty(menu)) throw "Error in filtering the menu data";

                return res.send({ status: 1, message: "Menu found.", menu: menu });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // save multiple images for restaurants
    SaveResImage(req, res) {
        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            console.log(FormParseObj, "FormParseObj");
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreMultiImgFile(FormParseObj.files, '/public/uploads/ResImg/', '/uploads/ResImg').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                console.log(FileObject)
                if (!FileObject.length || !FormParseObj.fields.id) return res.send({ status: 0, message: "Please Enter valid details" });

                let filter = { restaurantId: ObjectId(FormParseObj.fields.id[0]) };
                let projection = {};

                let control = new controller(RestaurantImageSchema);
                control.GetData(filter, projection).then(data => {
                    let imgdata = [];
                    FileObject.forEach(img => imgdata.push({ profileImg: img.filePath, profileThumbnailImg: img.profileThumbnailURL }))
                    let add = { restaurantId: ObjectId(FormParseObj.fields.id[0]), Img: imgdata }
                    // let add = { restaurantId: ObjectId(FormParseObj.fields.id[0]), Img: { profileImg: FileObject.filePath, profileThumbnailImg: FileObject.profileThumbnailURL } }
                    if (_.isEmpty(data)) {
                        control.SaveData(add).then(img => {
                            if (!img) throw "Image are not saved";

                            return res.send({ status: 1, message: "Images saved successfully", img: img });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });

                    }
                    if (!_.isEmpty(data)) {
                        FileObject.forEach((img, imgindex) => {
                            let setdata = {};
                            setdata.profileImg = img.filePath;
                            setdata.profileThumbnailImg = img.profileThumbnailURL;
                            setdata.modifiedOn = new Date();
                            let control = new restaurantjs(RestaurantImageSchema);
                            control.PushImageData(filter, setdata).then(img => {
                                if (!img) throw "Images is not updated";

                                (imgindex == (FileObject.length - 1)) ? (res.send({ status: 1, message: "Images added successfully" })) : '';

                            }).catch(error => {
                                return res.send({ status: 0, message: error });
                            });
                        });
                    }
                });
            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        });
    }

    //delete image for restaurant
    DeleteResImage(req, res) {
        console.log(req.params)
        if (!req.params[0] || !req.params[1]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { restaurantId: ObjectId(req.params[0]), Img: { $elemMatch: { _id: ObjectId(req.params[1]) } } };
        let projection = {};
        let control = new controller(RestaurantImageSchema);
        control.GetData(filter, projection).then(check => {
            if (_.isEmpty(check)) return res.send({ status: 0, message: "No Images Found!!" });
            console.log(check, "check")
            let checkindex = check.Img.findIndex(img => img._id == req.params[1]);
            console.log(checkindex, "checkindex")
            if (checkindex > -1) {
                fs.unlink(Path.resolve('./public') + check.Img[checkindex].profileImg, (err) => {
                    if (err) console.log(err)
                });
            }

            let filter = { restaurantId: ObjectId(req.params[0]) };
            let update = { $pull: { "Img": { _id: ObjectId(req.params[1]) } } };
            control.DeleteOneObjData(filter, update).then(image => {
                // console.log(filter, "filer");
                if (_.isEmpty(image)) return res.send({ status: 0, message: "Error in deleting image fof restaurant" });

                return res.send({ status: 1, message: "Image deleted successfully" });
            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

}

module.exports = AdminControl;