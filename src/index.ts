import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import validator from "validator";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware.js";
import crypto from "crypto";

//mongodb import
import { User } from "./db.js";
import { Tag } from "./db.js";
import { Content } from "./db.js";
import { Link } from "./db.js";


const app = express();
dotenv.config();

//middleware
app.use(cors());
app.use(express.json());


app.post('/api/v1/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        //check username and password not empty
        if (!username || !password) {
            return res.status(411).json({ message: " Error in inputs all field required" })
        }
        

        //validate password
        if (!validator.isStrongPassword(password, { minLength: 8, minSymbols: 1, minNumbers: 1 })) {
            return res.status(400).json({ message: "Password should be 8 to 20 letters, should have atleast one uppercase, one lowercase, one special character, one number " })

        }
        
        //validate username
        if (username.length < 3 || username.length > 8) {
            return res.status(400).json({
                message: "username must be between 3 to 8 characters"

            })

        }

        //check exsisting user
        const exsistingUser = await User.findOne({ username });
        if (exsistingUser) {
            return res.status(403).json({ message: "User already exists with this username" })
        }

        //creating new user
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ username: username, password: hashedPassword });

        res.status(200).json({ message: " Signed up " })

    } catch (e) {
        res.status(500).json({ message: "Server error", e })

    }

});

app.post('/api/v1/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        //check signup 
        if (!username || !password) {
            return res.status(400).json({
                message: "All field required"
            });
        }

        //find user
        const user=await User.findOne({username:username});
        if(!user){
            return res.status(404).json({
                message:"user not found"
            })
        }

        //compare password
        const checkPassword = await bcrypt.compare(password,user.password);

        if (!checkPassword) {
            return res.status(403).json({
                message: "Wrong password"
            })
        }

        //generate jwt
        const token=jwt.sign(
          {userId:user._id},
          process.env.JWT_SECRET!,
        );

        return res.status(200).json({
            message:"user signin",
            "token":token
        })


    } catch (e) {
        res.status(500).json({ message: "internal server error" })
    }


});

app.post('/api/v1/content',authMiddleware,async (req,res,next)=>{
try{
    const{type,link,title,tags}=req.body;
    const content= await Content.create({
        link:link,
        type:type,
        title:title,
        tags:tags,
        userId:req.userId!
    });

    return res.status(200).json({message:"content added"})


}catch(e){
    return res.status(400).json({message:"content not added",e})

}

});

app.get('/api/v1/content',authMiddleware,async (req,res)=>{
    try{
        const content=await Content.find({userId:req.userId!});
        return res.status(200).json({content})

    }catch(e){
        return res.status(500).json({message:"error in content",e})

    };
});

app.delete('/api/v1/content/:id',authMiddleware,async (req,res)=>{

    const {id}=req.params;

    if(!id||typeof id !== "string"){
        return res.status(400).json({message:"content id misiing"});

    }


    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({ message: "Invalid content id" });

    }

    try{

        const deletedContent= await Content.findOneAndDelete({_id:id});

        return res.status(200).json({message:"content deleted"})

    }catch(e){
        return res.status(403).json({message:"Trying to delete a doc you don’t own"})

    }

});

app.post('/api/v1/brain/share',authMiddleware,async(req,res)=>{

    const {share}=req.body;
    if(typeof(share) !=="boolean"){
        return res.status(400).json({message:"share must be true or false"});
    }

    try{
        if(share){

            const shareLink=crypto.randomBytes(16).toString("hex")
            await User.findByIdAndUpdate(req.userId,{
                shareEnable:true,
                shareLink:shareLink
            })

            
           return res.status(200).json({message:"sharing enable",shareLink:shareLink});
        }else{
            await User.findByIdAndUpdate(req.userId,{
                shareEnable:false,
                shareLink:null
            })

            
           return res.status(200).json({message:"sharing disabled"});
        }


    }catch(e){
        return res.status(404).json({message:"server error"});
    }

});

app.get('/api/v1/brain/:shareLink',async (req,res)=>{
    const {shareLink}=req.params;

    if(!shareLink||typeof shareLink !== "string"){
        return res.status(400).json({message:"share id misiing"});

    }

    try{
        const user=await User.findOne({shareLink:shareLink,shareEnable:true});


        if(!user){
            return res.status(400).json({message:"user not found"});
        }

        const content=await Content.find({userId:user._id});

        return res.status(200).json({username:user.username,content:content});

    }catch(e){

        return res.status(404).json({message:" the share link is invalid or sharing is disabled"});

    }

})



app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})