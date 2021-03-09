var express = require('express');
var router = express.Router();
var UserControl = require('../controller/user.controller');
let obj = new UserControl();
var Users = require('../model/user.js');
var UserSchema = require('../model/RegisterSchema').Users;

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/getusers', (req, res) => {
  let object = new Users(UserSchema);
  let filter = {};
  return object.getuser(filter).then(data => {
    if (!data) return res.send({ status: 0, message: "Error in getting the data" });
    return res.send({ status: 1, message: "Users are found", users: data });
  });
});

//////////////////////////////start///////////////////////////

/*************************************************************/
// CUSTOMER AUTHENTICATION API'S
/*************************************************************/
router.get('/getcurrentuser', (req, res) => {
  return obj.CurrentUser(req, res);
});//

router.post('/signup', (req, res) => {
  return obj.SignUp(req.body, res);
});

router.post('/login', (req, res) => {
  return obj.LogIn(req.body, res);
});

router.post('/signout/*', (req, res) => {
  return obj.SignOut(req, res);
});

router.post('/resendotp', (req, res) => {
  return obj.ReSendOTP(req.body, res);
});

router.post('/verifyotp', (req, res) => {
  return obj.VerifyOTP(req.body, res);
});

router.post('/resetpassword', (req, res) => {
  return obj.ResetPassword(req.body, res);
});

router.post('/forgotpassword', (req, res) => {
  return obj.ForgotPassword(req.body, res);
});

router.post('/changepassword', (req, res) => {
  return obj.ChangePassword(req.body, res);
});

router.post('/uploadprofile', (req, res) => {
  return obj.UpdateProfile(req, res);
});
/*************************************************************/

/*************************************************************/
// CUSTOMER FAVORITE RESTAURANT API'S
/*************************************************************/
router.post('/favNunfav/*', (req, res) => {
  return obj.FavUnfav(req, res);
});

router.get('/favorite/*', (req, res) => {
  return obj.GetFavorites(req, res);
});
/*************************************************************/

/*************************************************************/
// CUSTOMER FOODPARTY API'S
/*************************************************************/
router.post('/foodparty', (req, res) => {
  return obj.FoodParty(req.body, res);
});

router.post('/deletefoodparty/*', (req, res) => {
  return obj.DeleteParty(req, res);
});

router.get('/getfoodparty/*', (req, res) => {
  return obj.GetFoodParty(req, res);
});

router.post('/updatefoodparty', (req, res) => {
  return obj.UpdateFoodParty(req.body, res);
});

router.post('/finishfoodparty/*', (req, res) => {
  return obj.FinishFoodParty(req, res);
});
/*************************************************************/


module.exports = router;

// sqlitedb users
// router.get('/getuserlist',(req,res) => {
//   let obj = new userjs();
//   return obj.getusers();
// });
