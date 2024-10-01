const nodemailer = require('nodemailer');

// Create a reusable transporter object using SMTP transport
exports.sendEmail = async(options)=>{
const transporter = nodemailer.createTransport({
    host:process.env.NOTIFICATION_HOST,
    port: 587,
    auth: {
        user: process.env.NOTIFICATION_USER,
        pass: process.env.NOTIFICATION_PASS,
      },   
      tls: {
        rejectUnauthorized: false,
      },
})

// MailOptions //

const mailOptions = {
    from: process.env.NOTIFICATION_EMAIL,
    to: options.email,
    subject: options.subject,
    html: options.text,
  };

  try{
    await transporter.sendMail(mailOptions)
  }catch(error){
    console.error('Error sending email:', error);
    throw error;
  }

}

