// a package that help to prepare nad send emails (пакет для создания и отправки имейлов)
const nodemailer = require('nodemailer');
const pug = require('pug');
// a package to make the text version of the sent html message (пакет для превращения текстовых версий отправленных html сообщений)
const htmlToText = require('html-to-text');

// a class for sending emails (класс для отправки имейлов)
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Dmitriy Vnuchkov <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SENDGRID not implemented yet
      return 1;
    }
    // settings to send the email to mailtrap (настройки транспорта для отправки имейлов в mailtrap)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // send the actual email (отправляет имейл)
  async send(template, subject) {
    // render HTML for the email based on PUG... here we will generate the HTML document that we will eventually send to the user
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    // define email options (определяет параметры имейла)
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.fromString(html)
    };

    // create transport and send email (создает транспорт и отправляет имейл)
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (only valid for 10 minutes)');
  }
};
