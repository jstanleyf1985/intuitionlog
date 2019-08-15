exports.getAccountRoute = (req, res) => {
    if(req.isAuthenticated()) {
      // Render page
      res.render('register', {
        title: 'Account Page',
        url: 'https://www.intuitionlog.com/account',
        errors: req.session.errors,
        loginErrors: req.session.loginErrors,
        errMsg: req.session.errMsg,
        });
    } else {
      res.redirect('/');
    }
  }