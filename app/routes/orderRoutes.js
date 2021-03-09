var express = require('express');
var router = express.Router();
var OrderControl = require('../controller/order.controller');
var obj = new OrderControl();

/*************************************************************/
// ADMIN ORDER AND REPORTS API'S
/*************************************************************/
router.get('/admin/orderhistory/*', (req, res) => {
    return obj.GetOrderHistory(req, res);
});

router.get('/admin/getorderbyid/*', (req, res) => {
    return obj.GetOrderById(req, res);
});

router.get('/reportbyorders/:id', (req, res) => {
    return obj.GetOrderReport(req, res);
});

router.get('/reportbyitems/:id', (req, res) => {
    return obj.GetItemReport(req, res);
});

router.get('/totalearning', (req, res) => {
    return obj.GetResOrderEarning(req, res);
});
/*************************************************************/

/*************************************************************/
// ORDERS API'S
/*************************************************************/
router.post('/order', (req, res) => {
    return obj.MakeOrders(req.body, res);
});

router.post('/updateorder', (req, res) => {
    return obj.UpdateOrderStataus(req.body, res);
});

router.get('/myorders/*', (req, res) => {
    return obj.GetOrderByUser(req, res);
});
/*************************************************************/

/*************************************************************/
// ORDER PAYMENT API'S
/*************************************************************/
router.post('/ephemeralkey', (req, res) => {
    return obj.Ephemeralkey(req.body, res);
});

router.post('/payment', (req, res) => {
    return obj.Payment(req, res);
});

router.get('/cards/*', (req, res) => {
    return obj.Cards(req, res);
});

router.post('/savecard', (req, res) => {
    return obj.SaveCard(req.body, res);
});

router.post('/defaultcard', (req, res) => {
    return obj.DefaultCard(req.body, res);
});

router.post('/listpayment', (req, res) => {
    return obj.ListPayment(req.body, res);
});

router.post('/attachpayment', (req, res) => {
    return obj.AttachPayment(req.body, res);
});

router.post('/defaultpaymentmethod', (req, res) => {
    return obj.DefaultPayment(req.body, res);
});
/*************************************************************/

/*************************************************************/
// RESTAURANT ORDERS API'S
/*************************************************************/
router.post('/Resmyorder/*', (req, res) => {
    return obj.GetOrderByRes(req, res);
});
/*************************************************************/

module.exports = router;
