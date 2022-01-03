require('dotenv').config();
const nodemailer = require("nodemailer");

exports.sendMail = async (sendTo) => {
  let transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS, 
    },
  });

  const data = await transporter.sendMail({ 
    from: process.env.EMAIL,
    to: sendTo, 
    subject: "Hello ✔", 
    html: "<b>Hello world?</b>", 
  });
  return data.messageId
}

