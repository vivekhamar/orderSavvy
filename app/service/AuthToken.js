var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var _ = require('lodash');
var AuthTokenSchema = require('../model/AuthTokenSchema').AuthToken;
let ObjectId = require('mongodb').ObjectID;

class GenerateAuthToken {

    constructor() { }

    GenerateToken(id){
        return new Promise((resolve,reject) => {
            var token = jwt.sign({ id: id, expiresIn: Math.floor(new Date().getTime() / 1000) + config.ExpiresIn},config.SecurityToken);
            // console.log(token,"Authtuoken token")
            if(_.isEmpty(token)) return reject({status:0, message: "error in generating token"});

            let params = { userId:id, token:token };
            AuthTokenSchema.findOneAndUpdate({userId:id}, params, {upsert: true}, (err, authentication) => {
                if(err) return reject({status:0 , message:err});
                return resolve(token);
            });
        })
    }

    VerifyToken(req,res,next){
        if(req.headers.authorization){
            jwt.verify(req.headers.authorization,config.SecurityToken,(error,decoded) => {
                if(error) {
                    console.log(error)
                    return res.send({status:0, message:error});
                }
                if(decoded){
                    req.token=decoded;
                    let filter = {userId:ObjectId(decoded.id), token:req.headers.authorization};
                    let projection = {};
                    AuthTokenSchema.findOne(filter,projection).exec((error,user) => {
                        if(error) return res.send({status:0, message:error});

                        let now = parseInt(new Date().getTime() / 1000);
                        let ExpTime = decoded.expiresIn;
                        if(now > ExpTime){
                            return res.send({status:403, message:"Session(Token) Expired!!!"})
                        }
                        next();
                    });
                }
            });
        }
        else if(!req.headers.authorization){
            console.log("NEXT")
            next();
        }
    }

}

module.exports = GenerateAuthToken;