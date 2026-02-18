import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt  from 'jsonwebtoken';
import { sendOTP } from "../services/smsServices.js";
const generateToken=(id)=>{
    return jwt.sign(
        {id},
        process.env.JWT_SECRET,{
            expiresIn:"7d",
        }
    );
};
const generateOTP =()=>{
    return Math.floor(100000+Math.random()*900000).toString();
};
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, pin } = req.body;

    if (!name || !phone || !password || !pin) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ phone }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // ✅ Development Mode
    if (process.env.NODE_ENV === "development") {
      console.log("🔐 DEV OTP:", otp);
    } else {
      await sendOTP(phone, otp);
    }

    const salt = await bcrypt.genSalt(10);

    await User.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, salt),
      pin: await bcrypt.hash(pin, salt),
      otp: await bcrypt.hash(otp, 10),
      otpExpires: otpExpiry,
      isVerified: false,
      balance: 0
    });

    res.status(201).json({
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === "development" ? otp : undefined
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp); // ✅ fixed

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.status(200).json({
      message: "Phone verified successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const loginUser = async(req,res)=>{
    try{
        const{phone,password} = req.body;
        if(!phone || !password){
            return res.status(400).json({message:"Phone and Password are Required"});
        }
        const user = await User.findOne({phone});
        if(!user){
            return res.status(400).json({message:"Invalud Phone or Password"});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        res.status(200).json({
            message:"Login Successful",
            token:generateToken(user._id),
            user:{
                name:user.name,
                id:user._id,
                phone:user.phone,
                balance:user.balance
            }
        });
    }
    catch(error){
        console.error("LOGIN ERROR:",error.message);
        res.status(500).json({message:"Server Error"});
    }
};