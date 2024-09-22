const mongoose = require("mongoose")

const locationScheme = new mongoose.Schema({
    locationName:{type:String,default:"",required:true},
},{timestamps:true})

const Location = new mongoose.model("Location",locationScheme)
module.exports = Location;