const nodemailer = require('nodemailer');

exports.sendPasswordSetupEmail = async (email, setupLink) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',  // You can configure this with your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Set Up Your Password',
    text: `Click the link to set up your password: ${setupLink}`,
    html: `<p>Please click the link below to set up your password:</p>
           <a href="${setupLink}">Set up your password</a>`
  };

  await transporter.sendMail(mailOptions);
};
