const express = require('express')
const router = express.Router();
const memberController = require('../controllers/membersController')
const isAdminAuth = require("../middlewares/isAdminAuth")
const isUserAuth = require("../middlewares/isUserAuth")

router.get('/getAllMember',isAdminAuth,memberController.getAllMember)
// router.post('/createSupplier',isAdminAuth,supplierController.createSupplier)
// router.post('/deleteSuppliers',isAdminAuth,supplierController.deleteSuppliers)
router.post('/createMember',isAdminAuth,memberController.createMember)
router.put('/updateMember/:id',isAdminAuth,memberController.updateMember)
router.delete('/deleteMember/:id',isAdminAuth, memberController.deleteMember)

module.exports=router; 