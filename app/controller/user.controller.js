var _ = require('lodash');
var userjs = require('../model/user');
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
var UserSchema = require('../model/RegisterSchema').Users;
var FavoriteSchema = require('../model/FavoriteSchema').Favorites;
var StripeController = require('../controller/Stripe.controller');
var FoodPartySchema = require('../model/FoodPartySchema').FoodParty;
var Notification = require('../service/FCM-Notification');
var OrderSchema = require('../model/OrderSchema').Orders;
var StaffSchema = require('../model/StaffSchema').Staff;
var config = require('../../config/config');

class UserControl {

    // constructor(){ super(); }

    // get current user details
    CurrentUser(req, res) {

        if (!req.token) return res.send({ status: 0, message: "Error in getting the user details" });

        let filter = { _id: ObjectId(req.token.id) }
        let control = new userjs(UserSchema);
        control.getuser(filter).then(async (user) => {
            if (_.isEmpty(user)) return res.send({ status: 0, message: "No data found." });

            if (!user[0].customer_stripe_id) {
                // Generate customer.id for stripe payments if null
                let Stripecontrol = new StripeController();
                await Stripecontrol.CreateStripeCustomer(req.email).then(customer => {
                    this.customer = customer;
                    this.customer ? setuser.customer_stripe_id = customer.id : delete setuser.customer_stripe_id;
                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            }
            if (user[0].customer_stripe_id) {
                // Check if the customer_stripe_id exists in stripe
                let Stripecontrol = new StripeController();
                await Stripecontrol.CheckStripeId(user[0].customer_stripe_id, user.token).then(customer => {
                    // let filter = {socialId: user.socialId};
                    let setdata = {};
                    customer ? setdata.customer_stripe_id = customer.id : delete setdata.customer_stripe_id;

                    let control = new controller(UserSchema);
                    control.UpdateData(filter, setdata).then(data => {
                        if (!data) throw "Error in updating customer_stripe_id";

                        let control = new userjs(UserSchema);
                        control.getuser(filter).then(data => {
                            if (_.isEmpty(data)) return res.send({ status: 0, message: "No data found." });

                            return res.send({ status: 1, message: "Data found.", user: data[0] });
                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });
                    });
                });
            }
        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // signup user with register detailsaddstaff
    SignUp(req, res) {

        if (!req.name || !req.email || !req.password || !req.dob || !req.phoneno) return res.send({ status: 0, message: 'Enter the valid credentials' });

        let filter = { email: new RegExp('^' + req.email + '$', "i") };
        let projection = { _id: 1, email: 1, password: 1, createdOn: 1, name: 1, otp: 1, customer_stripe_id: 1 };

        let control = new controller(UserSchema);
        control.GetData(filter, projection).then((user) => {
            if (!_.isEmpty(user)) return res.send({ status: 0, message: "User already exists" });

            var bcrypt = new controller();
            req.password = bcrypt.bcryptpass(req.password);
            // Generate random 4 digit otp
            let otp = Math.floor(1000 + Math.random() * 9000);

            // Generate customer.id for stripe payments
            let control = new StripeController();
            control.CreateStripeCustomer(req.email).then(customer => {

                if (_.isEmpty(customer)) throw "Error in creating customer for stripe";
                let userdata = {
                    name: req.name,
                    email: req.email,
                    password: req.password,
                    dob: req.dob,
                    phoneNo: req.phoneno,
                    otp: otp,
                    customer_stripe_id: customer.id
                }

                // sms code for otp

                let control = new controller(UserSchema);
                control.SaveData(userdata).then((createduser) => {
                    if (!createduser) return res.send({ status: 0, message: "Error please signup again later" });

                    return res.send({ status: 1, message: "User save successfully" });

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

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // user signin using email and password or social login
    LogIn(req, res) {

        if (req.socialType == 'email') {
            if (!req.email || !req.password) return res.send({ status: 0, message: "Please Enter all the credentials" });

            let filter = { email: new RegExp('^' + req.email + '$', "i") };
            let projection = { createdOn: 0, modifiedOn: 0, __v: 0 };

            let control = new controller(UserSchema);
            control.GetData(filter, projection).then(async (user) => {
                console.log(user, "user");
                if (_.isEmpty(user)) return res.send({ status: 0, message: "User does not exists" })
                let customer;

                Bcrypt.compare(req.password, user.password).then(async (response) => {
                    if (!response) return res.send({ status: 0, message: "Enter the valid password" });

                    let filter = { _id: user._id };
                    let setuser = {};
                    if (!user.customer_stripe_id) {
                        // Generate customer.id for stripe payments if null
                        let Stripecontrol = new StripeController();
                        await Stripecontrol.CreateStripeCustomer(req.email).then(customer => {
                            this.customer = customer;
                            this.customer ? setuser.customer_stripe_id = customer.id : delete setuser.customer_stripe_id;
                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });
                    }
                    if (user.customer_stripe_id) {
                        // Check if the customer_stripe_id exists in stripe
                        let Stripecontrol = new StripeController();
                        await Stripecontrol.CheckStripeId(user.customer_stripe_id, req.email).then(customer => {
                            this.customer = customer;
                            this.customer ? setuser.customer_stripe_id = customer.id : delete setuser.customer_stripe_id;
                        }).catch(error => {
                            console.log(error);
                            return res.send({ status: 0, message: error });
                        });
                    }

                    setuser.deviceToken = req.deviceToken;
                    setuser.socialType = 'email';
                    setuser.socialId = '';
                    setuser.modifiedOn = new Date();
                    setuser.last_signedIn = new Date();
                    let control = new controller(UserSchema);
                    control.UpdateData(filter, setuser).then((upuser) => {
                        if (!upuser) throw "User is not updated";

                        let authtoken = new jwtToken();
                        authtoken.GenerateToken(upuser._id).then((token) => {
                            if (!token) throw "Error in generating token";
                            upuser.token = token;
                            // console.log(token)

                            let control = new userjs(UserSchema);
                            control.getuser(filter).then(data => {
                                if (_.isEmpty(data)) return res.send("Error in getting UserData");

                                return res.send({ status: 1, message: "User is authenticated successfully", token: token, user: data[0] })
                            }).catch(error => {
                                return res.send({ status: 0, message: error });
                            });
                            // return res.send({status:1, message:"User is authenticated successfully", user:upuser,token:token});
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
        else if (req.socialType == 'facebook' || req.socialType == 'gmail') {

            if (!req.email && !req.socialId) return res.send({ status: 0, message: "Please Enter correct " + req.socialType + " credentials" });

            let filter = { $or: [{ socialId: req.socialId }, { email: req.email }] };
            let projection = {};

            let control = new controller(UserSchema);
            control.GetData(filter, projection).then(async (user) => {

                if (_.isEmpty(user)) {

                    let userdata = {};
                    req.socialType ? (userdata.socialType = req.socialType) : delete userdata.socialType;
                    req.socialId ? (userdata.isVerified = true) : delete userdata.isVerified;
                    req.socialId ? (userdata.socialId = req.socialId) : delete userdata.socialId;
                    req.email ? (userdata.email = req.email) : delete userdata.email;

                    // Generate customer.id for stripe payments
                    let control = new StripeController();
                    control.CreateStripeCustomer(req.socialId).then(customer => {
                        if (_.isEmpty(customer)) throw "Error in creating customer for stripe";

                        userdata.customer_stripe_id = customer.id;
                        let control = new controller(UserSchema);
                        control.SaveData(userdata).then(createduser => {
                            if (_.isEmpty(createduser)) return res.send({ status: 0, message: "Error in login with " + req.socialType + " credentials" });

                            let authtoken = new jwtToken();
                            authtoken.GenerateToken(createduser._id).then((token) => {
                                if (!token) throw "Error in generating token";

                                let control = new userjs(UserSchema);
                                control.getuser(filter).then(data => {
                                    if (_.isEmpty(data)) return res.send("Error in getting UserData");

                                    return res.send({ status: 1, message: "User is successfully saved with " + req.socialType + " credentials", user: data[0], token: token });

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
                        res.send({ status: 0, message: error });
                    });

                }

                if (!_.isEmpty(user) && user.isVerified == true) {

                    let authtoken = new jwtToken();
                    authtoken.GenerateToken(user._id).then(async (token) => {
                        if (!token) throw "Error in generating token";

                        if (user.email && req.email == user.email) {

                            let filter = { email: user.email };
                            let setdata = {}
                            if (!user.customer_stripe_id) {
                                console.log("don't have stripe id")
                                // Generate customer.id for stripe payments if null
                                let Stripecontrol = new StripeController();
                                await Stripecontrol.CreateStripeCustomer(req.email).then(customer => {
                                    this.customer = customer;
                                    this.customer ? setdata.customer_stripe_id = customer.id : delete setdata.customer_stripe_id;
                                }).catch(error => {
                                    return res.send({ status: 0, message: error });
                                });
                            }
                            if (user.customer_stripe_id) {
                                console.log("already have stripe id")
                                // Check if the customer_stripe_id exists in stripe
                                let Stripecontrol = new StripeController();
                                await Stripecontrol.CheckStripeId(user.customer_stripe_id, req.email).then(customer => {
                                    this.customer = customer;
                                    this.customer ? setdata.customer_stripe_id = customer.id : delete setdata.customer_stripe_id;
                                    console.log(setdata, "setdatasetdatasetdatasetdata")
                                }).catch(error => {
                                    return res.send({ status: 0, message: error });
                                });
                            }
                            setdata.socialType = req.socialType;
                            setdata.socialId = req.socialId;
                            setdata.modifiedOn = new Date();
                            console.log(setdata, "setdata")

                            control.UpdateData(filter, setdata).then(user => {

                                if (!user) throw 'Error in updating with ' + req.socialType + ' credentials';
                                user.token = token;

                                let control = new userjs(UserSchema);
                                control.getuser(filter).then(data => {
                                    if (_.isEmpty(data)) return res.send("Error in getting UserData");

                                    return res.send({ status: 1, message: "user account is linked with " + req.socialType + " credentials", user: data[0], token: token });

                                }).catch(error => {
                                    return res.send({ status: 0, message: error });
                                });

                            }).catch(error => {
                                return res.send({ status: 0, message: error });
                            });
                        }
                        else {
                            user.token = token;

                            if (user.customer_stripe_id) {
                                console.log("already have stripe id")
                                // Check if the customer_stripe_id exists in stripe
                                let Stripecontrol = new StripeController();
                                await Stripecontrol.CheckStripeId(user.customer_stripe_id, user.socialId).then(customer => {
                                    let filter = { socialId: user.socialId };
                                    let setdata = {};
                                    customer ? setdata.customer_stripe_id = customer.id : delete setdata.customer_stripe_id;
                                    // console.log(setdata,"setdatasetdatasetdatasetdata")

                                    let control = new controller(UserSchema);
                                    control.UpdateData(filter, setdata).then(data => {
                                        if (!data) throw "Error in updating customer_stripe_id";

                                        let control = new userjs(UserSchema);
                                        control.getuser(filter).then(data => {
                                            if (_.isEmpty(data)) return res.send("Error in getting UserData");

                                            return res.send({ status: 1, message: "User already register with " + req.socialType + " credentials", token: token, user: data[0] });
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

                        }

                    }).catch((error) => {
                        return res.send({ status: 0, message: error });
                    });//////
                }
                if (!_.isEmpty(user) && user.isVerified == false) {

                    let control = new userjs(UserSchema);
                    control.getuser(filter).then(data => {
                        if (_.isEmpty(data)) return res.send("Error in getting UserData");

                        return res.send({ status: 1, message: req.socialType + " User exist but not verified", user: data[0], token: "" });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });
                }
            }).catch(error => {
                return res.send({ status: 0, message: error });
            });
        }
    }

    // signout/logout for user
    SignOut(req, res) {

        let reqid = req.params[0];
        if (!reqid) return res.send({ status: 0, message: "Bad Request. Invalid Id" });
        // , isVerified: true
        let filter = { _id: ObjectId(reqid) };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1, password: 1, isVerified: 1, deviceToken: 1 };

        let control = new controller(UserSchema);
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

    // verify the otp for user
    VerifyOTP(req, res) {

        if (!req.id || !req.otp) return res.send({ status: 0, message: 'Enter the valid credentials' });

        let filter = { _id: ObjectId(req.id), otp: req.otp };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1 };

        let control = new controller(UserSchema);
        control.GetData(filter, projection).then((user) => {
            if (_.isEmpty(user)) return res.send({ status: 0, message: "Invalid OTP" });

            // check time before verifying(not greater than 1 min)
            DateHelper.calculateTimeDifference(new Date(), user.modifiedOn).then(min => {
                if (min > 1) return res.send({ status: 0, message: "OTP is Expired" });

                let filter = { _id: user._id };
                let setdata = { otp: "", isVerified: true };

                control.UpdateData(filter, setdata).then((user) => {
                    if (!user) return res.send({ status: 0, message: "user is not updated" });

                    return res.send({ status: 1, message: "user account is verified successfully" });
                });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // resend the otp via 
    ReSendOTP(req, res) {
        if (!req.phoneNo) return res.send({ status: 0, message: 'Please enter correct email' });

        let filter = { phoneNo: req.phoneNo };
        // let filter = {email: new RegExp('^'+req.email+'$', "i")};
        let projection = { _id: 1, email: 1, createdOn: 1, otp: 1, phoneNo: 1, isVerified: 1 };

        let control = new controller(UserSchema);
        control.GetData(filter, projection).then((user) => {
            console.log(user)
            if (!_.isEmpty(user) && user.isVerified == true) throw 'User is already registered';

            let otp = Math.floor(1000 + Math.random() * 9000);
            let phoneNo = req.phoneNo;

            // sms code for otp

            let filter = { phoneNo: phoneNo };
            let setdata = {
                otp: otp, modifiedOn: new Date()
            };
            control.UpdateData(filter, setdata).then((user) => {

                if (!user) throw "User is not updated with resendotp";

                return res.send({ status: 1, message: "otp is sucessfully resend to the user", user: user });
            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // forgot/reset password
    ForgotPassword(req, res) {

        if (!req.email || !validator.validate(req.email)) return res.send({ status: 0, message: 'Please enter correct email' });

        let filter = { email: new RegExp('^' + req.email + '$', "i") };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1 };

        let control = new controller(UserSchema);
        control.GetData(filter, projection).then((user) => {
            console.log(user)
            if (_.isEmpty(user)) throw "User doesn't exist";
            if (!_.isEmpty(user) && (user.forgotToken && user.forgotToken != "")) throw 'Recover password link is already sent to the registered email.';

            crypto.randomBytes(48, (err, buffer) => {
                if (err) throw "error in generating verifyToken";
                let verifyToken = buffer.toString('hex');
                var ForgetPassLink = '';
                var ForgetPassLink = config.ServerLink + config.UserForgetPassLink + verifyToken + '&id=' + user._id;

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

    // reset password
    ResetPassword(req, res) {

        if (!req.token || !req.password || !req.id) return res.send({ status: 0, message: "Please enter all the details" });

        let filter = { _id: ObjectId(req.id) };
        let projection = { _id: 1, email: 1, createdOn: 1, modifiedOn: 1, forgotToken: 1 };

        let control = new controller(UserSchema);
        control.GetData(filter, projection).then((user) => {
            if (_.isEmpty(user)) return res.send({ status: 0, message: "User with above details doesn't exist" });
            if (!_.isEmpty(user) && !user.forgotToken) return res.send({ status: 0, message: "Link is expired" });

            DateHelper.calculateTimeDifference(new Date(), user.modifiedOn).then((min) => {
                console.log(min, "min")
                if (min > 2) {
                    let setdata = { forgotToken: "", modifiedOn: new Date() };
                    control.UpdateData(filter, setdata).then((user) => {
                        if (_.isEmpty(user)) return res.send({ status: 0, message: "User is not updated with the Link expired" });

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

    // change the password
    ChangePassword(req, res) {

        if (!req.id || !req.oldpassword || !req.newpassword) return res.send({ status: 0, message: "Please enter the valid credentials" });

        let filter = { _id: ObjectId(req.id) };
        let projection = { _id: 1, email: 1, password: 1, socialType: 1, createdOn: 1, modifiedOn: 1 };
        let bcrypt = new controller();

        let control = new controller(UserSchema);
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

    // update the user profile
    UpdateProfile(req, res) {

        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if (_.isEmpty(FormParseObj)) return res.send({ status: 0, message: "FormNull" });

            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreProfileImgFile(FormParseObj.files, '/public/uploads/ProfileImg/').then((FileObj) => {
                    if (!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {

                if (!FormParseObj.fields.id || (!FormParseObj.fields.name && !FormParseObj.fields.email && !FormParseObj.fields.dob && !FormParseObj.fields.phoneNo)) return res.send({ status: 0, message: "Please Enter correct details" });

                let filter = { _id: ObjectId(FormParseObj.fields.id[0]) };
                let setdata = {};
                FileObject != null ? setdata.profileImg = FileObject.filePath : delete setdata.profileImg
                FileObject != null ? setdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete setdata.profileprofileThumbnailImgImg
                FormParseObj.fields.name ? setdata.name = FormParseObj.fields.name[0] : delete setdata.name
                FormParseObj.fields.email ? setdata.email = FormParseObj.fields.email[0] : delete setdata.email
                FormParseObj.fields.dob ? setdata.dob = FormParseObj.fields.dob[0] : delete setdata.dob
                FormParseObj.fields.phoneNo ? setdata.phoneNo = FormParseObj.fields.phoneNo[0] : delete setdata.phoneNo
                setdata.modifiedOn = new Date();

                let control = new controller(UserSchema);
                control.UpdateData(filter, setdata).then(user => {

                    if (!user) throw "User is not updated";
                    let data = {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        dob: user.dob,
                        phoneNo: user.phoneNo,
                        socialId: user.socialId,
                        socialType: user.socialType,
                        customer_stripe_id: user.customer_stripe_id,
                        profileThumbnailImg: user.profileThumbnailImg,
                    }
                    return res.send({ status: 1, message: "UserProfile is updated successfully", user: data });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        });
    }

    // favorite/unfavorite restaurant for user
    FavUnfav(req, res) {

        let userId = req.params[0];
        if (!userId) return res.send({ status: 0, message: "Bad Request. Invalid Id" });
        let request = req.body[0];
        if (!userId || (!request.op && !request.restaurantId)) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { restaurantId: ObjectId(request.restaurantId), userId: ObjectId(userId) };
        let projection = {};
        let control = new controller(FavoriteSchema);

        control.GetData(filter, projection).then((user) => {

            let data = { restaurantId: ObjectId(request.restaurantId), userId: ObjectId(userId) }
            if (request.op == "add") {
                if (!_.isEmpty(user)) return res.send({ status: 0, message: "Restaurant already exist in favorites" });

                control.SaveData(data).then(user => {
                    if (!user) throw "Error in updating user";

                    let control = new userjs(UserSchema);
                    let filter = { _id: ObjectId(userId) }
                    control.getuser(filter).then(data => {
                        if (_.isEmpty(data)) return res.send("Error in getting UserData");

                        return res.send({ status: 1, message: "Restaurant is added to the favorite list", user: data[0] })
                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            }
            if (request.op == "remove") {
                console.log(data, "data")
                if (_.isEmpty(user)) return res.send({ status: 0, message: "Restaurant doesn't exist in favorites" });

                control.DeleteData(data).then(data => {
                    if (!data) throw "Error in deleting the data";

                    let control = new userjs(UserSchema);
                    let filter = { _id: ObjectId(userId) }
                    control.getuser(filter).then(data => {
                        if (_.isEmpty(data)) return res.send("Error in getting UserData");

                        return res.send({ status: 1, message: "Restaurant is removed from the favorite list", user: data[0] })
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
    }

    // favorite restaurant list for user
    GetFavorites(req, res) {

        let userid = ObjectId(req.params[0]);
        if (!userid) return res.send({ status: 0, message: "Bad Request. Invalid Id" });

        let filter = { userId: userid };
        let control = new userjs(FavoriteSchema);
        control.FavoriteAggregate(filter).then(data => {
            if (_.isEmpty(data)) return res.send({ status: 0, message: "Favorites not found" });

            return res.send({ status: 1, message: "Favorites are found for the users.", favorites: data });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // foodparty for user
    FoodParty(req, res) {
        if (!req.userId || !req.billingScheme || !req.participants || !req.restaurants) return res.send({ status: 0, message: "Enter the valid credentials" });
        // || !req.datetime 

        let setdata = {};
        req.userId ? setdata.userId = req.userId : delete setdata.userId;
        req.billingScheme ? setdata.billingScheme = req.billingScheme : delete setdata.billingScheme;
        // req.datetime ? setdata.datetime = req.datetime : delete setdata.datetime;
        setdata.orderStatus = "inviting";
        req.participants ? setdata.participants = req.participants : delete setdata.participants;
        req.restaurants ? setdata.restaurants = req.restaurants : delete setdata.restaurants;
        req.participants ? req.participants.push({ userId: req.userId }) : req.participants;

        let control = new controller(FoodPartySchema);
        control.SaveData(setdata).then((party) => {
            if (_.isEmpty(party)) return res.send({ status: 0, message: "Error in saving the data" });

            let filter = { _id: party._id };
            let control = new userjs(FoodPartySchema);

            control.getFoodPartyAggregate(filter).then(foodparty => {
                if (_.isEmpty(foodparty)) return res.send({ status: 0, message: "Error in getting the data" });

                // notify users for foodparty
                let usersid = [];
                foodparty.forEach(Element => { Element.participants.forEach(x => { if (!x.userId.equals(req.userId)) { usersid.push(x.userId); } }); });
                let filter = { _id: { $in: usersid } };
                let projection = { deviceToken: 1 };
                let control = new controller(UserSchema);
                control.GetMultiData(filter, projection).then(data => {
                    if (!data) throw "Error in getting the user data";

                    data.forEach(x => {
                        if (x.deviceToken) {
                            let message = {
                                to: x.deviceToken, notification: {
                                    title: 'FoodParty invitation',
                                    body: 'You are invited to join the foodparty'
                                }, data: {
                                    type: 'foodparty',
                                    id: party.id
                                }
                            };
                            let notify = new Notification();
                            notify.PushNotification(message);
                        }
                    });

                    let control = new userjs(FoodPartySchema);
                    control.FoodPartyFilter(foodparty).then(data => {
                        if (!data) return res.send({ status: 0, message: "Error in filtering the data" });

                        return res.send({ status: 1, message: "FoodParty is added successfully", foodparty: data });

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

    // delete foodparty for a user
    DeleteParty(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { _id: ObjectId(req.params[0]) };
        let control = new controller(FoodPartySchema);
        control.DeleteData(filter).then(party => {
            if (_.isEmpty(party)) return res.send({ status: 0, message: "Error in deleting the party data" });

            return res.send({ status: 1, message: "Food Party is deleted successfully" });
        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // get the foodparty for a user
    GetFoodParty(req, res) {
        if (!req.params[0]) return res.send({ status: 0, message: "Enter the valid credentials" });

        let filter = { $or: [{ userId: ObjectId(req.params[0]) }, { "participants.userId": ObjectId(req.params[0]) }] };
        let control = new userjs(FoodPartySchema);
        control.getFoodPartyAggregate(filter).then(party => {
            if (_.isEmpty(party)) return res.send({ status: 0, message: "FoodParty not found." });

            control.FoodPartyFilter(party).then(data => {
                if (!data) return res.send({ status: 0, message: "Error in filtering the data" });

                return res.send({ status: 1, message: "FoodParty found.", foodparty: data });

            }).catch(error => {
                return res.send({ status: 0, message: error });
            });

        }).catch(error => {
            return res.send({ status: 0, message: error });
        });
    }

    // update the foodparty for the user
    async UpdateFoodParty(req, res) {
        if (!req.id || (!req.userId && !req.billingScheme && !req.datetime && !req.participants && !req.restaurants && !req.items && !req.orderStatus)) return res.send({ status: 0, message: "Enter the valid credentials" });
        console.log(req.orderStatus, "orderstatus")
        // check the item added or not for status outstanding
        let promise = new Promise((resolve) => {
            if (req.orderStatus == "outstanding") {
                console.log("inside if outstanding")
                let filter = { _id: ObjectId(req.id), 'participants.Item': { $exists: true, $not: { $size: 0 } } };
                let projection = {};
                console.log(filter, "filter")
                let control = new controller(FoodPartySchema);
                control.GetData(filter, projection).then(data => {
                    console.log(data, "data")
                    if (!_.isEmpty(data)) {
                        let filter = { _id: ObjectId(req.id) };
                        let setdata = { orderStatus: req.orderStatus };
                        let control = new controller(FoodPartySchema);
                        control.UpdateData(filter, setdata).then(updateFP => {
                            console.log(updateFP, "updateFP")
                            if (_.isEmpty(updateFP)) return res.send({ status: 0, message: "Error in updating the data" });

                            return res.send({ status: 1, message: "Food Party is updated successfully." })

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });
                    }
                    else return res.send({ status: 0, message: "Food Party is not ready for outstanding because all participants not order yet." })
                });
            }
            else if (req.orderStatus == "finished") {
                let filter = { _id: ObjectId(req.id) };
                let projection = {};
                let control = new controller(FoodPartySchema);
                control.GetData(filter, projection).then(check => {
                    if (_.isEmpty(check)) return res.send({ status: 0, message: "Invalid Food Party Id!!" });

                    // let filter = { _id:(req.id) };
                    let setdata = { orderStatus: "finished" };
                    let control = new controller(FoodPartySchema);
                    control.UpdateData(filter, setdata).then(foodparty => {
                        if (_.isEmpty(foodparty)) return res.send({ status: 0, message: "Error in updating foodparty status" });

                        return res.send({ status: 1, message: "Food Party is updated successfully." });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            }
            else if (req.orderStatus == "payall") {
                if (!req.payment_mode) return res.send({ status: 0, message: "Enter the valid credentials." });

                let filter = { _id: ObjectId(req.id) };
                let projection = {};
                let control = new controller(FoodPartySchema);
                control.GetData(filter, projection).then(check => {
                    if (_.isEmpty(check)) return res.send({ status: 0, message: "Invalid Food Party Id!!" });

                    let setdata = { orderStatus: "payall" };
                    let control = new controller(FoodPartySchema);
                    control.UpdateData(filter, setdata).then(foodparty => {
                        if (_.isEmpty(foodparty)) return res.send({ status: 0, message: "Error in updating foodparty status" });

                        // change the order status to pending for foodparty-->start
                        let filter = { foodpartyId: ObjectId(req.id), status: "queued" };
                        let projection = {};
                        let control = new controller(OrderSchema);
                        control.GetMultiData(filter, projection).then(orderdata => {
                            if (!orderdata) throw "Error in getting orderdata of foodparty";
                            let orderids = [];
                            orderdata.forEach(x => {
                                orderids.push(x._id);
                                // store the order history record ===> start
                                let historydata = { orderId: ObjectId(x._id), status: "pending" }
                                let control = new controller(OrderHistory);
                                console.log(historydata, "historydata")
                                control.SaveData(historydata).then(history => {
                                    if (_.isEmpty(history)) return res.send({ status: 0, message: "Error in saving the order history data" });
                                    console.log("Order history saved");
                                }).catch(error => {
                                    return res.send({ status: 0, message: error });
                                });
                                // store the order history record ===> end
                            });
                            let filter = { _id: { $in: orderids } };
                            let setdata = { status: "pending", payment_mode: req.payment_mode, modifiedOn: new Date() };
                            // let setdata = {};
                            control.UpdateManyData(filter, setdata).then(data => {
                                if (!data) throw "Error in updating order status";

                                orderdata.forEach(x => x.restaurantInfo.forEach(ids => {
                                    let filter = { "restaurantId": ObjectId(ids.restaurantId), role: "owner" };
                                    let projection = { deviceToken: 1 };
                                    let control = new controller(StaffSchema);
                                    control.GetMultiData(filter, projection).then(data1 => {
                                        if (!data1) throw "Error in getting the restaurant deviceToken";

                                        data1.forEach(y => {
                                            if (y.deviceToken) {
                                                let message = {
                                                    to: y.deviceToken, notification: {
                                                        title: 'New Order',
                                                        body: 'You recieved new order.'
                                                    }, data: {
                                                        type: 'order',
                                                        status: x.status
                                                    }
                                                };
                                                let notify = new Notification();
                                                notify.PushNotification(message);
                                            }
                                        });

                                    }).catch(error => {
                                        return res.send({ status: 0, message: error });
                                    });
                                }));

                            }).catch(error => {
                                return res.send({ status: 0, message: error });
                            });

                        }).catch(error => {
                            return res.send({ status: 0, message: error });
                        });
                        // change the order status to pending for foodparty-->end
                        return res.send({ status: 1, message: "Food Party is updated successfully." });

                    }).catch(error => {
                        return res.send({ status: 0, message: error });
                    });

                }).catch(error => {
                    return res.send({ status: 0, message: error });
                });
            }
            else { console.log("inside else"); resolve(null); }
        });

        promise.then(checkdata => {
            console.log(checkdata, "checkdata")
            // if(checkdata == null) return res.send({status:0, message:"Food Party is not ready for outstanding because all participants not order yet."})
            let filter = { _id: ObjectId(req.id) };
            let projection = {};
            let control = new controller(FoodPartySchema);
            control.GetData(filter, projection).then(party => {
                if (_.isEmpty(party)) return res.send({ status: 0, message: "FoodParty doesn't exists" });

                let filter = { _id: ObjectId(party._id) };
                let setdata = {};
                // req.participants ? req.participants.push({userId:req.userId}) : req.participants;
                req.orderStatus ? setdata.orderStatus = req.orderStatus : delete setdata.orderStatus;
                req.userId ? setdata.userId = req.userId : delete setdata.userId;
                req.billingScheme ? setdata.billingScheme = req.billingScheme : delete setdata.billingScheme;
                // req.datetime ? setdata.datetime = req.datetime : delete setdata.datetime;
                req.participants ? setdata.participants = req.participants : delete setdata.participants;
                req.restaurants ? setdata.restaurants = req.restaurants : delete setdata.restaurants;
                console.log(filter, setdata, "filter,setdata")
                control.UpdateData(filter, setdata).then(updata => {
                    if (_.isEmpty(updata)) return res.send({ status: 0, message: "Error in updating the data" });

                    let filter = { _id: ObjectId(party._id) };
                    let control = new userjs(FoodPartySchema);
                    control.getFoodPartyAggregate(filter).then(foodparty => {
                        if (_.isEmpty(foodparty)) return reject({ status: 0, message: "Error in getting the data" });

                        // notify
                        let filter = { _id: ObjectId(party._id), 'participants.Item': { $exists: true, $not: { $size: 0 } } };
                        let projection = {};
                        let control = new controller(FoodPartySchema);
                        control.GetData(filter, projection).then(data => {
                            if (!_.isEmpty(data)) {
                                // notify foodparty creater if the all item are updated
                                if (updata.orderStatus == "inviting") {
                                    let filter = { _id: ObjectId(req.userId) };
                                    let projection = { deviceToken: 1 };
                                    let control = new controller(UserSchema);
                                    control.GetData(filter, projection).then(userdata => {
                                        if (!userdata) throw "Error in getting the user data";
                                        if (userdata.deviceToken) {
                                            let message = {
                                                to: userdata.deviceToken, notification: {
                                                    title: 'FoodParty is ready',
                                                    body: 'Your foodparty is ready for outstanding.'
                                                }, data: {
                                                    type: 'foodparty',
                                                    id: req.id
                                                }
                                            };
                                            let notify = new Notification();
                                            notify.PushNotification(message);
                                        }
                                    });
                                }
                                //change the order status for foodparty orders and notify the restaurants
                                // else if(updata.orderStatus == "outstanding"){
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
                                // }

                            }
                        });

                        let controll = new userjs(FoodPartySchema);
                        controll.FoodPartyFilter(foodparty).then(data => {
                            if (!data) return res.send({ status: 0, message: "Error in filtering the data" });

                            return res.send({ status: 1, message: "FoodParty is updated successfully", foodparty: data });

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
        });
    }

}

module.exports = UserControl;

// signin with sqlite3 db connection
// LogIn(req,res){

//     if(!req.email || !req.password) return res.send({status:0, message:"Enter the valid crdentials"});

//     let data = {email: req.email , password: req.password};

//     this.getuser(data).then((user) => {
//         if(_.isEmpty(user)) return this.res.send({status:0, message:"User does not exists"})
//         console.log("user",user);

//         let setdata = {updated_dt: new Date(),email:user.email};

//         this.updateuser(setdata).then((upuser) => {
//             // if(_.isEmpty(upuser)) return this.res.send({status:0, message:"User is not updated"})

//             console.log("upuser",upuser)

//         }).catch((error) => {
//            return this.res.send({status:0, message:error});
//         });
//     }).catch((error) => {
//         return this.res.send({status:0, message:error});
//     });

// }