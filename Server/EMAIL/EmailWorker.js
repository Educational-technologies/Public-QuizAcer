const nodemailer = require('nodemailer');
const config = require("./config.json");
const DataModule = require("../API/FetchData.js");

const maxTries = 5;

const noReply = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config["no-reply"].Email,
        pass: config["no-reply"].AppPassword
    }
});

var Data = {};

/**
 * Add one to the number of tries
 * 
 * @param {string} username The users username
 */
function addTries(username){
    if(username && Data && Data[username]){
        Data[username].tries++;
    }
}
/**
 * Checks if the user is in the cache 
 *
 * @param {string} username - The username of the user
 * @returns {boolean} true or false depending if the username is in the cache 
 */
function checkIfUserExists(username){
    return Data ? Data[username] ? true : false : false;
}
/**
 * Checks if the verification code works 
 *
 * @param {string} username - The username of the user
 * @param {string} code - The 8-digit verification code.
* @returns {Array} An array containing two boolean values: the first for existence (true) and the second for correctness (false).
 */
function verifyCode(username, code){
    if(!username || !Data[username]){
        return [false, false];
    }
    if(code && Data[username].code === code){
        clearCode(username);
        return [true, true];
    }
    addTries(username);
    if(Data[username].tries >= 5){
        clearCode(username);
        return[true, false, "Deleted"];
    }
    return [true, false];
}

/**
 * Sends a verification code email to a user.
 *
 * @param {string} username - The username of the new user.
 * @param {string} email - The user's email address.
 * @param {string} code - The 8-digit verification code.
 * @returns {void}
 */
function sendCode(username, email, code){
    Data[username] = {
        email: email,
        code: code,
        tries: 0
    }

    sendMail("no-reply", email, "Your verification code", "You verification code is: " + code);

    clearCode(username);
}

async function clearCode(username){
    await new Promise(resolve => setTimeout(resolve, 300000 /*5mins*/));
    clear();
}

function clear(username){
    try{
        if(!Data[username]){
            return;
        }
        Data[username] = null;
    } catch(err){
        console.log(err);
    }
}

function generate8DigitCode(){
    const charset = '0123456789';
    let randomString = '';
  
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomString += charset[randomIndex];
    }
  
    return randomString;
}

/**
 * Send an email.
 *
 * @param {string} type - The email type (options: 'no-reply' or 'support').
 * @param {string} recipient - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} content - The content of the email.
 */
function sendMail(type, email, subject, content) {
    try {
        const mailOptions = {
            from: config[type].email,
            to: email,
            subject: subject,
            text: content
        }

        if (type == "no-reply") {
            noReply.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email: ' + error);
                }
            });
        }
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    sendMail,
    generate8DigitCode,
    sendCode,
    verifyCode,
    checkIfUserExists
};