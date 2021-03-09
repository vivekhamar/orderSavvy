var express = require('express');
var router = express.Router();
var RestaurantServerControl = require('../controller/restaurant.server.controller');
let object = new RestaurantServerControl();

router.post('/createaccount', (req, res) => {
    return object.craeteaccount(req, res);
});

/*************************************************************/
// ADMIN RESTAURANT API'S
/*************************************************************/
router.post('/admin/saverestaurant', (req, res) => {
    return object.SaveRestaurant(req.body, res);
});
/*************************************************************/

/*************************************************************/
// RESTAURANT AUTHENTICATION API'S
/*************************************************************/
router.get('/Resgetcurrent/*', (req, res) => {
    return object.ResGetCurrent(req, res);
});

router.post('/Reslogin', (req, res) => {
    return object.ResLogin(req.body, res);
});

router.post('/Ressignout/*', (req, res) => {
    return object.ResSignOut(req, res);
});

router.post('/Resforgotpassword', (req, res) => {
    return object.ResForgotPassword(req.body, res);
});

router.post('/Resresetpassword', (req, res) => {
    return object.ResResetPassword(req.body, res);
});

router.post('/Reschangepassword', (req, res) => {
    return object.ResChangePassword(req.body, res);
});
/*************************************************************/

/*************************************************************/
// RESTAURANT STAFF API'S
/*************************************************************/
router.get('/getstaff/*', (req, res) => {
    return object.GetStaff(req, res);
});

router.post('/addstaff', (req, res) => {
    return object.AddStaff(req, res);
});

router.post('/updatestaff', (req, res) => {
    return object.UpdateStaff(req, res);
});

router.post('/deletestaff/*', (req, res) => {
    return object.DeleteStaff(req, res);
});
/*************************************************************/

/*************************************************************/
// RESTAURANT API'S
/*************************************************************/
router.get('/Resmyrestaurant/*', (req, res) => {
    return object.MyRestaurantDetails(req, res);
});

router.post('/updaterestaurant', (req, res) => {
    return object.UpdateRestaurant(req, res);
});
/*************************************************************/

module.exports = router;
