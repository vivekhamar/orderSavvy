var express = require('express');
var router = express.Router();

var AdminControl = require('../controller/admin.server.controller');
let obj = new AdminControl();

var AdminJS = require('../controller/admin');
let adminjsobj = new AdminJS();

/*************************************************************/
// ADMIN AUTHENTICATION API'S
/*************************************************************/
router.post('/admin/signup', (req, res) => {
    return obj.SignUp(req.body, res);
});

router.post('/admin/login', (req, res) => {
    return obj.LogIn(req.body, res);
});

router.post('/admin/signout/*', (req, res) => {
    return obj.SignOut(req, res);
});

router.post('/admin/forgotpassword', (req, res) => {
    return obj.ForgotPassword(req.body, res);
});

router.post('/admin/resetpassword', (req, res) => {
    return obj.ResetPassword(req.body, res);
});

router.post('/admin/changepassword', (req, res) => {
    return obj.ChangePassword(req.body, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN MENUS API'S
/*************************************************************/
router.get('/admin/getallmenus/*', (req, res) => {
    return obj.GetAllMenus(req, res);
});

router.get('/admin/getmenubyid/*', (req, res) => {
    return obj.GetMenuByID(req, res);
});

router.post('/admin/addupdatemenu', (req, res) => {
    return obj.AddUpdateMenu(req, res);
});

router.post('/admin/deletemenu/*', (req, res) => {
    return obj.DeleteMenu(req, res);
});

router.get('/admin/getresmenu/*', (req, res) => {
    return obj.GetResMenu(req, res);
});

/*************************************************************/

/*************************************************************/
// ADMIN CATEGORY API'S
/*************************************************************/
router.get('/admin/getcategorybyid/*', (req, res) => {
    return obj.GetCategoryById(req, res);
});

router.post('/admin/addupdatecategory', (req, res) => {
    return obj.AddUpdateCategory(req, res);
});

router.post('/admin/deletecategory/*', (req, res) => {
    return obj.DeleteCategory(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN COMBOS API'S
/*************************************************************/
router.get('/admin/getallcombos/*', (req, res) => {
    return obj.GetAllCombos(req, res);
});

router.get('/admin/getcombobyid/*', (req, res) => {
    return obj.GetComboById(req, res);
});

router.post('/admin/addupdatecombo', (req, res) => {
    return obj.AddUpdateCombo(req, res);
});

router.post('/admin/deletecombo/*', (req, res) => {
    return obj.DeleteCombo(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN ITEMS API'S
/*************************************************************/
router.get('/admin/getallitems/*', (req, res) => {
    return obj.GetAllItems(req, res);
});

router.get('/admin/getitembyid/*', (req, res) => {
    return obj.GetItemById(req, res);
});

router.post('/admin/addupdateitem', (req, res) => {
    return obj.AddUpdateItem(req, res);
});

router.post('/admin/deleteitem/*', (req, res) => {
    return obj.DeleteItem(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN MODS API'S
/*************************************************************/
router.get('/admin/getallmod/*', (req, res) => { //
    return obj.GetAllMods(req, res);
});

router.get('/admin/getmodbyid/*', (req, res) => { //
    return obj.GetModsById(req, res);
});

router.post('/admin/addupdatemod', (req, res) => { //
    return obj.AddUpdateMods(req, res);
});

router.post('/admin/deletemod/*', (req, res) => { //
    return obj.DeleteMods(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN FOODPARTY API'S
/*************************************************************/
router.get('/admin/getallfoodparty/*', (req, res) => {
    return obj.GetAllFoodPartyByRes(req, res);
});

router.get('/admin/getfoodpartybyid/*', (req, res) => { //
    return obj.GetFoodPartyById(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN STAFF API'S
/*************************************************************/
router.get('/admin/getstaffbyid/*', (req, res) => {
    return obj.GetStaffById(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN RESTAURANT API'S
/*************************************************************/
router.get('/admin/getrestaurants/*', (req, res) => {
    return obj.GetAllRestaurants(req, res);
});

router.post('/admin/saveimg', (req, res) => {
    return obj.SaveResImage(req, res);
});

router.post('/admin/deleteimg/*/*', (req, res) => {
    return obj.DeleteResImage(req, res);
});
/*************************************************************/

/*************************************************************/
// ADMIN USER MODULE API'S
/*************************************************************/
router.get('/admin/getallusers/*', (req, res) => {
    return adminjsobj.GetAllUsers(req, res);
});

router.get('/admin/getuserbyid/*', (req, res) => {
    return adminjsobj.GetUserById(req, res);
});

router.post('/admin/updateusers', (req, res) => {
    return adminjsobj.UpdateUser(req, res);
});
/*************************************************************/

module.exports = router;
