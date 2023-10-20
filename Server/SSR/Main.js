const express = require('express'); // express this the api 
const router = express.Router(); // ok this is like an app but it basicly doesn't run its own thing it joins onto a server 
const rateLimit = require('express-rate-limit'); // allows for apis to be rate limiting making it so ppl can spam them and take advantage of the systems. 
const cookieParser = require('cookie-parser'); // for cookies allows for simplier interactions 
const bodyParser = require('body-parser'); // for getting data from post functions; simplier interactions 
const cookieEncrypter = require('cookie-encrypter'); // this makes it so the cookie data gets encrypted automaticly and we don't have to deal with it. 
const { join } = require('path'); // path makes getting to files easier. 
const path = require('path'); // path makes getting to files easier.
const HTML = join(__dirname, '..', "..", 'FrontEnd'); // gets the folder where all the html is stored. 
const base = join(__dirname, '..', "..");

const EmailWorker = require("../EMAIL/EmailWorker.js");

const encryptionModule = require('../API/ServerSide/EncryptionKey'); // there are functions that are used serverside that are located in diff files thats this 
const DataModule = require('../API/FetchData'); // same thing as above This one allows interaction with the databases though and will be used a lot more. 

var encryptionKey = "Redacted"; // this prob shouldn't be here but it's so much easier to have it like this XD

const limiter = rateLimit({ // sets up the ratelimiter 
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Maximum of 10 requests per minute
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

/*

    req == reqest includes any data the user send 
    and res is what your sending back


    **PROMISS FUNCTIONS QUICK TUTORIAL**
    Also for almost all the Data Module functions they are promiss functions, 
    This means they are async, that means you have to call them in a funky way  
    You call them by doing this:
    DataModule.idk(Datatopasstofucntion, (callback function)function(err, what ever i want the data i get back to be called){

    }); its very simple but if you 
    put code here like console.log("Done");
    that will log done before the function is over that is why all the functionality has to be inside of it 
    the first thing you should always do it check if there was an error with
    if(err){} else {then check that your data is correct or whatever} 

    ^ Simple tutorial of promiss functions by Brett
    

    **DIFFERNCE BETWEEN POST AND GET TUTORIAL**
    ok so get means that all the data that is passes do the code is in the url or a cookie, 
    Post means that your sending a data to the server and passing it (bad explaination but)
    They both can do the same thing other then post can't just be called with website.com/login <- that is a get 
    So all you need to know is if it is a page the users go to then use get if it is an api func user post
    If you have any more questions ask me I did a terrible job explaining!

*/
router.get('/', (req, res) => { // base thing 
    res.redirect("/login"); // redirects to login 
});

router.get('/[Ll]ogin|[Rr]egister', (req, res) => { // if the people go on the webiste and go to Quizacer.com/login or Login or Register or register then this code gets run 
    try {
        if (req.cookies && req.cookies.sessionID && req.cookies.username) { // checks if the user has cookies on the side if they do then checks if they have the sessionID cooke and the username cookie
            var sessionID = req.cookies.sessionID; // gets SSID
            var username = req.cookies.username; // gets username 
            DataModule.getSSID(username, function (err, ssid) { // DataModule allows for interactions with the db you always have to set it up like this with the DM.fucntion u want(passing data, then fucntion(err, data you want){})
                // contuine ^ this is because they are called promiss functions which mean they don't instanly execute and they wait a very small amount of time you can have any code you don't want running outside the functioin
                if (err) { // if there is an error 
                    console.error(err); // log error 
                    res.sendFile(join(HTML, 'Register.html')); // send just the normal login page meaning that something went wrong so just have them signin again
                } else { // if no error 
                    if (ssid.sessionID == sessionID) { // check if the ssid is correct 
                        res.redirect("/home"); // redirect the to the main page 
                    } else {
                        res.sendFile(join(HTML, 'Register.html')); // if incorrect have them login 
                    }
                }
            });
        } else { // if they don't have the cookie... 
            res.sendFile(join(HTML, 'Register.html')); //  just send them login page 
        }
    } catch (err) {
        res.send(err);
    }
});

router.get('/home|/quizacer', (req, res) => { // code for the main site page 
    try {
        if (req.cookies && req.cookies.sessionID && req.cookies.username) { // checks to make sure they have the ssid cookie 
            var sessionID = req.cookies.sessionID; // gets SSID
            var username = req.cookies.username; // gets username
            DataModule.getSSID(username, function (err, ssid) {  // runs a promiss function to get the ssid stored in the database
                if (err) { // if there is an error 
                    console.error(err); // log error
                    res.redirect("/login"); // redirect to the login page
                } else { // not error 
                    if (ssid.sessionID == sessionID) { // check if ssid is correct 
                        res.sendFile(join(HTML, 'Home.html')); // send the webpage
                    } else { // if incorrect
                        res.redirect("/login"); // login
                    }
                }
            });
        } else {
            res.redirect("/login"); // if they don't have the cookie send to login.
        }
    } catch (err) {
        res.send(err);
    }
});

router.get('/[Nn]ew[Cc]ard', (req, res) => { // code for the main site page 
    try {
        if (req.cookies && req.cookies.sessionID && req.cookies.username) { // checks to make sure they have the ssid cookie 
            var sessionID = req.cookies.sessionID; // gets SSID
            var username = req.cookies.username; // gets username
            DataModule.getSSID(username, function (err, ssid) {  // runs a promiss function to get the ssid stored in the database
                if (err) { // if there is an error 
                    console.error(err); // log error
                    res.redirect("/login"); // redirect to the login page
                } else { // not error 
                    if (ssid.sessionID == sessionID) { // check if ssid is correct 
                        res.sendFile(join(HTML, 'FlashCard.html')); // send the webpage
                    } else { // if incorrect
                        res.redirect("/login"); // login
                    }
                }
            });
        } else {
            res.redirect("/login"); // if they don't have the cookie send to login.
        }
    } catch (err) {
        res.send(err);
    }
});

router.get('/edit', (req, res) => { // code for the main site page 
    try {
        if (!req.cookies || !req.cookies.sessionID || !req.cookies.username) { // checks to make sure they have the ssid cookie 
            res.redirect("/login");
            return;
        }
        var sessionID = req.cookies.sessionID; // gets SSID
        var username = req.cookies.username; // gets username
        var querty = req.query.id;

        if(!querty){
            res.redirect("/home");
            return;
        }
        DataModule.getSSID(username, function (err, ssid) {  // runs a promiss function to get the ssid stored in the database
            if (err) { // if there is an error 
                console.error(err); // log error
                res.redirect("/login"); // redirect to the login page
                return;
            }
            if (ssid.sessionID == sessionID) { // check if ssid is correct 
                DataModule.isUsersCard(username, querty, function (err, isCard) {
                    if (err) {
                        console.log(err);
                        res.redirect("/home");
                        return;
                    }
                    if (isCard === true) {
                        res.sendFile(join(HTML, 'FlashCard.html'));
                        return;
                    }
                    res.send("This is not your card: You can't edit it please return to /home!");
                });
            } else { // if incorrect
                res.redirect("/login"); // login
            }
        });
    } catch (err) {
        res.send(err);
    }
});

router.post("/VerifyEmail", limiter, (req, res) => {
    try{
        if (!req.body || !req.body.username || !req.body.email){
            res.json({ message: 'INVALID DATA!' });
            return; 
        }

        const username = req.body.username;
        const email = req.body.email;

        if(!DataModule.isValidEmail(email)){
            res.json({ message: 'INVALID Email!' });
            return; 
        }

        if(EmailWorker.checkIfUserExists(username)){
            res.json({ message: 'Username is already in use!' });
            return;
        }
        DataModule.checkIfUserExists(username, function (err, exsits) { // runs that fucntions which returns true false or null 
            if (err) { // checks if there is error 
                console.error(err); // log error 
                res.json({ message: 'an error occured: couldn\'t fetch neccessary data - try again soon' }); // send back to client there was error
                return; 
            }
            if(exsits){
                res.json({ message: 'Username is already in use!' });
                return;
            }
            EmailWorker.sendCode(username, email, EmailWorker.generate8DigitCode());
            res.json({ success: true});
        });
    } catch(err) {
        console.log(err);
        res.send(err);
    }
});

router.post('/CreateAccount', limiter, (req, res) => { // post meaning it is an api function ok i will break this down
    // router.post <- that just makes a new post path 
    // '/CreateAccount' that is the path on the website so you go to quizacer.com/CreateAccount (this is called in clientside js)
    // limiter adds a rate limit to this api
    // req <- data the client is sending, res <- data you send back
    try {
        if (req.body && req.body.username && req.body.email && req.body.password, req.body.code) { // if all the neccessary data was sent 
            const data = req.body; // gets all the data into varibles. 
            const username = data.username;
            const email = data.email;
            const password = data.password;
            const code = data.code;

            if(!DataModule.isValidEmail(email)){
                res.json({ message: 'INVALID Email!' });
                return; 
            }

            const verifyCode = EmailWorker.verifyCode(username, code);

            if(!verifyCode[1]){
                if(verifyCode[2]){
                    res.json({ message: 'Maxium amount of tries reached: Please re-create the account!' });
                    return; 
                }
                if(!verifyCode[0]){
                    res.json({ message: 'The code expired or an unexpected error happened! reload' });
                    return; 
                } 
                res.json({ message: 'INVALID code!' });
                return; 
            }

            if(DataModule.badPhrase(username)) {
                res.json({ message: 'Your username can\'t have a bad word' });
                return;
            } 

            DataModule.checkIfUserExists(username, function (err, exsits) { // runs that fucntions which returns true false or null 
                if (err) { // checks if there is error 
                    console.error(err); // log error 
                    res.json({ message: 'an error occured: couldn\'t fetch neccessary data - try again soon' }); // send back to client there was error
                    return; 
                } else if (exsits != true) { // because this is creating a new account you want to make sure that the account doesn't exsit. 
                    DataModule.newUser(username, encryptionModule.encryptData(password, encryptionKey), email, function (err, created) { // creates a new user passing all the data stored in users. 
                        if (err) { // checks if there is an error 
                            console.log(err)
                            DataModule.deleteUser(username, function (err, message) { // because there is an error you want to just make a new account so you delete the error account
                                res.json({ message: 'an error occured: ERROR creating the account - try again soon' }); // send error message to client. 
                                return;
                            });
                        } else if (created) { // if the account was created successfully! 
                            var ssid = DataModule.generateSSID(); // make a new ssid 

                            DataModule.newSSID(username, ssid, new Date(Date.now() + 604800000).toISOString(), function (err, success) { // sets the new ssid to the user in the database 
                                if (err) { // if err has them re login 
                                    res.json({ message: 'an error occured: error creating sessionID try logging in!' }); // sends error message 
                                    console.log(err);
                                } else if (success) { // if it works 
                                    res.cookie("sessionID", ssid, cookieOptions); // sets the sessionID cookie to the ssid and applies cookieoptions  
                                    res.cookie("username", username, cookieOptions); // sets the username cookie to the username and applies cookieoptions                 
                                    res.json({ URL: '/home' }); // tells like client to go the the /main url 
                                } else {
                                    res.json({ message: 'an error occured: error creating sessionID try logging in!' }); // sends an error if it doesn't work 
                                }
                            });
                        } else {
                            res.json({ message: 'an error occured: ERROR creating the account - try again soon' }); // send message if there is an error creating the account
                        }
                    });
                } else {
                    res.json({ message: 'an error occured: Someone With that username already exsits!' }); // sends this if the user already exsits. 
                }
            });
        } else {
            res.json({ message: 'INVALID DATA!' }); // if not all the params are met. 
        }
    } catch (err) {
        res.send(err);
    }
});

router.post('/[Ll]og-in', limiter, (req, res) => { // this is for login functionality endpoints are /log-in or /Log-in (everything is case sensitive)
    try {
        if (!req.body || !req.body.username || !req.body.password) { // checks if they all exsist 
            res.json({ message: 'INVALID DATA!' }); // IF THEY DIDN'T send username and password
            return;
        }
        var username = req.body.username; // gets username 
        var password = req.body.password; // gets password 
        DataModule.getLoginInfo(username, function (err, data) {
            if (err) {
                res.json({ message: 'an error occured: ERROR fetching user data - try again soon' }); // if error getting users info 
            } else if (data && data != false) { // if no error and there is data 
                if (username == data.username && password == encryptionModule.decryptData(data.password, encryptionKey)) { // checks that the info the user put in and the info on the server is the same
                    DataModule.getSSID(username, function (err, SessionIdentification) {
                        if (err) {
                            res.json({ message: 'an error occured: error setting up sessionID try logging in!' }); // send this 
                        }
                        const currentDate = new Date();
                        if (SessionIdentification && new Date(SessionIdentification.experationDate) > currentDate) {
                            var coopyCookie = cookieOptions;
                            coopyCookie.expires = new Date(SessionIdentification.experationDate);
                            res.cookie("sessionID", SessionIdentification.sessionID, coopyCookie);// set ssid cookie to ssid with cookieoptions being passed  
                            res.cookie("username", username, coopyCookie); // set username cookie to username with cookieoptions being passed. 
                            res.json({ URL: '/home' }); // tells client to go to QuizAcer.com/home
                            return;
                        }
                        const ssid = DataModule.generateSSID();
                        DataModule.newSSID(username, ssid, new Date(Date.now() + 604800000).toISOString(), function (err, success) { // set the new ssid in server
                            if (err) { // if error 
                                res.json({ message: 'an error occured: error creating sessionID try logging in!' }); // send this 
                            } else if (success) { // if success 
                                res.cookie("sessionID", ssid, cookieOptions);// set ssid cookie to ssid with cookieoptions being passed  
                                res.cookie("username", username, cookieOptions); // set username cookie to username with cookieoptions being passed. 
                                res.json({ URL: '/home' }); // tells client to go to QuizAcer.com/home
                            } else {
                                res.json({ message: 'an error occured: error creating sessionID try logging in!' }); // ERROR message 
                            }
                        });
                    }); // make a new ssid 
                } else {
                    if (data.username !== username) { // if the username doesn't == the username in the DB 
                        res.json({ message: 'an error occured: Incorrect username' }); // send the user that the wrong message was sent 
                    } else if (encryptionModule.decryptData(data.password, encryptionKey) != password) { // if password is wrong 
                        res.json({ message: 'an error occured: Incorrect password' });
                    } else { // unknown reason
                        res.json({ message: 'an error occured: Missing data when fetching' });
                    }
                }
            } else {
                res.json({ message: 'an error occured: user seems to not exsit!' }); // if the user doesn't exsit!1!?!!?
            }
        });
    } catch (err) {
        res.send(err);
    }
});

router.get('/[Ss]ettings', (req, res) => {
    try {
        if (!req.cookies || !req.cookies.sessionID || !req.cookies.username) {
            res.redirect("/login");
            return;
        }
        var sessionID = req.cookies.sessionID; // gets SSID
        var username = req.cookies.username; // gets username
        DataModule.getSSID(username, function (err, ssid) {
            if (err) {
                console.error(err); // log error
                res.redirect("/login"); // redirect to the login page
                return;
            }
            if (sessionID != ssid.sessionID) {
                res.cookie("sessionID", '', { expires: new Date(0) });
                res.redirect("/login");
                return;
            }
            res.sendFile(join(HTML, "Settings.html"));
        });
    } catch (err) {
        console.log(err);
        res.redirect("/login");
    }
});

router.get("/logout", (req, res) => {
    try {
        if (!req.cookies || !req.cookies.sessionID) {
            return;
        }
        res.cookie("sessionID", '', { expires: new Date(0) });
        res.cookie("username", '', { expires: new Date(0) });
        res.json({ t: true });
    } catch (err) {
        console.log(err);
    }
});

router.use('/[Ss]earch', express.static(path.join(HTML, 'Search.html')));

router.use('/flashcard', express.static(path.join(HTML, 'flashcardset.html')));

router.use('/[Cc]ard[Nn]ot[Ff]ound', express.static(path.join(HTML, 'CardNotFound.html'))); // sooo much more effiecent (Allows for cloudflare to cache it)

router.use('/navbar', express.static(path.join(HTML, 'NavBar.html'))); // sooo much more effiecent (Allows for cloudflare to cache it)

router.use('/[Ff]inal[Gg]rade[Cc]alc', express.static(path.join(HTML, 'GradeCalc.html'))); // sooo much more effiecent (Allows for cloudflare to cache it)

router.use("/[Mm]anifest.json", express.static(path.join(base, "Manifest.json")));

router.use("/SiteMap", express.static(path.join(HTML, "SiteMap.html")));

router.use("/SiteMapXML", express.static(path.join(base, "sitemap.xml")));

router.use("/[Tt]erms|/[Cc]onditions|/terms&conditions", express.static(path.join(HTML, "Terms&Conditions.html")));



module.exports = router; // VERY IMPORANT THIS EXPORTS THE ROUTER IN ANY ROUTER FILES YOU NEED TO DO THIS OR ELSE IT WON'T WORK!!!!