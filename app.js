var createError = require('http-errors');
var express = require('./config/express');
let exp = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./app/routes/index');
var usersRouter = require('./app/routes/usersRoutes');
var restaurantRouter = require('./app/routes/restaurantRoutes');
var orderRouter = require('./app/routes/orderRoutes');
var ResServerRouter = require('./app/routes/restaurant.server.routes');
var AdminServerRouter = require('./app/routes/admin.server.routes');

var app = express();

var verifyAPI = require('./app/service/AuthToken');
var ver = new verifyAPI();
//************* SQlitedb configuration ***************/
// global.db = require('./config/sqlite');
// console.log("connected",require('./config/sqlite'))
// app.set("db", db);
//************* SQlitedb configuration ***************/

//************* mongodb configuration ***************/
// let mongoose = require('./config/mongoose');
// db = mongoose();
require('./config/mongoose');
//************* mongodb configuration ***************/


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(exp.json());
app.use(exp.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(exp.static(path.join(__dirname, 'public')));
// profileImage baseURL
app.use('/upload',exp.static(path.join(__dirname, 'public/uploads')));
//for resetpassordLink
app.use('/public',exp.static(path.join(__dirname, 'public')));

//api routes
app.use('/', ver.VerifyToken, indexRouter);
app.use('/', ver.VerifyToken, usersRouter);
app.use('/', ver.VerifyToken, restaurantRouter);
app.use('/', ver.VerifyToken, orderRouter);
app.use('/', ver.VerifyToken, ResServerRouter);
app.use('/', ver.VerifyToken, AdminServerRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(config.ServerPort, () => {
  console.log("Server is running at port " + config.ServerPort);
});

module.exports = app;
