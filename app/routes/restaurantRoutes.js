var express = require('express');
var router = express.Router();
var RestaurantControl = require('../controller/restaurant.controller');
let obj = new RestaurantControl();

/*************************************************************/
// CUSTOMER HOME PAGE API'S
/*************************************************************/
router.get('/categories/*', (req, res) => {
    return obj.Categories(req, res);
});

router.get('/selectchoice', (req, res) => {
    return obj.SelectChoice(req, res);
});

router.get('/PopularPlaces', (req, res) => {
    return obj.PopularPlaces(req, res);
});

router.get('/trendingweeek', (req, res) => {
    return obj.TrendingWeek(req, res);
});

router.get('/collections', (req, res) => {
    return obj.Collections(req, res);
});

router.get('/home', (req, res) => {
    return obj.HomeList(req, res);
});
/*************************************************************/

/*************************************************************/
// CUSTOMER SEARCH AND NEARBY RESTAURANT API'S
/*************************************************************/
router.get('/search/*', (req, res) => {
    return obj.SearchRestaurants(req, res);
});

router.post('/nearby', (req, res) => {
    return obj.NearBy(req.body, res);
});
/*************************************************************/

/*************************************************************/
// CUSTOMER RESTAURANT DETAILS API'S
/*************************************************************/
router.get('/getrestaurant/*', (req, res) => {
    return obj.RestaurantDetail(req, res);
});

router.get('/images/*', (req, res) => {
    return obj.GetResImages(req, res);
});

router.get('/menu/*', (req, res) => {
    return obj.GetResMenu(req, res);
});
/*************************************************************/

module.exports = router;
