const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,   // always store lower-cased → case-insensitive login
      trim:      true,
    },
    password: {
      type:     String,
      required: true,
    },
    role: {
      type:     String,
      enum:     ['admin', 'captain'],
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook – hash password whenever it is new or changed.
 * This is a safety net for any code that calls user.save() directly.
 * The controller also hashes explicitly, so double-hashing is guarded
 * by the isModified check.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // If the password is already hashed (starts with $2b$ or $2a$), skip.
  if (this.password.startsWith('$2')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/** Instance method – compare plain text password with stored hash */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
