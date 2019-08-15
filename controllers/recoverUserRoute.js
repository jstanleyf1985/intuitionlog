const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');
const emailer = require('../email/emailRecoverUsername.js');

// Set UserModel for users in the database
const UserRecover = new mongoose.model('User', userSchema.userSchema);
passport.use(UserRecover.createStrategy());
passport.serializeUser(UserRecover.serializeUser());
passport.deserializeUser(UserRecover.deserializeUser());

exports.getRecoverUserRoute = (req, res) => {

  res.render('recoveruser', {
    title: 'IntuitionLog Username Recover',
    userRecoveryErr: req.session.userRecoveryErr,
    url: 'https://www.intuitionlog.com/recoverusername'
  });
}
exports.postRecoverUserRoute = (req, res) => {
    // Set errors to null upon posting data, each error should be based on the last post
    req.session.userRecoveryErr = null;
    // Sanitize
    req.check('username').trim().escape();
  
    // Checks
    req.check('email', 'Email must not be empty').not().isEmpty();
    req.check('email', 'Email must be in a valid format').isEmail();
    req.session.userRecoveryErr = req.validationErrors();
    

    // Lower case the email to pass as an argument to the database
    let emailLower = (req.body.email).toLowerCase();
    // Check email to get account username and send that to their email address
    UserRecover.findOne({emailLowerCase: req.body.email}, (err, data) => {
      if(err) {
        userRecoveryErr = 'There was a problem processing your request, please try again';
        res.redirect('/recoverusername');
      } else if(data) {
        // Locate the username on the account, and mail it
        // Set variables for email sending
            // Send email for username information, redirect to the recover username page
            emailer.sendUsernameRecoveryTo(req.body.email, data.username, data.email);
            req.session.userRecoveryErr = 'successful';
            res.redirect('/recoverusername');
      } else {
        userRecoveryErr = 'There was a problem with the email provided';
        res.redirect('/recoverusername');
      }
    });
}