import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.userId || decoded.id).select("-password");
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: "Not authorized" 
    });
  }
};

export default protect;