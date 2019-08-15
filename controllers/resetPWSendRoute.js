const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');
const emailer = require('../email/emailPWReset.js');

// Set UserModel for users in the database
const UserSend = new mongoose.model('User', userSchema.userSchema);
passport.use(UserSend.createStrategy());
passport.serializeUser(UserSend.serializeUser());
passport.deserializeUser(UserSend.deserializeUser());


exports.getPWResetSendRoute = (req, res) => {
  // Reset session error parameters for clearing errors regardless of which page the user is coming from
  req.session.loginErrors = null;
  req.session.loginErrMsg = null;
  req.session.emailVerifyErrors = null;
  req.session.errors = null;
  req.session.errMsg = null;
  
  res.render('passwordsend', {
    title: 'IntuitionLog PasswordReset',
    url: 'https://www.intuitionlog.com/passwordsend',
    sendPWResetEmailErr: req.session.sendPWResetEmailErr,
    sendPWResetEmailMsg: req.session.sendPWResetEmailMsg
  });
}

exports.postPWResetSendRoute = (req, res) => {
    // Reset session error parameters for clearing errors regardless of which page the user is coming from
    req.session.passwordResetErr = null;
    req.session.sendPWResetEmailErr = null;
    req.session.sendPWResetEmailMsg = null;
    req.session.loginErrors = null;
    req.session.loginErrMsg = null;
    req.session.emailVerifyErrors = null;
    req.session.errors = null;
    req.session.errMsg = null;
    
    // Get posted data
    // Sanitize data
    req.check('userOrEmail').trim().escape();
  
    // Check data
    req.check('userOrEmail', 'Username or email cannot be empty').not().isEmpty();
    req.check('userOrEmail', 'Username or email must contain only letters, numbers, and symbols').matches(/^[A-Za-z0-9@!#$%*+-/=?^_`{]+$/i);
    req.check('userOrEmail', 'Username must be fewer than 50 characters').isLength({min: 1, max: 50});
    let sendPWResetEmailErr = req.validationErrors();
  
    // Lowercase values for quickly searching in the DB
    let userOrEmailLower = (req.body.userOrEmail).toLowerCase();

    if(sendPWResetEmailErr) {
      req.session.sendPWResetEmailMsg = 'Error processing your request';
      res.redirect('/passwordsend');
    } else {
      // 2nd Check which sends email to user
      // Determine if username or password is entered, search based on input value
      if((req.body.userOrEmail).indexOf('@') !== -1) {
        // userOrEmail is an email address
        UserSend.findOne({emailLowerCase: userOrEmailLower}, (err, data) => {
          if(err) {
            req.session.sendPWResetEmailMsg = 'Error processing your request',
            res.redirect('/passwordsend');
          } else if(data) {

            // Set variables for email sending
            // Send email for password reset link, redirect to password reset page
            emailer.sendPWResetEmailTo(req.body.userOrEmail, data.usernameLowerCase, data.pwResetCode);
            req.session.sendPWResetEmailMsg = 'Check your email for a password reset link';
            res.redirect('/passwordsend');
          } else {
            // No username or email in the database
            req.session.sendPWResetEmailMsg = 'Invalid username or email address',
            res.redirect('/passwordsend');
          }
        });
      } else {
        // userOrEmail is a username
        UserSend.findOne({usernameLowerCase: userOrEmailLower}, (err, data) => {
          if(err) {
            req.session.sendPWResetEmailMsg = 'Error processing your request',
            res.redirect('/passwordsend');
          } else if(data) {

            // Set variables for email sending
            // Send email for password reset link, redirect to password reset page
            emailer.sendPWResetEmailTo(data.emailLowerCase, data.usernameLowerCase, data.pwResetCode);
            req.session.sendPWResetEmailMsg = 'Check your email for a password reset link';
            res.redirect('/passwordsend');
          } else {
            // No username or email in the database
            req.session.sendPWResetEmailMsg = 'Invalid username or email address',
            res.redirect('/passwordsend');
          }
        });
      }
    }
}