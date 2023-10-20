/*
    Chances are very likely none if this code will be edited 
*/
var express = require('express'); // express is the api that we use to make the app run it just is easy idk 
var app = express(); // we make an applet out of the express 

var db = require("../Server/API/FetchData"); // db is pointing to the db file that fetches data
db.dbsInit(); // runs that command on the FetchData.js

var https = require('https'); // enables https 

const fs = require('fs'); // fs is a thing that reads data from files
const path = require('path'); // this just allows for easier routing when it comes to file explorer. 

const privateKeyPath = path.join(__dirname, '../cert', 'RealprivateKey.pem');  // The path to the file that holds the key that the certificate autherizes 
const privateKey = fs.readFileSync(privateKeyPath, 'utf8'); // gets the key 
const certificatePath = path.join(__dirname, '../cert', 'RealCertificate.pem'); // The path to the file that holds the cerficiate
const certificate = fs.readFileSync(certificatePath, 'utf8'); // get the certificate

const main = require("../Server/SSR/Main"); // this just requires that that exsist and that it fetches the code. 
const images = require("./API/images"); // same ^
const css = require("./API/CSS"); // same ^ ^
const FlashCard = require("./API/FlashCards"); // same ^ ^ ^
const Sound = require("./API/Sound.js");
const JS = require("./API/JS.js");
const user = require("./API/User.js");

var options = { // sets up the options to make the certificate HTTPS
    key: privateKey, // key == private key 
    cert: certificate // cert is the certificate!
};

app.use("/api/images/", images); // this means that the server also runs these files constantly allowing for them to be routers.
// The /api/images/ is for effecincy as it means it only is checked if there is a router if it goes in the path /api/images/ and so forth. 
app.use("/api/CSS/", css);  //  Routers are just files that are not in the same file as the server that run as the server!
app.use("/api/FlashCards", FlashCard);
app.use(main); // This can handle any request. 
app.use("/api/sound", Sound);
app.use("/api/js", JS);
app.use("/api/user/", user);

const server = https.createServer(options, app); // init the server using the https fucntion create server which needs the certificate options and applet to be passes

server.listen(443, () => {

    console.log('Server is running on https://localhost');
}); // confirms the server is running 
