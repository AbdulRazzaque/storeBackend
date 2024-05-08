const jwt = require("jsonwebtoken");

module.exports =  isUserAuth = (req,res,next)=>{
    //console.log(req.headers)
    if(!req.headers.token || req.headers.token==="undefined"){
        res.status(402).send("Unauthorized Access")
    }else{
        try{
            let decode = jwt.verify(req.headers.token, process.env.TOKEN);
            if(!decode.userName || !decode._id){
                res.status(402).send("Unauthorized Access")
            }else{
                req.userDetails = decode
                next()
            }
        }catch{
            res.status(402).send("Unauthorized Access")
        }
        
        

    }
}