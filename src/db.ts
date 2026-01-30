import mongoose from "mongoose";
import dotenv from  "dotenv";

dotenv.config();



mongoose.connect(process.env.MONGO_CONNCTION_STRING!);


const contentTypes=['image','video','article','audio'];



const userSchema= new mongoose.Schema({
    username: {type:String ,required:true},
    password: {type:String ,required:true},
    shareEnable:{type:Boolean,default:false},
    shareLink:{type:String,default:null},


});


const contentSchema= new mongoose.Schema({
    link:{type:String,required:true},
    type:{type:String ,enum:contentTypes,required:true},
    title:{type:String,required:true},
    tags:[{type:mongoose.Schema.Types.ObjectId,ref:"Tag"}],
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},

});


const tagSchema=new mongoose.Schema({
    title:[{type:String,required:true,unique:true}],
});


const linkSchema= new mongoose.Schema({
        userId:{type:mongoose.Schema.Types.ObjectId,required:true,ref:"User"},
        hash:{type:String,required:true},
    
});



export const User =mongoose.model("User",userSchema);
export const Link = mongoose.model("Link", linkSchema);
export const Content = mongoose.model("Content", contentSchema);
export const Tag = mongoose.model("Tag", tagSchema);