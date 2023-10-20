const { Console } = require('console');
const path = require('path'); // uses path blah blah 
const dbPath = path.join(__dirname, '..', '..', 'Data', 'UsersDB.db'); // gets the path to the db 
const sessionIDs = path.join(__dirname, '..', '..', 'Data', 'sessionID.db'); // gets the path to the db 
const flashCards = path.join(__dirname, '..', '..', 'Data', 'flashCards.db'); // gets the path to the db 
const FlashID2User = path.join(__dirname, '..', '..', 'Data', 'FlashIDtoUser.db'); // gets the path to the db 
const FlashCardsToID = path.join(__dirname, '..', '..', 'Data', 'FlashCardsToID.db');

const sqlite3 = require('sqlite3').verbose(); // uses the sqlite js thing allows for interaction with the db 

function dbsInit() { // initalizes the db 
  const db = new sqlite3.Database(dbPath); // User data DB
  const db1 = new sqlite3.Database(sessionIDs); // session ID DB
  const db2 = new sqlite3.Database(flashCards); // FlashCard DB
  const db3 = new sqlite3.Database(FlashID2User);
  const db4 = new sqlite3.Database(FlashCardsToID);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT,
      email TEXT,
      nameLastChanged TEXT
    )
  `); // creats a new DB if it doesn't exsit/ 
  db1.run(`
    CREATE TABLE IF NOT EXISTS sessionID ( 
        username TEXT PRIMARY KEY, 
        sessionID TEXT,
        experationDate TEXT)
    `);// creats a new DB if it doesn't exsit/ 
  db2.run(`
    CREATE TABLE IF NOT EXISTS flashcards (
        username TEXT PRIMARY KEY,
        FlashCards TEXT,
        IDtoname TEXT
      )
    `) // cards will be a very long json string that we will compress // creats a new DB if it doesn't exsit/ 
  db3.run(`
    CREATE TABLE IF NOT EXISTS cardIDtouser (
      cardID TEXT PRIMARY KEY,
      username TEXT
    )
    `)
  db4.run(`
    CREATE TABLE IF NOT EXISTS cardNameToID (
      cardID TEXT PRIMARY KEY,
      cardName TEXT,
      cardDescription TEXT
    )
    `)
  db.close(); // ALWAYS CLOSE OR ELSE IT USES MEMORY 
  db1.close();// ALWAYS CLOSE OR ELSE IT USES MEMORY 
  db2.close();// ALWAYS CLOSE OR ELSE IT USES MEMORY 
  db3.close(); // ALWAYS CLOSE OR ELSE IT USES MEMORY 
}

function clearCards(){

}

function getUserCard(cardID, username, callback) { // add thing
  try {
    getFlashCards(username, function (err, cards, ID2name) {
      if (err) {
        callback(err, false);
      } else {
        if (cards) {
          var cards = JSON.parse(cards);
          for (var i = 0; i < cards.length; i++) {
            if (cards[i].ID === cardID) {
              callback(null, cards[i]);
            }
          }
        } else {
          callback(err, false);
        }
      }
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function inputuserIDtocard(cardID, username, callback) {
  try {
    const db = new sqlite3.Database(FlashID2User); // FlashCard DB
    db.run(`   
  INSERT OR REPLACE INTO cardIDtouser (cardID, username)
  VALUES (?, ?)
`, [cardID, username], function (err) { // this just runs inserting or replacing the data in session id it will replace the current ssid if the user has had one before or it will just add a new user with a new ssid
      if (err) { // if error 
        db.close(); // ALWAYS CLOSE DB 
        callback(err, false); // sends back that data to the function this is sending the error and that it didn't succed. 
      }
      db.close(); // closes the db 
      callback(null, true); // returns null for error as there weren't any and true saying that it worked!
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function userfromCardID(cardID, callback) {
  try {
    const db = new sqlite3.Database(FlashID2User); // FlashCard DB
    db.get(`
    SELECT * FROM cardIDtouser WHERE cardID = ?
    `, [cardID], (err, row) => {
      if (err) {
        callback(err, false);
      } else {
        if (row) {
          callback(null, row.username);
        } else {
          callback(null, false);
        }
      }
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function generateNumID() {
  const keysize = 64;
  var nums = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  var key = "";

  for (var i = 0; i < keysize; i++) {
    var randomIndex = Math.floor(Math.random() * nums.length);
    key = key + nums[randomIndex];
  }

  return key;
}

function isUsersCard(user, querty, callback) {
  try {
    getFlashCards(user, function (err, cards, ID2name) {
      if (err) {
        callback(err, false);
      } else {
        if (ID2name) {
          ID2name = JSON.parse(ID2name);
          for (var i = 0; i < ID2name.length; i++) {
            const obj = ID2name[i];
            const key = Object.keys(obj)[0];
            if (key === querty) {
              callback(err, true);
              return;
            }
          }
          callback(err, false);
        } else {
          callback(null, false);
        }
      }
    });
  } catch (err) {
    callback(err, false);
  }
}

function addNameFromID(id, name, Description,callback){
  var db = new sqlite3.Database(FlashCardsToID);
  db.run('INSERT INTO cardNameToID (cardID, cardName, cardDescription) VALUES (?, ?, ?)', [id, name, Description], function(err) {
    if (err) {
      callback(err);
    }

    db.close((err) => {
      if (err) {
        callback(err);
      } else {
        callback(false);
      }
    });
  });
}


/**
 * 
 * @param {String} id the new name
 * @param {String} name 
 * @param {String} Description The discription!
 * @param {*} callback 
 */
function editNameFromID(id, name, Description, callback){
  var db = new sqlite3.Database(FlashCardsToID);
  db.run(
    'UPDATE cardNameToID SET cardName = ?, description = ? WHERE cardID = ?',
    [name, Description, id],
    function(err) {
      if (err) {
        callback(err);
      }
      db.close((err) => {
        if (err) {
          callback(err);
        } 
        callback(null);
      });
    }
  );
}

function addNewCard(user, card, callback) {
  try {
    if (card.ID) {
      if (card.ID.length > 64 || card.ID.length < 63) {
        callback(true, null, null, "That is an invalid ID");
        return;
      }
    } 
    const db = new sqlite3.Database(flashCards); // working 
    getFlashCards(user, function (err, cards, ID2name) {
      if (err) {
        callback(err, false);
      } else {
        if (cards) {
          var exsits = false;
          cards = JSON.parse(cards);
          ID2name = JSON.parse(ID2name);
          if (card.ID) {
            for (var i = 0; i < cards.length; i++) {
              if (cards[i] && cards[i].ID && cards[i].ID == card.ID) {
                if(card.Name !== cards[i].Name){
                  editNameFromID(card.ID, card.Name, card.Description, function(){
                    if(err){
                      console.log(err);
                    }
                  });
                }
                cards[i] = card;
                exsits = true;
                break;
              }
            }
          }
          var ID;
          if (!exsits) {
            if (!card.ID) {
              ID = generateNumID();
              card.ID = ID;
              addNameFromID(ID, card.Name, card.Description, function(err){
                if(err){
                  console.log(err);
                }
              });
              inputuserIDtocard(ID, user, function (err, success) {
                if (err) {
                  console.log(err);
                }
              })
            }

            ID2name.push({ [ID]: card.Name });
            cards.push(card);
          } 
          const query = `INSERT OR REPLACE INTO flashcards (username, FlashCards, IDtoname) VALUES (?, ?, ?)`;
          const values = [user, JSON.stringify(cards), JSON.stringify(ID2name)];
          db.run(query, values, function (err) {
            if (err) {
              callback(err, false);
            } else {
              if (ID) {
                callback(err, true, ID);
              } else {
                callback(err, true);
              }
            }
          });
        } else {
          callback(null, false);
        }
      }
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function getFlashCards(user, callback) {
  try {
    const db = new sqlite3.Database(flashCards); // FlashCard DB
    db.get(`
  SELECT * FROM flashcards WHERE username = ?
  `, [user], (err, row) => {
      if (err) {
        callback(err, false);
      } else {
        if (row) {
          callback(null, row.FlashCards, row.IDtoname);
        } else {
          callback(null, false);
        }
      }
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function generateSSID() { // generates an ssid 
  const keysize = 32;  // ssid are 32 characters long this is to insure there is like a 1 in 100 bizlion chance of it being the same 
  const alphanumericChars = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z'
  ]; // list of all chars uses in it 

  var key = ""; // the ssid 

  for (var i = 0; i < keysize; i++) {
    key = key + alphanumericChars[getRandomNumber(0, alphanumericChars.length)]; // ur not retarded i hope
  }
  return key;
}

function getRandomNumber(min, max) { // /srs
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newSSID(username, sessionID, experationDate, callback) { // this sets a new ssid in the db it has 3 params the username sessionID and callback this callback is the function that runs when it returns
  try {
    const db = new sqlite3.Database(sessionIDs); // gets the db that it is interacting with 
    db.run(`   
  INSERT OR REPLACE INTO sessionID (username, sessionID, experationDate)
  VALUES (?, ?, ?)
`, [username, sessionID, experationDate], function (err) { // this just runs inserting or replacing the data in session id it will replace the current ssid if the user has had one before or it will just add a new user with a new ssid
      if (err) { // if error 
        db.close(); // ALWAYS CLOSE DB 
        callback(err, false); // sends back that data to the function this is sending the error and that it didn't succed. 
        return;
      }
      db.close(); // closes the db 
      callback(null, true); // returns null for error as there weren't any and true saying that it worked!
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function getSSID(username, callback) { // gets the ssid from the user 
  try {
    const db = new sqlite3.Database(sessionIDs); // db 

    db.get(
      'SELECT * FROM sessionID WHERE username = ?',
      [username],
      function (err, row) { // Select means get and its just getting the data in sessionID searching with username
        if (err) { // if error 
          console.error(err); // log 
          db.close(); // close
          callback(err, null); // return err and no data 
        } else { // not error 
          db.close(); // close 
          if (row) { // if there is data there (if the user doesn't exsit an error doesn't happen but there wont be any data 
            callback(null, row); // this sends all the data in the sessionID aka sessionID and usernmame
          } else { // if data !exsit 
            callback(null, false);  // return no error but no data!
          }
        }
      }
    );
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function newUser(username, password, email, callback) { // creates a new user 
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const db = new sqlite3.Database(dbPath); // gets the DB 
    const db1 = new sqlite3.Database(flashCards);

    const flashCardsArray = [];
    const nameToIDArray = [];
    const flashCardsStr = JSON.stringify(flashCardsArray);
    const nameToIDStr = JSON.stringify(nameToIDArray);
    const query = `INSERT INTO flashcards (username, FlashCards, IDtoname) VALUES (?, ?, ?)`;
    const values = [username, flashCardsStr, nameToIDStr];

    db1.run(query, values, function (err) {
      db.run(`
    INSERT INTO users (username, password, email, nameLastChanged)
    VALUES (?, ?, ?, ?)
  `, [username, password, email, oneWeekAgo.toISOString()], function (err) { // insert into the users thing with all the needed data (we don't need to check if it already exsits as we already do that!)
        if (err) {
          db.close();
          callback(err, false); // Call the callback with false to indicate an error
        } else {
          db.close();
          callback(null, true); // Call the callback with true to indicate success
        }
      });
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function changeEmail(username, email, callback) {
  const db = new sqlite3.Database(dbPath);
}

function changeusername(oldusername, newusername, callback) {
  try {
    getFlashCards(oldusername, function (err, flashcards, ids) {
      if (err) {
        callback(err, false);
      }
      if (!ids) {
        callback(null, false);
      }
      ids = JSON.parse(ids);
      var IDLIST = [];
      for (let i = 0; i < ids.length; i++) {
        const item = ids[i];
        const id = Object.keys(item)[0];
        IDLIST.push(id);
      }
      var db = new sqlite3.Database(dbPath);
      var query = `
      UPDATE users
      SET username = ?,
      nameLastChanged = ?
      WHERE username = ?;
      `;
      const date = new Date().toISOString();
      db.run(query, [newusername, date, oldusername], function (err) {
        if (err) {
          callback(err, false);
          console.log("fsd");
          return;
        }
        db.close();
        query = `
          UPDATE flashcards
          SET username = ?
          WHERE username = ?
        `;
        var db3 = new sqlite3.Database(flashCards);
        db3.run(query, [newusername, oldusername], function (err) {
          if (err) {
            callback(err, false);
          }
          db3.close();
          query = `
            UPDATE sessionID
            SET username = ?
            WHERE username = ?
          `;
          var db2 = new sqlite3.Database(sessionIDs);
          db2.run(query, [newusername, oldusername], function (err) {
            if (err) {
              callback(err, false);
            }
            db2.close();
            const query = `
            UPDATE cardIDtouser
            SET username = ?
            WHERE cardID = ?
          `;
            var db1 = new sqlite3.Database(FlashID2User);

            if (IDLIST.length == 0) {
              callback(null, true);
              return;
            }
            for (var i = 0; i < IDLIST.length; i++) {
              db1.run(query, [newusername, IDLIST[i]], function (err) {
                if (err) {
                  callback(err, false);
                }
                if (i == IDLIST.length - 1) {
                  callback(null, true);
                }
              });
            }
          });
        });
      });
    });
  } catch (err) {
    console.error(err);
    callback(err, false);
    return;
  }
}

function deleteUser(username, callback) { // deletes a user
  try {
    const db = new sqlite3.Database(dbPath); // gets DB 
    const db1 = new sqlite3.Database(flashCards);
    const db2 = new sqlite3.Database(sessionIDs);
    const db3 = new sqlite3.Database(FlashID2User);
    getFlashCards(username, function (err, flashcards, ids) {
      var IDLIST = [];
      if(ids != null){
        ids = JSON.parse(ids);
        for (let i = 0; i < ids.length; i++) {
          const item = ids[i];
          const id = Object.keys(item)[0];
          IDLIST.push(id);
        }
      }
      db1.run(`
      DELETE FROM flashcards WHERE username = ?
    `, [username], function (err) {
        if (err) {
          callback(err);
        }
        db2.run(`
      DELETE FROM sessionID WHERE username = ?
    `, [username], function (err) {
          if (err) {
            callback(err);
          }
          if (0 == IDLIST.length) {
            db.run(`DELETE FROM users WHERE username = ?
            `, [username], function (err) { // just deletes the data 
                if (err) {
                  callback(err); // sends back error 
                } else {
                  callback(null, "deleted"); // sends that it was deleted 
                }
              }
            );
          } else {
            for (var i = 0; i < IDLIST.length; i++) {
              db3.run(`
            DELETE FROM cardIDtouser WHERE cardID = ?
          `, [IDLIST[i]], function (err) {
              });
              if(IDLIST.length -1 == i){
                db.run(
                  'DELETE FROM users WHERE username = ?',
                  [username],
                  function (err) { // just deletes the data 
                    if (err) {
                      callback(err); // sends back error 
                    } else {
                      callback(null, "deleted"); // sends that it was deleted 
                    }
                  }
                );
              }
            }
          }
        });
      });

    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

function getLoginInfo(username, callback) { // gets the users login info 
  try {
    const db = new sqlite3.Database(dbPath); // db

    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      function (err, row) { // gets user data from users using username
        if (err) { // if error 
          console.error(err); // log
          db.close(); // close
          callback(err, null); // Call the callback with error
        } else {
          db.close(); // close
          if (row) { // if the user exsits and data exsits 
            callback(null, row); // Call the callback with the user object
          } else {
            callback(null, false); // Call the callback with false if user doesn't exist
          }
        }
      }
    );
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}


function checkIfUserExists(username, callback) { // check if the user exsits 
  try {
    const db = new sqlite3.Database(dbPath); // db 
    db.get(
      'SELECT EXISTS(SELECT 1 FROM users WHERE username = ?) AS userExists',
      [username],
      function (err, row) { // check if exsits from user using username 
        if (err) { // if error 
          console.error(err); // log
          callback(err, null); // send back 
        } else { // not err 
          const userExists = row.userExists >= 1; // if the user exsits meaning there is one or more occurances of the user 
          callback(null, userExists); // send no error and if the user exsits!
        }
        db.close(); // close 
      }
    );
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}

/**
 * 
 * @param {string} email the users email 
 * @returns {boolean} returns if it is a valid email
 */
function isValidEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

const badWords = require('./BadWords.js');

var Filter = require('bad-words'),
    filter = new Filter();
for(var i = 0; i < badWords.length; i++){
  filter.addWords(badWords[i]);
}


/**
 * 
 * @param {string} phrase 
 * @returns {boolean} returns if it contains a bad word!
 */
function badPhrase(phrase){
  phrase = phrase.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g, '');
  return filter.isProfane(phrase);
} 

/**
 * This preforms the search function!
 * 
 * @param {String} searchTerm The term the user is searching 
 * @returns {Error,Array} Error either null or the error string and array of the cards that match the search term 
 */
function search(searchTerm, callback){
  const db = new sqlite3.Database(FlashCardsToID);
  db.all(
    `
    SELECT *
    FROM cardNameToID
    WHERE cardName LIKE ? COLLATE NOCASE;
    `,
    [`%${searchTerm}%`],
    (err, rows) => {
      if (err) {
        callback(err, null);
      }
      
      if(!rows){
        callback(true, null);
      }

      const resultsArray = [];
  
      rows.forEach(row => {
        const similarity = calculateJaccardSimilarity(row.cardName, searchTerm);
        resultsArray.push({ id: row.cardID, name: row.cardName, description: row.cardDescription, similarity });
      });

      resultsArray.sort((a, b) => b.similarity - a.similarity);
  
      const top100Results = resultsArray.slice(0, Math.min(100, resultsArray.length));
  
      const finalResults = top100Results.length > 0 ? top100Results : null;
  
      db.close((err) => {
        if (err) {
          callback(err, finalResults);
        } else {
          callback(null, finalResults);
        }
      });
    }
  );
}

/**
 * 
 * @param {String} set1 
 * @param {String} set2 
 * @returns 
 */
function calculateJaccardSimilarity(str1, str2) {
  const string1 = str1.toString();
  const string2 = str2.toString();

  const tokens1 = Array.from(new Set(string1.split('')));
  const tokens2 = Array.from(new Set(string2.split('')));

  const intersection = tokens1.filter(element => tokens2.includes(element));
  const union = [...new Set([...tokens1, ...tokens2])];

  return intersection.length / union.length;
}

module.exports = { // THIS EXPORTS THE FUNCTIONS YOU HAVE TO HAVE ALL OF THIS 
  dbsInit,
  checkIfUserExists,
  getLoginInfo,
  newUser,
  newSSID,
  getSSID,
  generateSSID,
  deleteUser,
  addNewCard,
  getFlashCards,
  isUsersCard,
  inputuserIDtocard,
  userfromCardID,
  getUserCard,
  changeusername,
  isValidEmail,
  badPhrase,
  search
};