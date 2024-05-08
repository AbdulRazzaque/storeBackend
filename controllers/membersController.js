const mongoose = require('mongoose')
const Member = require("../models/Member")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")

class MemberController{
    async createMember(req,res){
        const {memberName,department}=req.body;
        if(!memberName || !department ){
            res.status(400).send("Data Missing")
        }
        else{
            const newSupplier = new Member({
                memberName,
                department,
                
            })
            newSupplier.save()
            .then(response=>{
                res.status(200).send({msg:"Members added successfully.",result:response})
            })
            
        }
    }

    async getAllMember(req,res){
        Member.find({}).sort({_id:-1})
        .then(response=>{
            res.status(200).send({msg:"success",result:response})
        })
    }
    async deleteMember(req, res, next) {
        let product;
        try {
          product = await Member.findByIdAndRemove({ _id: req.params.id });
         
          if (!product) {
            return next(new Error("Noting to delete"));
          }
        } catch (error) {
          return next(error);
        }
        res.json(product);
      }
async updateMember (req,res,next){
    const {memberName,department}=req.body;
    if(!memberName || !department ){
        res.status(400).send("Data Missing")
    }else{
        Member.updateOne({_id:req.params.id},{$set:{memberName,department}})
        .then(response=>{
            res.status(200).send({msg:"Member information updated",result:response})
        })
    }
}




}

const memberController = new MemberController();
module.exports=memberController;