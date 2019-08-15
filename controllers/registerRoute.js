const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');
const emailer = require('../email/email.js');

// Set UserModel for users in the database
const UserRegister = new mongoose.model('User', userSchema.userSchema);
passport.use(UserRegister.createStrategy());
passport.serializeUser(UserRegister.serializeUser());
passport.deserializeUser(UserRegister.deserializeUser());


exports.getRegisterRoute = (req, res) => {
    // If from login page, remove registration errors
    if(req.headers.referer == 'https://www.intuitionlog.com/') {
      req.session.errors = null;
    }

    // Render page
    res.render('register', {
      title: 'IntuitionLog Register',
      url: 'https://www.intuitionlog.com/register',
      errors: req.session.errors,
      loginErrors: req.session.loginErrors,
      errMsg: req.session.errMsg});
}
exports.postRegisterRoute = (req, res) => {
    // Check if valid
    // Reset errors from previous post
    req.session.errors = null;
    req.session.errMsg = null;
    
    // Sanitize
    req.check('username').trim().escape();
    req.check('email').trim().escape();
    req.check('password').trim().escape();
  
    // Checks
    req.check('username', 'Username cannot be empty').not().isEmpty()
    req.check('username', 'Username must contain only letters and numbers').matches(/^[A-Za-z0-9]+$/i);
    req.check('username', 'Username must be fewer than 21 characters').isLength({min: 1, max: 20});
    req.check('password', 'Password cannot be empty').not().isEmpty();
    req.check('password', 'Password must between 6 and 50 characters in length').isLength({min: 6, max: 50});
    req.check('password', 'Password must contain only letters, numbers or @!#$%*+-/=?^_`{').matches(/^[A-Za-z0-9@!#$%*+-/=?^_`{]+$/i);
    req.check('confirmpass', 'Password confirmation does not match password').equals(req.body.password);
    req.check('email', 'Email must not be empty').not().isEmpty();
    req.check('email', 'Email must be in a valid format').isEmail();
    req.check('email', 'Email must be fewer than 60 characters in length').isLength({min: 1, max: 60});
    let errors = req.validationErrors();
  
    // Lowercase values for quickly searching in the DB
    let usernameLower = (req.body.username).toLowerCase();
    let emailLower = (req.body.email).toLowerCase();
  
    // If errors exist, get a list of errors
    if(errors) {
      // Errors exist, redirect to register to try again
      req.session.errors = errors;
      res.redirect('/register');
    } else {
      // Perform 2nd check to determine if data already exists in the database to avoid duplicate entries
      // Check if username already exists
      UserRegister.findOne({usernameLowerCase: usernameLower}, (err, data) => {
        if(err) {
          // Throw general error
          req.session.errMsg = 'There was a problem checking if the username already exists';
          res.redirect('/register');
  
        } else if(data) {
          if(data.length > 0) {
            // Name(s) already exist, deny registration
            req.session.errMsg = 'Username already exists';
            res.redirect('/register');
          }
  
          } else {
          // Perform second check for email
          UserRegister.findOne({emailLowerCase: emailLower}, (err, data) => {
            if(err) {
              // Throw error checking if email exists
              req.session.errMsg = 'There was a problem check if the email already exists';
              res.redirect('/register');
            } else if(data) {
              if(data.length >= 1) {
                // Email already exists, deny registration
                req.session.errMsg = 'Email already exists';
                res.redirect('/register');
              }
            } else {
              // Create account, no duplicates found
              // Generate random string for email authentication
              let randNum = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              let pwResetNum = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
                // Create account
                UserRegister.register({username: req.body.username, usernameLowerCase: usernameLower, email: req.body.email, emailLowerCase: emailLower, verificationCode: randNum, pwResetCode: pwResetNum, pwResetKeyVerified: false, active: false}, req.body.password, (err, user) => {
                  if(err) {
                    req.session.errMsg = 'There was a problem creating your account';
                    res.redirect('/register');
                  } else {
                      // Send email for authorization link, redirect to home page with message
                      emailer.sendEmailTo(req.body.email, usernameLower, randNum);
                      req.session.errMsg = 'Please verify your account, an email was sent to the email address provided.';
                      res.redirect('/register');
                  }
                });
              }
            });
          }
      });
    }
  }