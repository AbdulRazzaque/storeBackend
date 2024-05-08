const mongoose = require('mongoose')
const Location = require("../models/Location")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")

class LocationController{
    async createLocation(req,res){
        const {name,trainerName,doctorName}=req.body;
        if(!name || !trainerName || !doctorName){
            res.status(400).send("Data Missing")
        }
        let newName = `${name} ${trainerName} ${doctorName}`
        Location.findOne({name:newName})
        .then(response=>{
            if(response){
                res.status(400).send({ message: 'This Location is already available' });
            }
            else{
                const newLocation = new Location({
                    name,
                    trainerName,
                    doctorName,
                })
                newLocation.save()
                .then(newProdResponse=>{
                    res.status(200).send({msg:"success",result:newProdResponse})
                })
            }
        })
        
    }
    async UpdateLocation(req,res){
        const {name,trainerName,doctorName,locationId}=req.body;
        let newName = `${name} ${trainerName} ${doctorName}`
        if(!name || !trainerName || !doctorName){
            res.status(400).send("Data Missing")
        }
        else{
            Location.updateOne({_id:mongoose.Types.ObjectId(locationId)},{$set:{name:newName,trainerName,doctorName}})
            .then(response=>{
                res.status(200).send({msg:"success",result:response})
            })
        }

    }


    async deletelocationone(req, res, next) {
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