import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

export const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Token is required." });
    }
    const decode = jwt.verify(token, process.env.secretkey);
    if (!decode) {
      return res.status(401).json({ message: "Unauthorized - Invalid token." });
    }
    const user = await User.findById(decode.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("error in checkAuth middleware", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Invalid or expired token." });
    }
    return res.status(500).json({ message: "Internal server error." });
  }
};