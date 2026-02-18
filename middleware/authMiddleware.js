import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const protect = async(req,res,next)=>{
    try{
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
        {
            token = req.headers.authorization.split(" ")[1];
        }
        if(!token){
            return res.status(401).json({message:"Not authorized,No token Provided"});
        }
        const decoded  = jwt.verify(token,process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password -pin");
        if(!req.user){
            return res.status(401).json({message:"User Not Found"});
        }
        next();
    }
    catch(error)
    {
        console.error("Auth midWare error",error.message);
        res.status(401).json({message:"Not authorized , token failed"});
    }
}