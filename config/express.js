let express = require('express');
config = require('./config');
bodyParser = require('body-parser');
jwt = require('jsonwebtoken');
multer = require('multer'); //middleware for handling multipart/form-data
multiparty = require('multiparty'); /*For File Upload*/
cors = require('cors'); //For cross domain error
timeout = require('connect-timeout');
session = require('express-session');
var path = require('path');

module.exports = function() {

    console.log('env' + process.env.NODE_ENV)
    var app = express();
    //console.log(__dirname)
    if (process.env.NODE_ENV === 'development') {
      app.use(morgan('dev'));
    } else if (process.env.NODE_ENV === 'production') {
      app.use(compress({ threshold: 2 }));
    }

    app.use(bodyParser.urlencoded({
      extended: false
    }));
    app.use(bodyParser.json());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    // app.use(express.static(path.join(__dirname, 'public')));

    // app.use(methodOverride());

    app.use(cors());
    // app.use(morgan('combined')); // Just uncomment this line to show logs.

    // =======   Settings for CORS
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    app.use(timeout(120000));
    app.use(haltOnTimedout);

    function haltOnTimedout(req, res, next){
      if (!req.timedout) next();
    }

    // app.use(session({
    //   cookie: { maxAge: 30000 },
    //   saveUninitialized: true,
    //   resave: true,
    //   secret: config.sessionSecret
    // }));

    // require('../app/routes/index.server.routes.js')(app, express);
    // require('../app/routes/admin.server.routes.js')(app, express);
    // require('../app/routes/users.server.routes.js')(app, express);
    // require('../app/routes/location.server.routes.js')(app, express);
    // require('../app/routes/RegisterRoutes.js')(app, express);

    return app;
  };