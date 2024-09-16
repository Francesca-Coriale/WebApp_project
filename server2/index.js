'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const cors = require('cors');

const { body, validationResult } = require("express-validator");

const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = 'qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8';

// THIS IS FOR DEBUGGING ONLY: when you start the server, generate a valid token to do tests, and print it to the console
const jsonwebtoken = require('jsonwebtoken');
const expireTime = 60; //seconds (1min)
const token = jsonwebtoken.sign( { access: 'true', authId: 1234 }, jwtSecret, {expiresIn: expireTime});
console.log('token: ', token);

// init express
const app = express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json()); // To automatically decode incoming json

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  // token from HTTP Authorization: header
})
);

// To return a better object in case of errors
app.use( function (err, req, res, next) {
  console.log(err);
  if (err.name === 'UnauthorizedError') {
    // Example of err content:  {"code":"invalid_token","status":401,"name":"UnauthorizedError","inner":{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2024-05-23T19:23:58.000Z"}}
    res.status(401).json({ errors: [{  'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
  } else {
    next();
  }
} );


/*** APIs ***/
// POST /api/discount
app.post('/api/discount',
  body('rows', 'Invalid array of rows').isArray({min: 1}),
  (req, res) => {
    const err = validationResult(req); // Check if validation is ok
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(422).json({errors: errList});
    }

    const loyalty = req.auth.access;
    const rows = req.body.rows;
    const rand = Math.random() * (20 - 5) + 5;
    const sumArray = (arr) => {
      return arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    };

    const sum = sumArray(rows);
    let d = 0;
    if (loyalty == false) {
      d = Math.round( (sum/3) + rand );
    } else {
      d = Math.round( sum + rand );
    }

    if (d < 5 ){
      res.status(200).json( 5 );
    } else if ( d > 50 ){
      res.status(200).json( 50 );
    } else {
      res.status(200).json( d );
    }
  }
);


// Activate the server
app.listen(port, () => {
  console.log(`discount-server listening at http://localhost:${port}`);
});