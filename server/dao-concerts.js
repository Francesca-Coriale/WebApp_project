'use strict';

/* Data Access Object (DAO) module for accessing theaters and concerts data */
const db = require('./db');

const convertTheaterFromDbRecord = (dbRecord) => {
    const theater = {};
    theater.id = dbRecord.id;
    theater.name = dbRecord.name;
    theater.size = dbRecord.size;
    theater.rows = dbRecord.rows;
    theater.columns = dbRecord.columns;
    theater.seats = dbRecord.seats;
    return theater;
}

const convertConcertsTheatersFromDbRecord = (dbRecord) => {
    const concertTheater = {
    id: dbRecord.id,
    concert: dbRecord.concert,
    theater: dbRecord.theater
    };
    return concertTheater;
}


/** NOTE
 * return error messages as json object { error: <string> }
 */

// This function retrieves the list of all concerts in program in all theaters
exports.listConcertsTheaters = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM concerts';
        db.all(sql, (err, rows) => {
            if (err) { reject(err); }
        const concertsTheaters = rows.map( (e) => {
            const concertTheater = convertConcertsTheatersFromDbRecord(e);
            return concertTheater;
        });
        resolve(concertsTheaters);
        });
    });
}

// This function retrieves a specific theater row, given its Id
exports.getTheaterRow = (theaterId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM theaters WHERE id = ?';
        db.get(sql, [theaterId], (err, row) => {
            if (err) { reject(err); }
            if (row == undefined) {
                resolve({ error: 'Theater not found.' });
              } else {
                const theater = convertTheaterFromDbRecord(row);
                resolve(theater);
              }
        });
    });
}

