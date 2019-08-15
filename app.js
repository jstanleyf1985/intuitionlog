// Required nodeJS packages
const dotenv = require('dotenv').config();
const express = require('express');
const request = require('request');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const expressValidator = require('express-validator');
const expressSanitizer = require('express-sanitizer');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');

// Custom scripts
const emailer = require('./email/email.js');
const dbConnect = require('./dbConnect');
const userSchema = require('./dbSchema/userschema');
const emailVerifyController = require('./controllers/emailVerification');
const loginController = require('./controllers/loginRoute');
const accountController = require('./controllers/accountRoute');
const registerController = require('./controllers/registerRoute');
const dashboardController = require('./controllers/dashboardRoute');
const resetPWController = require('./controllers/resetPWRoute');
const resetPWPageController = require('./controllers/resetPWPageRoute');
const resetPWSendController = require('./controllers/resetPWSendRoute');
const recoverUserController = require('./controllers/recoverUserRoute');

// Initialize program
const app = express();


// Set app parameters
app.use(express.static('public'));
app.use(helmet());
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(session({
  secret: 'This is how I go when I go like this',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to DB
dbConnect.connectToDB();

// Include Schemas
userSchema.userSchema;

// Set UserModel for users in the database
const User = new mongoose.model('User', userSchema.userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
// Login Route
app.get('/', loginController.getLoginRoute);
app.post('/', loginController.postLoginRoute);

// Register Route
app.route('/register')
.get(registerController.getRegisterRoute)
.post(registerController.postRegisterRoute);

// Reset password route
app.get('/passwordreset/:username/:key', resetPWController.getPWResetRoute);

app.get('/passwordreset', resetPWPageController.getPWResetPageRoute);
app.post('/passwordreset', resetPWPageController.postPWResetPageRoute);

app.get('/passwordsend', resetPWSendController.getPWResetSendRoute);
app.post('/passwordsend', resetPWSendController.postPWResetSendRoute);

// Recover username route
app.get('/recoverusername', recoverUserController.getRecoverUserRoute);
app.post('/recoverusername', recoverUserController.postRecoverUserRoute);

// Email link verification route
app.get('/emailverification/:username/:key', emailVerifyController.getEmailVerifyPage);

// Account Route
app.get('/account', accountController.getAccountRoute);

// Dashboard Route
app.get('/dashboard', dashboardController.getDashboardRoute);
app.post('/dashboard/meditation', dashboardController.postDashboardRouteMeditation);
app.post('/dashboard/meditation/view', dashboardController.postDashboardRouteMeditationView);
app.post('/dashboard/meditation/edit', dashboardController.postDashboardRouteMeditationEdit);
app.post('/dashboard/meditation/editsubmit', dashboardController.postDashboardRouteMeditationEditSubmit);
app.post('/dashboard/meditation/delete', dashboardController.postDashboardRouteMeditationDelete);
app.post('/dashboard/meditation/getchart', dashboardController.postDashboardRouteMeditationChart);
app.post('/dashboard/meditation/quickview', dashboardController.postDashboardRouteMeditationQuickView);
app.post('/dashboard/meditation/reports', dashboardController.postDashboardRouteMeditationReports);
app.post('/dashboard/meditation/friends', dashboardController.postDashboardRouteFriends);
app.post('/dashboard/meditation/friendsearch', dashboardController.postDashboardRouteFriendFind);
app.post('/dashboard/meditation/friendadd', dashboardController.postDashboardRouteFriendAdd);
app.post('/dashboard/readings', dashboardController.postDashboardRouteReadings);
app.post('/dashboard/circles', dashboardController.postDashboardRouteCircles);
app.post('/dashboard/notes', dashboardController.postDashboardRouteNotes);
app.post('/dashboard/settings', dashboardController.postDashboardRouteSettings);
app.post('/dashboard/account', dashboardController.postDashboardRouteAccount);
app.post('/dashboard/accountupdate', dashboardController.postDashboardRouteAccountUpdate);
app.post('/dashboard/accountupdateimg', dashboardController.postDashboardRouteAccountUpdateImg);
app.get('/dashboard/logout', dashboardController.postDashboardRouteLogout);

// 404 Page
app.get('*', function(req, res) {
  res.send('<h1>404 Page Not Found</h1>');
});

// Run server
app.listen(3000, 'localhost', () => {
  console.log('Server running');
});