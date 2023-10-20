const express = require('express'); // expres 
const router = express.Router(); // router
const path = require('path'); // path 

const Sound = path.join(__dirname, '../../FrontEnd/Sound');

router.use("/[Bb]utton[Hh]over", express.static(path.join(Sound,"ButtonHover.wav"))); // means it never changes (makes it fucking effiecent);

module.exports = router;