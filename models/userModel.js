const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
  //here we add the default parameter to the photo
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
    //this last parameter doesn't allow the password to be sent on request (so, it is only accessible in the database)
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'You have to confirm your password'],
    trim: true,
    validate: {
      //it will only work on CREATE and SAVE
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

//this middleware is to encrypt passwords ... it will happen between getting the data and saving it to the DB
userSchema.pre('save', async function(next) {
  //THIS is related to the current document... isModified is a method used to check what data is being modified
  if (!this.isModified('password')) return next();
  //hashing (encrypting) the password it is ASYNCHRONOUS... the second argument is how CPU intensive the encryption is and ... READ MORE
  this.password = await bcrypt.hash(this.password, 12);
  //passwordConfirm is useless at this stage, so we just remove it
  this.passwordConfirm = undefined;
  next();
});

//here I create a middleware that will be run before the saving process. It will update the moment when the uer changed his password
userSchema.pre('save', function(next) {
  //here we check if a certain property is not being modified, or if this is a new user
  if (!this.isModified('password') || this.isNew) return next();
  //here is what happens if the password is being modified... IMPORTANT: because all these sync and async functions and middlewares are run almost simultaneously, there is a slight chance that the token will be created before the passwordChangedAt... hence, if this happens, then the user will be asked to enter his username and password again, though he just logged it... to avoid it, let us create the (date - 1 second) to avoid this issue... it is a small hack
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//this middleware is to run for the query. It will hide all inactive users from the list of displayed users
userSchema.pre(/^find/, function(next) {
  //THIS refers to the current query
  this.find({ active: { $ne: false } });
  next();
});
//below is an example of instance method ... it will then be available on every user document that I create or address to... so... here, because we have {select: false} on passwords, we cannot target it this way 'this.password'... therefore, userPassword is passed as a second argument
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//here is another instance to check when the password was changed last
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    //if the token was issued after the last password change, then JWTTimestamp will be larger than changedTimestamp
    return JWTTimestamp < changedTimestamp; // false, if all is OK
  }
  //FALSE means the password was not changed after the token was given
  return false;
};

//here is an instance method to generate a random token to later send it as an email for password reset
userSchema.methods.createPasswordResetToken = function() {
  //here I create a token which I will later send to the user via email
  const resetToken = crypto.randomBytes(32).toString('hex');
  //here, I encrypt the created token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  //remember, the above manipulations with the data are just modifications and are not saved anywhere in the DB
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
