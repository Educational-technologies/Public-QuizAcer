const express = require('express'); // expres 
const router = express.Router(); // router
const path = require('path'); // path 

const JS = path.join(__dirname,'../../FrontEnd/JS'); // folder that holds JS files

router.use("/[Ss]ervice[Ww]orker[Ii]nit.js", express.static(path.join(JS,"ServiceWorkerInit.js"))); 
router.use("/[Ss]ervice[Ww]orker.js", express.static(path.join(JS,"ServiceWorker.js"))); 

router.use("/cookies.js", express.static(path.join(JS, "Cookies.js")));
 
module.exports = router; // exports the router!?!