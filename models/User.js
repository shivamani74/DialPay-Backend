import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: true,
    },

    pin: {
      type: String,
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    otp: String,
    otpExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
