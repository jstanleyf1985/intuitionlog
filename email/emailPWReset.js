const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');

const sendPWResetEmailTo = (emailAddr, username, key) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.emailUser,
      clientId: process.env.emailClientID,
      clientSecret: process.env.emailClientSecret,
      refreshToken: process.env.emailRefreshToken,
      accessToken: process.env.emailAccessToken,
      expires: 1484314697598
  }
  });
  const mailOptions = {
    from: 'support@intuitionlog.com',
    to: emailAddr,
    subject: 'IntuitionLog Password Reset Request',
    unsubscribe: {
      url: 'https://www.intuitionlog.com'
    },
    text: 'Thank you for registering for IntuitionLog.com . Please follow this link to verify your account to begin tracking your intuitive or meditative activies.',
    html: `<!doctypehtml><title></title><meta charset=utf-8><meta content="width=device-width,initial-scale=1"name=viewport><meta content="IE=edge"http-equiv=X-UA-Compatible><style>a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:525px){.wrapper{width:100%!important;max-width:100%!important}.logo img{margin:0 auto!important}.mobile-hide{display:none!important}.img-max{max-width:100%!important;width:100%!important;height:auto!important}.responsive-table{width:100%!important}.padding{padding:10px 5% 15px 5%!important}.padding-meta{padding:30px 5% 0 5%!important;text-align:center}.padding-copy{padding:10px 5% 10px 5%!important;text-align:center}.no-padding{padding:0!important}.section-padding{padding:50px 15px 50px 15px!important}.mobile-button-container{margin:0 auto;width:100%!important}.mobile-button{padding:15px!important;border:0!important;font-size:16px!important;display:block!important}}div[style*="margin: 16px 0;"]{margin:0!important}</style><body style=margin:0!important;padding:0!important><table border=0 cellpadding=0 cellspacing=0 width=100%><tr><td align=center style="padding:70px 15px 70px 15px"class=section-padding bgcolor=#D8F1FF><!--[if (gte mso 9)|(IE)]><table border=0 cellpadding=0 cellspacing=0 width=500 align=center><tr><td align=center valign=top width=500><![endif]--><table border=0 cellpadding=0 cellspacing=0 width=100% class=responsive-table style=max-width:500px><tr><td><table border=0 cellpadding=0 cellspacing=0 width=100%><tr><td align=center class=padding><h1>Intuitionlog password reset</h1><tr><td><table border=0 cellpadding=0 cellspacing=0 width=100%><tr><td align=center style=font-size:25px;font-family:Helvetica,Arial,sans-serif;color:#333;padding-top:30px class=padding>Follow the link to reset your password<tr><td align=center style="padding:20px 0 0 0;font-size:16px;line-height:25px;font-family:Helvetica,Arial,sans-serif"class=padding><span style=color:#666 align=center>Follow this website address to reset your account password. </span><span style=color:cc0000!important>Https://www.intuitionlog.com/passwordreset/${username}/${key} </span><span style=color:#c00;display:block align=center>Note: For some email addresses the button below may not work due to security reasons.</span></table><tr><td align=center><table border=0 cellpadding=0 cellspacing=0 width=100%><tr><td align=center style=padding-top:25px class=padding><table border=0 cellpadding=0 cellspacing=0 class=mobile-button-container><tr><td align=center style=border-radius:3px bgcolor=#256F9C><a href=https://www.intuitionlog.com/passwordreset/${username}/${key} style="font-size:16px;font-family:Helvetica,Arial,sans-serif;color:#fff;text-decoration:none;color:#fff;text-decoration:none;border-radius:3px;padding:15px 25px;border:1px solid #256f9c;display:inline-block"target=_blank class=mobile-button>Reset my account password →</a></table></table></table></table><!--[if (gte mso 9)|(IE)]><![endif]--><tr><td align=center style="padding:20px 0"bgcolor=#ffffff><!--[if (gte mso 9)|(IE)]><table border=0 cellpadding=0 cellspacing=0 width=500 align=center><tr><td align=center valign=top width=500><![endif]--><table border=0 cellpadding=0 cellspacing=0 width=100% class=responsive-table style=max-width:500px align=center><tr><td align=center style=font-size:12px;line-height:18px;font-family:Helvetica,Arial,sans-serif;color:#666>IntuitionLog : <a href=https://www.intuitionlog.com style=color:#666;text-decoration:none target=_blank>Unsubscribe</a></table><!--[if (gte mso 9)|(IE)]><![endif]--></table>`
  }
  transporter.sendMail(mailOptions, (err, info) => {
    console.log(err);
    console.log(info);
  });
}
exports.sendPWResetEmailTo = sendPWResetEmailTo;