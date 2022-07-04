const mongoose = require('mongoose');
// allows to encrypt and decrypt data (позволяет зашифровывать и расшифровывать данные)
const crypto = require('crypto');
// package to create custom validators (пакет для создания кастомной валидации)
const validator = require('validator');
// allows to encrypt and decrypt data (позволяет зашифровывать и расшифровывать данные)
const bcrypt = require('bcryptjs');

// a mongoose schema for users (схема для пользователей)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: false,
    required: [true, 'You have to provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'You have to provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'You have to provide a valid email address']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'You have to create a password'],
    trim: true,
    minLength: [8, 'Your password should be at least 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'You have to confirm your password'],
    trim: true,
    validate: {
      // custom validator (кастомная проверка валидности данных)
      validator: function(val) {
        return val === this.password;
      },
      message: 'Passwords have to match'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// encrypts passwords (зашифровывает пароли)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// update the moment when the user changed his password (обновляет момент, когда пароль был последний раз обновлен)
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //make it 1 sec earlier to avoid errors
  next();
});

// hide all inactive users from the list of displayed users (скрывает всех инактивных пользователей)
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// compare the candidate and the user passwords (сравнивает пароли пользователя, и входящего)
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * check when the password was changed last (проверяет, когда пароль меняли в последний раз)
 * @param {number}
 * @returns {boolean}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  //FALSE means the password was not changed after the token was given (FALSE означает что пароль не меняли после того, как выдали токен)
  return false;
};

/**
 *  generate a random token to later send it as an email for password reset (генерирует токен, который отправятся в имейле с ссылой для восстановления пароля)
 * @param {}
 * @returns {string}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
userSchema.methods.createPasswordResetToken = function() {
  // create a token which I will later send to the user via email (создает токен)
  const resetToken = crypto.randomBytes(32).toString('hex');
  // encrypt the created token (сашифровывает токен)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
