const express = require('express'); // express this the api 
const router = express.Router(); // ok this is like an app but it basicly doesn't run its own thing it joins onto a server 
const rateLimit = require('express-rate-limit'); // allows for apis to be rate limiting making it so ppl can spam them and take advantage of the systems. 
const cookieParser = require('cookie-parser'); // for cookies allows for simplier interactions 
const bodyParser = require('body-parser'); // for getting data from post functions; simplier interactions 
const cookieEncrypter = require('cookie-encrypter'); // this makes it so the cookie data gets encrypted automaticly and we don't have to deal with it. 
const maxCharacters = 60000; // Max number of characters a set can be (here so abuse doesn't take place!)

const encrypt = require("./ServerSide/EncryptionKey"); // this enables encryption server side
const Data = require('./FetchData'); // enables the ability to get data from the db. 

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

router.post('/save', limiter, (req, res) => { // this routes to /api/flashcards/save
    try {
        if (req.cookies && req.cookies.sessionID && req.cookies.username && req.body && req.body.FlashCard && req.body.FlashCard.Num && req.body.FlashCard.Name && req.body.FlashCard.Description) { // checks if the user has a valid cookie & valid data being sent. 
            var name = req.body.name; // get the name of the flash card
            var username = req.cookies.username; // get the username of the user
            var SSID = req.cookies.sessionID; // get the current sessionID
            if ((req.body).length > maxCharacters) {
                res.json({ alert: `The maxium number of characters of ${maxCharacters} has been reached please remove ${(req.body).length - maxCharacters}chars `, err: true });
                return;
            }

            if(name.length >= 51){
                res.json({alert: `The maxium size for a name is 50 characters!`, err: true});
                return; 
            }

            if (/[^a-zA-Z0-9\s]/.test(name)) {
                res.json({ alert: `Only use 0-9, A-Z and spaces in the name`, err: true });
                return;
            }

            if(Data.badPhrase(name)){
                res.json({ message: 'No profanity is allowed!', err: true });
                return; 
            }

            numCards = req.body.FlashCard.Num;

            for (let cardNumber = 1; cardNumber <= numCards; cardNumber++) {
                const card = req.body.FlashCard[name][cardNumber];
                if (card) {
                    const front = card.front;
                    const back = card.back;
                    if(Data.badPhrase(front) || Data.badPhrase(front)){
                        res.json({ message: 'No profanity is allowed!', err: true });
                        return; 
                    }
                }
            }

            Data.getSSID(username, function (err, ssid) { // checks if the ssid is correct.
                if (err) { // if there is an error 
                    console.log(err); // log the error
                    res.json({ message: 'An error occured try again later!', err: true }); // send data back to client saying there was an error
                } else { // if no error 
                    if (ssid.sessionID == SSID) { // checks if the ssid is correct 
                        req.body.FlashCard.author = username; // sets it so there is an author 
                        Data.addNewCard(username, req.body.FlashCard, function (err, worked, ID, msg) { // adds a new card
                            if (err) { // if there is an error 
                                if (msg) {
                                    res.json({ message: 'An error occured saving try again', err: true });
                                    return;
                                }
                                console.log(err); // log error 
                                res.json({ message: 'An error occured saving try again', err: true }); // Send client error
                            } else {
                                if (ID) { // if a new ID is generated
                                    res.json({ message: 'Saved', ID: ID }); // send this 
                                } else {
                                    res.json({ message: 'Saved' }); // if its a save not a redo the send this 
                                }
                            }
                        })
                    } else {
                        res.json({ message: 'Invalid session ID please log out and log back in', err: true }); // send this if they don't have a valid ssid. 
                    }
                }
            });
        } else {
            res.json({ message: 'Data missing!', err: true }); // data is missing. 
        }
    } catch (err) {
        res.json({ message: 'An uncatched error occured!', err: true });
    }
});

router.post('/loadCards', (req, res) => {
    try {
        if (req.cookies && req.cookies.sessionID && req.cookies.username) {
            var username = req.cookies.username;
            var SSID = req.cookies.sessionID;
            Data.getSSID(username, function (err, ssid) {
                if (err) { // if there is an error 
                    console.log(err); // log the error
                    res.json({ message: 'An error occured try again later!', err: true });
                } else {
                    if (ssid.sessionID == SSID) {
                        Data.getFlashCards(username, function (err, flashcards, ids) {
                            if (err) {
                                console.log(err); // log the error
                                res.json({ message: 'An error occured whilist loading your flash cards', err: true });
                            } else {
                                if (flashcards) {
                                    try {
                                        var FlashCards = [];

                                        var cards = JSON.parse(flashcards);
                                        for (var i = 0; i < cards.length; i++) {
                                            FlashCards.push({
                                                Name: cards[i].Name,
                                                Description: cards[i].Description,
                                                ID: cards[i].ID
                                            });
                                        }

                                        res.json({ cards: JSON.stringify(FlashCards), err: false });
                                    } catch (err) {
                                        console.log(err);
                                        res.json({ message: 'Error parsing flash cards on the server', err: true });
                                    }
                                } else {
                                    res.send("No flashcards");
                                }
                            }
                        });
                    } else {
                        res.json({ message: 'Invalid session ID please log out and log back in', err: true }); // send this if they don't have a valid ssid. 
                    }
                }
            });
        } else {
            res.json({ message: 'Data missing!', err: true }); // data is missing. 
        }
    } catch (err) {
        res.json({ message: 'An uncatched error occured!', err: true });
    }
});

const limitForCard = rateLimit({ // sets up the ratelimiter 
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Maximum of 10 requests per minute
    handler: (req, res) => { // if the rate limit has been reached send this to the user
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.', message: 'Rate Limit exceded please don\'t spam' });
    },
});
router.get('/flashcard', limitForCard, (req, res) => {
    try {
        var id = req.query.id;
        if (id) {
            id = id.toString();
            Data.userfromCardID(id, function (err, username) {
                if (err) {
                    res.json({ err: "An error occured while trying to fetch the card please reload" });
                } else {
                    if (username) {
                        Data.getUserCard(id, username, function (err, thing) {
                            if (err) {
                                res.json({ err: "An error occured while trying to fetch the card please reload" });
                            } else {
                                if (thing) {
                                    res.json(JSON.stringify(thing));
                                } else {
                                    res.json({ red: "/cardnotfound" });
                                }
                            }
                        });
                    } else {
                        res.json({ red: "/cardnotfound" });
                    }
                }
            });
        } else {
            res.json({ red: "/cardnotfound" });
        }
    } catch (err) {
        res.json({ err: "An error occured while loading!" });
        console.error(err);
    }
});

router.get('/editcard', limitForCard, (req, res) => {
    try {
        if (!req.cookies || !req.cookies.username || !req.cookies.sessionID) {
            res.json({ err: "You must be logged in to edit a flash card!", red: "/cardnotfound"});
            return;
        }
        var id = req.query.id;
        if (!id) {
            res.json({ red: "/cardnotfound" });
            return;
        }
        id = id.toString();
        const sessionID = req.cookies.sessionID;
        const username = req.cookies.username;

        Data.getSSID(username, function (err, ssid) {
            if (err) {
                console.error(err); // log error
                res.json({ red: "/login"});
                return;
            }
            if (sessionID != ssid.sessionID) {
                res.cookie("sessionID", '', { expires: new Date(0) });
                res.json({ red: "/login"});
                return;
            }

            Data.isUsersCard(username, id, function (err, card) {
                if (err) {
                    res.json({ err: "An error occured while trying to fetch the card please reload" });
                    return;
                }
                if (!card) {
                    res.json({ red: "/cardnotfound" });
                    return;
                }
                Data.getUserCard(id, username, function (err, thing) {
                    if (err) {
                        res.json({ err: "An error occured while trying to fetch the card please reload" });
                        return;
                    }
                    if (thing) {
                        res.json(JSON.stringify(thing));
                        return;
                    }
                    res.json({ red: "/cardnotfound" });
                });
            });
        });
    } catch (err) {
        res.json({ err: "An error occured while loading!" });
        console.error(err);
    }
});

const limitForClearing = rateLimit({ // sets up the ratelimiter 
    windowMs: 30 * 60 * 1000, // 1 minute
    max: 2, // Maximum of 10 requests per minute
    handler: (req, res) => { // if the rate limit has been reached send this to the user
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.', message: 'Rate Limit exceded please don\'t spam' });
    },
});

router.post("/[Cc]lear[Ff]lash[Cc]ards", limitForClearing, (res, req) => {
    try {
        if (!req.cookies || !req.cookies.sessionID || !req.cookies.username) {
            res
        }
        var username = req.cookies.username;
        var SSID = req.cookies.sessionID;
        Data.getSSID(username, function (err, ssid) {
            if (err) { // if there is an error 
                console.log(err); // log the error
                res.json({ message: 'An error occured try again later!', err: true });
                return;
            }
            if (ssid.sessionID !== SSID) {
                res.cookie("sessionID", '', { expires: new Date(0) });
                res.json({ rid: "/login" });
                return;
            }
            // preform func for clearing card
        });
    } catch (err) {
        console.log(err);
        res.json({ err: "An error occured while loading!" });
    }
});

const limitForSearch = rateLimit({ // sets up the ratelimiter 
    windowMs: 30 * 60 * 1000, // 1 minute
    max: 12, // Maximum of 10 requests per minute
    handler: (req, res) => { // if the rate limit has been reached send this to the user
        res.status(429).json({ error: 'Rate limit exceeded. Please try again later.', message: 'Rate Limit exceded please don\'t spam', err: true });
    },
});

router.get("/search", limitForSearch, (req,res) =>{
    try{
        const search = req.query.search || req.query.s;

        if(!search){
            res.json({ message: "Please provide a search querty!", err: true })
            return; 
        }

        if(search.length < 2){
            res.json({ message: "Querty must be longer then 2 characters", err: true })
            return; 
        }

        Data.search(search.toString(), function(err, data){
            if(err){
                console.log(err);
                res.json({message: "There was an error while fetching your search!", err: true});
                return; 
            }

            if(data){
                res.json({cards: data, err: false});
                return; 
            } 
            res.json({nocards: true, err: false});
        });
    } catch(err){
        console.log(err);
        res.json({ message: "An error occured try again later!", err: true });
    }
});

module.exports = router;
