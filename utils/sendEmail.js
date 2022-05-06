const nodemailer = require('nodemailer');
//to render HTML for the email we need PUG packages
const pug = require('pug');
const htmlToText = require('html-to-text');
// console.log(htmlToText);
// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Dmitriy Vnuchkov <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SENDGRID
      return 1;
    }
    return nodemailer.createTransport({
      //   service: 'Gmail' //this is how we can use gmail to send emails. I also have to go to the gmail itself and activate the 'less secure app' option ... however, here we use mailtrap, and these are the settings
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // secureConnection: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  //1.Send the actual email
  async send(template, subject) {
    //1. render HTML for the email based on PUG... here we will generate the HTML document that we will eventually send to the user
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    // console.log(html);
    //2. define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      //to make the text version of the sent html message, we need a package html-to-text
      text: htmlToText.fromString(html)
    };

    //3. create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (only valid for 10 minutes)');
  }
};

// const sendEmail = async options => {
//   //1. create transporter
//   const transporter = nodemailer.createTransport({
//     //   service: 'Gmail' //this is how we can use gmail to send emails. I also have to go to the gmail itself and activate the 'less secure app' option ... however, here we use mailtrap, and these are the settings
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     // secureConnection: false,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//     // tls: {
//     //   ciphers: 'SSLv3'
//     // }
//   });
//   //2. define the email options
//   const mailOptions = {
//     from: 'Dmitriy Vnuchkov <admin@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//     // html:
//   };
//   //3. send the email
//   const results = await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
