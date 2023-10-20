const express = require('express'); // expres 
const router = express.Router(); // router
const path = require('path'); // path 

const css = path.join(__dirname,'../../FrontEnd/CSS'); // folder that holds css files

router.use("/[Aa]nimations", express.static(path.join(css,"Animations.css"))); // means it never changes (makes it  effiecent);
 
module.exports = router; // exports the router!?!