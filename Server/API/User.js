const express = require('express'); // expres 
const router = express.Router(); // router
const path = require('path'); // path 
const rateLimit = require('express-rate-limit'); // allows for apis to be rate limiting making it so ppl can spam them and take advantage of the systems. 
const cookieParser = require('cookie-parser'); // for cookies allows for simplier interactions 
const bodyParser = require('body-parser'); // for getting data from post functions; simplier interactions 
const cookieEncrypter = require('cookie-encrypter'); // this makes it so the cookie data gets encrypted automaticly and we don't have to deal with it. 

const encrypt = require("./ServerSide/EncryptionKey"); // this enables encryption server side
const DataModule = require('./FetchData'); // enables the ability to get data from the db. 

var encryptionKey = "Redacted"; // this prob shouldn't be here but it's so much easier to have it like this XD

const limiter = rateLimit({ // sets up the ratelimiter 
    windowMs: 60 * 60 * 1000, // 1 hr
    max: 5, // Maximum of 5 requests per hr
    handler: (req, res) => { // if the rate limit has been reached send this to the user
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.', message: 'Rate Limit exceded please don\'t spam' });
    },
});


const cookieOptions = { // sets up the cookie and how it should be encrypted and other settings 
    expires: new Date(Date.now() + 604800000),  // when the cookie expires I believe this is 1 week aka the user will be loged in for 1 week 
    httpOnly: true, // idk I think it makes it so that they can't access it in javascript
    secure: true, // makes it secure 
    sameSite: 'strict' // makes it so the cookie can only be accessed on site
}

router.use(cookieParser()); // just initilizes the cookie parser 
router.use(cookieEncrypter("Redacted",
    {
        algorithm: 'aes256',
        encoding: 'base64',
        ttl: 604800
    }
)); // sets up the encryption for cookies
router.use(bodyParser.json()); // init the bodyParser. 

router.post('/changeusername', limiter ,(req,res) => {
   try {
    if(!req.body || !req.body.username || !req.body.password || !req.cookies || !req.cookies.sessionID || !req.cookies.username ){
        res.json({err:"ERROR: missing some data"});
        return; 
    }
    const username = req.body.username;
    const olduser = req.cookies.username;
    const SSID = req.cookies.sessionID;
    const password = req.body.password;
    DataModule.checkIfUserExists(username, function (err, exsits) {
        if (err) {
            console.error(err); // log error
            res.json({err:"ERROR: occured while trying to see if a user with that name exsits!"});
            return;
        }
        if (exsits) {
            res.json({err:"ERROR: Username is already taken!"});
            return;
        }
        DataModule.getSSID(olduser, function (err, ssid) {
            if (err) {
                console.error(err); // log error
                res.json({err:"ERROR: occured whilist trying to get your sessionID"});
                return;
            }
  
            if(SSID != ssid.sessionID){
                res.json({err:"ERROR / reload the page"});
                return; 
            }
            DataModule.getLoginInfo(olduser, function (err, data) {
                if(err){
                    console.log(err);
                    res.json({err:"ERROR: fetching login data!"});
                    return;
                }
                if(!data){
                    res.json({err:"ERROR: user seems to not exsits"});
                    return;
                }
                const pswrd = encrypt.decryptData(data.password, encryptionKey);
                if (olduser !== data.username || password !== pswrd) {
                    res.json({err:"ERROR: Password is incorrect!"});
                    return;
                }
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                if(new Date(data.nameLastChanged) > oneWeekAgo){
                    res.json({err:"You have changed your username in the last week! on cooldown!"});
                    return;
                }
                DataModule.changeusername(olduser, username, function(err, success){
                    if(err){
                        console.error(err); // log error
                        res.json({err:"ERROR / ur account might be messed up"});
                        return; 
                    }
                    res.cookie("username", username, cookieOptions);
                    res.json({success: true, message: "Your username has been changed!"});
                });
            }); 
        });   
    });
   } catch (error) {
    console.error(error);
   } 
});

router.post('/[Cc]hange[Ee]mail', limiter ,(req,res) => {
    try {
     if(!req.body || !req.body.email || !req.body.password || !req.cookies || !req.cookies.sessionID || !req.cookies.username ){
         res.json({err:"ERROR: missing some data"});
         return; 
     }
     const email = req.body.email;
     const username = req.cookies.username;
     const SSID = req.cookies.sessionID;
     const password = req.body.password;
     DataModule.getSSID(olduser, function (err, ssid) {
        if (err) {
            console.error(err); // log error
            res.json({err:"ERROR: occured whilist trying to get your sessionID"});
            return;
        }

        if(SSID != ssid.sessionID){
            res.json({err:"ERROR / reload the page"});
            return; 
        }
        DataModule.getLoginInfo(username, function (err, data) {
            if(err){
                console.log(err);
                res.json({err:"ERROR: fetching login data!"});
                return;
            }
            if(!data){
                res.json({err:"ERROR: user seems to not exsits"});
                return;
            }
            const pswrd = encrypt.decryptData(data.password, encryptionKey);
            if (username !== data.username || password !== pswrd) {
                res.json({err:"ERROR: Password is incorrect!"});
                return;
            }
        });
    });
    } catch(err){
        console.log(err);
        res.json({err:"ERROR: an error with the code occured - if this persist contact Support@quizacer.com"});
    }
});
 
module.exports = router; // exports the router!?!