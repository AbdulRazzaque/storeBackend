const express = require('express')
const router = express.Router();
const locationController = require('../controllers/locationController')
const isAdminAuth = require("../middlewares/isAdminAuth")
const isUserAuth = require("../middlewares/isUserAuth")

router.get('/getAllLocations',locationController.getAllLocations)
router.get('/getSingleLocation',locationController.getSingleLocation)
router.post('/createLocation',isAdminAuth,locationController.createLocation)
// router.post('/deleteLocations',isAdminAuth,locationController.deleteLocations)
router.put('/UpdateLocation',locationController.UpdateLocation)
router.delete('/deleteLocation/:id',locationController.deleteLocation)

module.exports=router;