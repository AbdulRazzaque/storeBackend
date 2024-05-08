const mongoose = require("mongoose")

const MemberScheme = new mongoose.Schema({
    memberName:{type:String,required:true},
    department:{type:String,required:true},
},{timestamps:true}) 

const memberName = new mongoose.model("Member",MemberScheme)
module.exports = memberName;