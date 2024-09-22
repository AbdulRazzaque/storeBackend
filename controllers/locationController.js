const mongoose = require('mongoose')
const Location = require("../models/Location")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")

class LocationController{
    async createLocation(req,res){
        const {locationName}=req.body;
        if(!locationName){
            res.status(400).send("Data Missing")
        }
        else{
            let newName = `${locationName} `
            try {
                const existingLocation = await Location.findOne({ locationName:newName})
                if(existingLocation){
                    res.status(400).send("Product Already Exist");
                   }
                   else{
                    const newLocation = new Location({
                        locationName:newName,
                  
                    })
                    newLocation.save()
                    .then(newProdResponse=>{
                        res.status(200).send({msg:"Location added successfully",result:newProdResponse})
                    })
                }
            

            } catch (error) {
                res.status(500).send(`Error: ${error.message}`);
            }  
        } 
    }


    async UpdateLocation(req,res){
        const {locationName,_id}=req.body;
        let newName = `${locationName}`
        if(!locationName){
            res.status(400).send("Data Missing")
        }
        else{
            Location.updateOne({_id:mongoose.Types.ObjectId(_id)},{$set:{locationName:newName}})
            .then(response=>{
                res.status(200).send({msg:"success",result:response})
            })
        }

    }


    async deleteLocation(req, res, next) {
        let locationDelete;
        try {
            locationDelete = await Location.findByIdAndRemove({ _id: req.params.id });
          if (!locationDelete) {
            return next(new Error("Noting to delete"));
          }
        } catch (error) {
          return next(error);
        }
        res.json(locationDelete);
      }
 
    async getAllLocations(req,res){
        Location.find({})
        .then(response=>{
            res.status(200).send({msg:"success",result:response})
        })
    }

    async getSingleLocation(req,res){
        Location.find({_id:mongoose.Types.ObjectId(req.body.id)})
        .then(response=>{
            res.status(200).send({msg:"success",result:response})
        })
    }

}

const locationController = new LocationController();
module.exports=locationController;