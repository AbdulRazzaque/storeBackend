const mongoose = require("mongoose")

const locationScheme = new mongoose.Schema({
    name:{type:String,default:"",required:true},
    trainerName:{type:String,default:"",required:true},
    doctorName:{type:String,default:"",required:true},
},{timestamps:true})

const Location = new mongoose.model("Location",locationScheme)
module.exports = Location;