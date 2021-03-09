var _ = require('lodash');
var Bcrypt = require('bcrypt');
var controller = require('../controller/controller');
var validator = require("email-validator");
var jwtToken = require('../service/AuthToken');
let ObjectId = require('mongodb').ObjectID;
var login_account = require('../model/Login_AccountSchema').Login_Account;
var login_detail = require('../model/Login_DetailSchema').Login_Detail;
var Form = require('../service/Form');
var File = require('../service/File');
var fs = require('fs');
var Path = require('path');

class admin {

    // get user of admin portal i.e. restaurant_master
    GetAllUsers(req,res){

        if(!req.params[0]) return res.send({status:0, message:"Enter the valid credentials."});

        let filter = { userId:ObjectId(req.params[0]), role:"admin_master"};
        let projection = {};
        let control = new controller(login_detail);
        control.GetData(filter,projection).then(check => {
            if(_.isEmpty(check)) return res.send({status:0, message:"Invalid ID!!"});

            let filter = { role:"restaurant_master" };
            let lookup = {
                "from" : "login_accounts",
                "localField" : "userId",
                "foreignField" : "_id",
                "as" : "userdata" 
            };
            let unwind = '$userdata';
            let projection = { 
                _id:"$userdata._id",
                status:1,username:1,role:1,
                name:"$userdata.name", email:"$userdata.email", profileImg:"$userdata.profileImg"
            };
            let control = new controller(login_detail);
            control.AggregateData(filter,lookup,unwind,projection).then(data => {
                if(_.isEmpty(data)) return res.send({status:0, message:"No Users Found."}) ;
    
                return res.send({status:1,message:"Users found successfully", data:data});
    
            }).catch(error => {
                return res.send({status:0, message:error});
            });

        }).catch(error => {
            return res.send({status:0, message:error});
        });
    }

    // get user by id in admin portal
    GetUserById(req,res){
        // console.log(req.params);
        if(!req.params[0]) return res.send({status:0, message:"Enter the valid credentials."});
        let filter = { userId:ObjectId(req.params[0]) };
        let projection = {};
        let control = new controller(login_detail);
        control.GetData(filter,projection).then(check => {
            if(_.isEmpty(check)) return res.send({status:0, message:"Invalid ID!!"});

            // let filter = { role:"restaurant_master" };
            let lookup = {
                "from" : "login_accounts",
                "localField" : "userId",
                "foreignField" : "_id",
                "as" : "userdata" 
            };
            let unwind = '$userdata';
            let projection = { 
                _id:"$userdata._id",
                status:1,username:1,role:1,
                name:"$userdata.name", email:"$userdata.email", profileImg:"$userdata.profileImg"
            };
            let control = new controller(login_detail);
            control.AggregateData(filter,lookup,unwind,projection).then(data => {
                if(_.isEmpty(data)) return res.send({status:0, message:"No Users Found."}) ;
    
                return res.send({status:1,message:"Users found successfully", data:data[0]});
    
            }).catch(error => {
                return res.send({status:0, message:error});
            });

        }).catch(error => {
            return res.send({status:0, message:error});
        });
    }

    // update user in admin portal
    UpdateUser(req,res){
        let form = new Form();
        form.Parse(req).then((FormParseObj) => {
            if(_.isEmpty(FormParseObj)) return res.send({status:0, message:"FormNull"});
            console.log(FormParseObj,"FormParseObj")
            let promise = new Promise((resolve) => {
                let file = new File();
                file.StoreAdminUserImgFile(FormParseObj.files,'/public/uploads/AdminUsersImg/').then((FileObj) => {
                    if(!FileObj) return resolve(null);

                    return resolve(FileObj);
                });
            });

            promise.then(FileObject => {
                console.log(FileObject,'FileObject');
                let accountdata = {};
                FileObject != null ? accountdata.profileImg = FileObject.filePath : delete accountdata.profileImg;
                FileObject != null ? accountdata.profileThumbnailImg = FileObject.profileThumbnailURL : delete accountdata.profileThumbnailImg;
                FormParseObj.fields.name ? accountdata.name = FormParseObj.fields.name[0] : delete accountdata.name;
                FormParseObj.fields.email ? accountdata.email = FormParseObj.fields.email[0] :delete accountdata.email;
                accountdata.modifiedOn = new Date();
                
                let detaildata = {};
                FormParseObj.fields.username ? detaildata.username = FormParseObj.fields.username[0] : delete detaildata.username;
                FormParseObj.fields.status ? detaildata.status = FormParseObj.fields.status[0] : delete detaildata.status;
                detaildata.modifiedOn = new Date();

                if(!FormParseObj.fields.id || !FormParseObj.fields.name || !FormParseObj.fields.username || !FormParseObj.fields.status || !FormParseObj.fields.email) return res.send({status:0, message:"Enter the valid credentials"});
                let filter = { username:FormParseObj.fields.username[0] };
                let projection = { userId:1, username:1 };
                let control = new controller(login_detail);
                
                control.GetData(filter,projection).then(check => {

                    if(!_.isEmpty(check) && !check.userId.equals(FormParseObj.fields.id[0])) return res.send({status:0, message:"Username already exists!!"});
                    
                    let filter = { email:FormParseObj.fields.email[0] };
                    let projection = { };
                    let control = new controller(login_account);

                    control.GetData(filter,projection).then(checkmail => {
                        
                        if(!_.isEmpty(checkmail) && !checkmail._id.equals(FormParseObj.fields.id[0]) && checkmail.email == FormParseObj.fields.email[0]) return res.send({status:0, message:"Email already exists!!"});

                        if(accountdata.profileImg && check.profileImg){
                            fs.unlink(Path.resolve('./public') + check.profileImg, (err) => {
                                if(err) console.log(err)
                            });
                        }
    
                        let filter = { userId:ObjectId(FormParseObj.fields.id[0]) };
                        let control = new controller(login_detail);
                        control.UpdateData(filter,detaildata).then(detailuserdata => {
                            
                            if(_.isEmpty(detailuserdata)) return res.send({status:0, message:"Error in updating login_detail user data"});
    
                            let filterr = { _id:ObjectId(FormParseObj.fields.id[0]) };
                            let control = new controller(login_account);
                            control.UpdateData(filterr,accountdata).then(accountuserdata => {
                            
                                if(_.isEmpty(accountuserdata)) return res.send({status:0, message:"Error in updating login_account user data"});
    
                                return res.send({status:1, message:"User updated successfully"});
    
                            }).catch(error => {
                                return res.send({status:0, message:error});
                            });
    
                        }).catch(error => {
                            return res.send({status:0, message:error});
                        });

                    }).catch(error => {
                        return res.send({status:0, message:error});
                    });

                }).catch(error => {
                    return res.send({status:0, message:error});
                });

            }).catch(error => {
                return res.send({status:0, message:error});
            });
        });

    }

}

module.exports = admin;