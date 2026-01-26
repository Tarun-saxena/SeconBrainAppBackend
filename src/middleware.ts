import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware=((req:Request,res:Response,next:NextFunction)=>{
    const authHeader=req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({
            message:"authorization token missing"
        })
    };

    const token=authHeader.split(" ")[1]; //format => bearer token

    try{
        const secret = process.env.JWT_SECRET;  
        const decoded = jwt.verify(token!, secret!) as JwtPayload;
        req.userId = decoded.userId as string;
        next();

    }catch(e){
        return res.status(401).json({
            message:"invalid experied token"
        })

    }
})