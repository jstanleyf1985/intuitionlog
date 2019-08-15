const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = require('../dbSchema/userschema');
const LocalStrategy = require('passport-local').Strategy;

// Set UserModel for users in the database
const UserLogin = new mongoose.model('User', userSchema.userSchema);
passport.use(UserLogin.createStrategy());
passport.serializeUser(UserLogin.serializeUser());
passport.deserializeUser(UserLogin.deserializeUser());

exports.getLoginRoute = (req, res) => {
    // Reset error variables to null
    req.session.pwResetPostErrors = null;
    req.session.passwordResetErr = null;

    // If from register page, remove login errors
    if(req.headers.referer == 'https://www.intuitionlog.com/register') {
      req.session.loginErrors = null;
      req.session.loginErrMsg = null;
    }
  
    // Check if user has active account token and pass them into dashboard if true
    if(req.session.emailActive) {
      if(req.session.emailActive == true && req.isAuthenticated()) {
        res.redirect('/dashboard');
      }
    }
    
    res.render('login', {
      title: 'IntuitionLog Login',
      url: 'https://www.intuitionlog.com',
      loginErrors: req.session.loginErrors,
      loginErrMsg: req.session.loginErrMsg,
      emailVerifyMsg: req.session.emailVerifyErrors,
      passwordResetErr: req.session.passwordResetErr,
      passwordResetPostErr: req.session.passwordResetPostErr
    });
}

exports.postLoginRoute = (req, res, next) => {
    // Check if valid
    // Reset Errors on new post
    req.session.loginErrors = null;
    req.session.loginErrMsg = null;

    // Sanitize
    req.check('username').trim().escape();
    req.check('password').trim().escape();

    // Check
    req.check('username', 'Username cannot be empty').not().isEmpty();
    req.check('username', 'Username must contain only letters and numbers').matches(/^[A-Za-z0-9]+$/i);
    req.check('password', 'Password cannot be empty').not().isEmpty();
    req.check('password', 'Password must contain only letters, numbers or ! @ # $ % ^ *').matches(/^[A-Za-z0-9!@#$%^*]+$/i);
    let loginErrors = req.validationErrors();

    // If errors exist, get a list of errors
    if(loginErrors) {
      // Errors exist, redirect to login page to try again
      req.session.loginErrors = loginErrors;
      res.redirect('/');
    } else {
      // Perform 2nd check to determine if data already exists in the database to avoid duplicate entries
      // Set usernamelowercase for use in DB search
      let loginUser = new UserLogin({
        username: req.body.username,
        password: req.body.password
      });
      let userLowerCase = (req.body.username).toLowerCase();

      req.login(loginUser, (err) => {
        // Err exists if passport was unable to find the user in the DB
        if(err) {
          req.send('<h1>There was an error processing your request</h1>');
        } else {
          /* Check if user account is active by checking session variable,
          if the session variable is null, check the DB account for active status and create one */
          if(req.session.emailActive == true) {
            req.session.emailActive = true;
              
          } else {
            // Check username for status, if active create session variable, if false throw error
            // Locate user account
            UserLogin.findOne({usernameLowerCase: userLowerCase}, (err, data) => {
              if(err) {
                req.session.loginErrMsg = 'There was an error checking your account';
                res.redirect('/');
              } else if(data) {
                if(data.active == true) {
                  // req.session.emailActive = true;
                  // Check username and password combo for authentication
                  // Create user object using user entered data to create an object to check against
                  let loginUser = new UserLogin({
                    username: req.body.username,
                    password: req.body.password
                  });
                  passport.authenticate('local', function(err, user, info) {
                    if (err) {
                      req.session.loginErrMsg = 'There was an error checking your account';
                      return res.redirect('/');
                    } else if(!user) {
                      req.session.loginErrMsg = 'Invalid login credentials';
                      return res.redirect('/');
                    } else {
                      req.logIn(loginUser, function(err) {
                        if (err) {
                          req.session.loginErrMsg = 'There was an error logging you in';
                          return next(err);
                        } else {
                          req.session.loginErrMsg = 'success';
                          return res.redirect('/dashboard');
                        }
                      });
                    }
                    
                  })(req, res, next);
                } else {
                  req.session.loginErrMsg = 'Account inactive, please check your email for an activation link';
                  res.redirect('/');
                }
              } else {
                req.session.loginErrMsg = 'Invalid login credentials'; // Invalid username
                res.redirect('/');
              }
            });

          }

        }
      });
    }
}