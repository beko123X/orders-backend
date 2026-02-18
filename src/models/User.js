// backend/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin, manager]
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// ✅ الطريقة الصحيحة 1: استخدام async/await بدون next
userSchema.pre("save", async function() {
  // إذا لم يتم تعديل كلمة المرور، لا تفعل شيئاً
  if (!this.isModified("password")) return;
  
  // تشفير كلمة المرور
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ✅ الطريقة الصحيحة 2: استخدام callback مع next (بديل)
// userSchema.pre("save", function(next) {
//   if (!this.isModified("password")) return next();
//   
//   bcrypt.genSalt(10, (err, salt) => {
//     if (err) return next(err);
//     
//     bcrypt.hash(this.password, salt, (err, hash) => {
//       if (err) return next(err);
//       this.password = hash;
//       next();
//     });
//   });
// });

// Comparing password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.model("User", userSchema);
export default User;