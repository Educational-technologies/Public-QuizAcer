const express = require('express'); // uses expres 
const router = express.Router(); // makes router 
const path = require('path'); // uses the path 

const images = path.join(__dirname,'../../FrontEnd/images') // gets the folder that holds all the files 

router.use("/[Rr]egistration", express.static(path.join(images,"registration-background-img.jpg"))); // means it never changes (makes it fucking effiecent);
router.use("/[Ff]avicon", express.static(path.join(images,"favicon.ico"))); // means it never changes (makes it fucking effiecent);

router.use("/512x512.png", express.static(path.join(images, "512x512pic.png")));
router.use("/192x192.png", express.static(path.join(images, "192x192pic.png")));

module.exports = router; // EXPORTS THE ROUTER 