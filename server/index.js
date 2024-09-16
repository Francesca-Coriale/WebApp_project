/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                       // logging middleware
const { check, validationResult, body } = require('express-validator'); // validation middleware
const cors = require('cors');

const jsonwebtoken = require('jsonwebtoken');

const jwtSecret = 'qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8';
const expireTime = 60; //seconds (1min)

const concertsDao = require('./dao-concerts');          // module for accessing the films table in the DB
const userDao = require('./dao-users');                 // module for accessing the user table in the DB
const reservationsDao = require('./dao-reservations');  // module for accessing the reservations table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());


/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/
/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username and/or password');  
    
  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { 
  // this user is id + username + name 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { 
  // this user is id + email + name
  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "this is my super duper secret, no one can get it!!",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: app.get('env') === 'production' ? true : false },
}));

app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ "error": "Not authorized" });
}

/**
 * Utility Functions
 */
const maxNameLength = 50;
const maxSizeLength = 10;

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** Concerts APIs ***/
//Retrieve list of all concerts
app.get('/api/concerts',
  (req, res) => {
    concertsDao.listConcertsTheaters()
      .then(concerts => {
        res.status(200).json(concerts);})
      .catch((err) => res.status(503).json(err));
  }
);


//Retrieve a theater specifications 
app.get('/api/theaters/:theaterId',
  [ check('theaterId').isInt({min: 1}).withMessage('theaterId must be a positive integer') ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }
    try {
      const result = await concertsDao.getTheaterRow(req.params.theaterId);
      if (result.error)   // If not found, the function returns a resolved promise with an object where the "error" field is set
        res.status(404).json(result);
      else 
        res.status(200).json(result);
    } catch (err) {
      res.status(503).end();
    }
  }
);


//Retrieve list all reservation for a concert (occupied seats)
app.get('/api/reservations/:concertId',
  [ check('concertId').isInt({min: 1}).withMessage('concertId must be a positive integer') ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }
    try {
      const result = await reservationsDao.retrieveReservations(req.params.concertId);
      if (result.error)   // If not found, the function returns a resolved promise with an object where the "error" field is set
        res.status(404).json(result);
      else
        res.status(200).json(result);
    } catch (err) {
      console.error('Error in /api/reservations/:concertId:', err);
      res.status(503).end();
    }
  }
);


//Retrieve reservation (all seats) of a user for a concert
app.get('/api/reservations/concert/:userId', isLoggedIn,
  [ check('userId').isInt({min: 1}).withMessage('userId must be a positive integer') ],
  async (req, res) => {
    if (req.params.userId != req.user.id) { // Is the req.user.id the same as the userId passed?
      return res.status(404).json("req.user.id is not the same as the userId passed from client");
    }
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }
    try {
      const result = await reservationsDao.findReservation(req.user.id);
      if (result.error)   // If not found, the function returns a resolved promise with an object where the "error" field is set
        res.status(404).json(result);
      else 
        res.status(200).json(result); 
    } catch (err) {
      console.error('Error in /api/reservations/:userId :', err);
      res.status(503).end();
    }
  }
);


//Check if selected seats are still available
app.get('/api/reservations/check-availability/:concertId/:row/:place', isLoggedIn, 
  [ check('concertId').isInt({min: 1}).withMessage('concertId must be a positive integer'),
    check('row').isInt({min: 1, max: 20}).withMessage('row must be a positive integer smaller than 20'),
    check('place').isLength({min: 1, max: 1}).isAlpha().withMessage('place must be a letter of the alphabet')
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }
    try {
      const selectedSeat = {
        concert_id: parseInt(req.params.concertId),
        row: parseInt(req.params.row),
        place: req.params.place
      };

      const isOccupied = await reservationsDao.checkAvailability(selectedSeat);
      res.status(200).json({ 
        "row": selectedSeat.row,
        "place": selectedSeat.place,
        "isOccupied": isOccupied }); //return true or false

    } catch (err) {
      console.error('Error checking availability:', err);
      res.status(503).json({ "error": "An error occurred while checking seat availability." });
    }
});


// Add multiple reservations by providing an array of reservation objects.
app.post('/api/reservations', isLoggedIn,
  [
    body('reservation').isArray(),
    body('reservation.*.concert_id').isInt({min: 1}).withMessage('Invalid concert_id, it must be a positive integer'),
    body('reservation.*.concert_name').isLength({min: 1, max: maxNameLength}).withMessage(`Invalid concert_name, it must be a string shorter than ${maxNameLength}`),
    body('reservation.*.row').isInt({min: 0, max: 20}).withMessage('Invalid row, it must be a positive integer smaller than 20'),
    body('reservation.*.place').isLength({min: 1, max: 1}).isAlpha().withMessage('Invalid place, it must be a letter of the alphabet')
  ],
  async (req, res) => {
    if (req.body.userId != req.user.id) { // Is the req.user.id the same as the userId passed in the body?
      return res.status(401).json("req.user.id is not the same as the userId passed from client");
      }
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    const reservation = req.body.reservation; // An array of reservation objects

    const userId = req.user.id;
    const reservationWithUser = reservation.map(e => ({
      ...e,
      user: userId
    }));

    try {
      const result = await reservationsDao.addReservation(reservationWithUser); // Pass the array of reservations
      res.status(200).json(result);
    } catch (err) {
      res.status(503).json({ "error": `Database error during the creation of new reservations: ${err}` });
    }
  }
);

// Add a new reservation after choosing the available seats (automatic reservation)
app.post('/api/reservations/auto-reserve', isLoggedIn, 
  [
    body('selectedConcert.id').isInt({min: 1}).withMessage('Invalid concert_id, it must be a positive integer'),
    body('selectedConcert.name').isLength({min: 1, max: maxNameLength}).withMessage(`Invalid concert_name, it must be a string shorter than ${maxNameLength}`),
    body('seatCount').isInt({min: 1}).withMessage('Invalid seatCount, it must be a positive integer'),
    body('theaterData.id').isInt({min: 1}).withMessage('Invalid theater_id, it must be a positive integer'),
    body('theaterData.name').isLength({min: 1, max: maxNameLength}).withMessage(`Invalid concert_name, it must be a string shorter than ${maxNameLength}`),
    body('theaterData.size').isLength({min: 1, max: maxSizeLength}).withMessage(`size must be shorter than ${maxSizeLength}`),
    body('theaterData.rows').isInt({min: 1, max: 20}).withMessage('rows must me a positive integer smaller than 20'),
    body('theaterData.columns').isInt({min: 1, max: 26}).withMessage('columns must me a positive integer smaller than 26'),
    body('theaterData.seats').isInt({min: 1, max: 520}).withMessage('seats must me a positive integer smaller than 520')
  ],
  async (req, res) => {
    const { selectedConcert, seatCount, theaterData, userId } = req.body;

    if (userId != req.user.id) {
      return res.status(401).json("req.user.id is not the same as the userId passed from client");
    }

    if (!selectedConcert || !seatCount) {
      return res.status(422).json({ "error": "Missing concert or seatCount" });
    }

    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json( errors.errors ); // error message is sent back as a json with the error info
    }

    try {
      // Fetch available seats for the given concert
      const concertId = selectedConcert.id;
      const availableSeats = await reservationsDao.getAvailable(concertId, seatCount, theaterData);

      const reservationData = availableSeats.map(seat => ({
        concert_id: concertId,
        concert_name: selectedConcert.name, // You can get this from your data
        row: seat.row,
        place: seat.place,
        user: req.user.id
      }));
    await reservationsDao.addReservation(reservationData);

    res.status(200).json({ "reservedSeats": availableSeats });
  } catch (err) {
    console.error('Error during auto reservation:', err);
    console.log(err);
    if (err.error && err.availableSeats !== undefined) {
      return res.status(500).json({ 
        "error": err.error, 
        "availableSeats": err.availableSeats 
      });
    }
    return res.status(503).json({ "error": "Internal server error" });
  }
});


//Delete a reservation
app.delete('/api/reservations/:concertId', isLoggedIn, 
  [ check('concertId').isInt({min: 1}).withMessage('concertId must be a positive integer') ],
  async (req, res) => {
    // Is the req.user.id the same as the userId passed in the body?
    if (req.body.userId != req.user.id) {
      return res.status(401).json("req.user.id is not the same as the userId passed from client");
    }
      
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    const concertId = req.params.concertId;
    const userId = req.user.id;

    try {
      const deletion = await reservationsDao.deleteReservation(userId, concertId);
      res.status(200).json({ "message": deletion });
    } catch (err) {
      res.status(503).json({ "error": `Database error during the deletion of reservation ${concertId}: ${err}` });
    }
  }
);



/*** Users APIs ***/
// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', 
  body("username", "username is not a valid email").isEmail(),
  body("password", "password must be a non-empty string").isString().notEmpty(),
  (req, res, next) => {
    // Check if validation is ok
    const err = validationResult(req);
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(400).json({ "errors": errList });
    }
    // Perform the actual authentication
    passport.authenticate('local', (err, user, info) => { 
      if (err)
        res.status(err.status).json({ "errors": [err.msg] });
        if (!user) {
          return res.status(401).json({ "error": info });
        }
        // success, perform the login and extablish a login session
        req.login(user, (err) => {
          if (err)
            return next(err);
        
          // req.user contains the authenticated user, we send all the user info back
          // this is coming from userDao.getUser() in LocalStratecy Verify Fn
          return res.status(200).json(req.user);
        });
    })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({ "error": "Not authenticated" });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});


/*** Token ***/
// GET /api/auth-token
app.get('/api/auth-token', isLoggedIn, 
  (req, res) => {
    let loyalty = req.user.loyalty;
    let id = req.user.id;
    const payloadToSign = { access: loyalty, authId: id };
    const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, {expiresIn: expireTime});

    res.json( { "token": jwtToken, "loyalty": loyalty } );
});


// activate the server
const port = 3001;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
