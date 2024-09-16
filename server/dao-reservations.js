'use strict';

/* Data Access Object (DAO) module for accessing reservations data */
const db = require('./db');

const convertReservationsFromDbRecord = (dbRecord) => {
    return {
        reservation_id: dbRecord.reservation_id,
        concert_id: dbRecord.concert_id,
        concert_name: dbRecord.concert_name,
        row: dbRecord.row,
        place: dbRecord.place,
        user: dbRecord.user
    };
}


// This function retrieves all the reservations for a specific concert (occupied seats)
exports.retrieveReservations = (concertId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM reservations WHERE concert_id = ?';
        db.all(sql, [concertId], (err, rows) => {
            if (err) { 
                console.error('Database error:', err);
                reject(err); 
            }
            const reservations = rows.map((e) => {
                const reservation = convertReservationsFromDbRecord(e);
                return reservation;
            });
            resolve(reservations);
        })
    })
}


// This function retrieves the reservation of a user (given its Id)
exports.findReservation = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM reservations WHERE user = ?';
        db.all(sql, [userId], (err, rows) => {
            if (err) { 
                console.error('Database error:', err);
                reject(err); 
            }
            const reservation = rows.map((e) => {
                const seat = convertReservationsFromDbRecord(e);
                return seat;
            });
            resolve(reservation);
        });
    });
}

// This function checks if the seats selected are still available (manual reservation)
exports.checkAvailability = (seat) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM reservations WHERE concert_id = ? AND row = ? AND place = ?';
        db.get(sql, [seat.concert_id, seat.row, seat.place], (err, row) => {
          if (err) {
            console.error('Error checking seat availability:', err);
            reject(err);
          } else {
            resolve(row.count > 0); // True if the seat is occupied
          }
        });
    });
}

// This function get the first availables seats given the concert and the number of requested seats (automatic reservation)
exports.getAvailable = (concertId, seatCount, theaterData) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT row, place FROM reservations WHERE concert_id = ?';
        db.all(sql, [concertId], (err, rows) => {
            if (err) {
                console.error('Error fetching occupied seats (autoReserve):', err);
                return reject(err);
            }
            const occupiedSeats = rows.map(row => ({
                row: row.row,
                place: row.place
            }));

            const remainingSeats = theaterData.seats - occupiedSeats.length;
            if (remainingSeats < seatCount) {
                console.error('Not enough seats available');
                return reject({ 
                    error: 'Not enough seats available', 
                    availableSeats: remainingSeats 
                });
            }

            const availableSeats = [];
            let count = 0;
            // Iterate through the theater layout to find the firsts available seats 
            for (let rowIndex = 1; rowIndex <= theaterData.rows && count < seatCount; rowIndex++) {
                for (let columnIndex = 0; columnIndex < theaterData.columns && count < seatCount; columnIndex++) {
                    const place = String.fromCharCode(65 + columnIndex);
                    const isOccupied = occupiedSeats.some(seat => seat.row === rowIndex && seat.place === place);
                    if (!isOccupied) {
                        availableSeats.push({ row: rowIndex, place: place });
                        count++;
                    }
                    if (count === seatCount) break;
                }
            }
            resolve(availableSeats);
        })
    })
}


// This function adds a new reservation (multiple seats)
exports.addReservation = (reservation) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO reservations (concert_id, concert_name, row, place, user) VALUES ';
        const placeholders = reservation.map(() => '(?, ?, ?, ?, ?)').join(', ');   // placeholders for multiple rows

        // Flattening the array of reservation objects into an array of values
        const values = reservation.flatMap(e => [
            e.concert_id,
            e.concert_name,
            e.row,
            e.place,
            e.user
        ]);
        db.run(sql + placeholders, values, function (err) {
            if (err) { reject(err); }
            resolve(`${reservation.length} seats successfully added.`);
        });
    });
};

/**
 * These functions delete rows in the database.
 */
// This function deletes a reservation (all seats)
exports.deleteReservation = (userId, concertId) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM reservations WHERE concert_id = ? AND user = ?';
        db.run(sql, [concertId, userId], function (err) {
            if (err) {
                reject(err);
            }
            resolve(`Reservation of the user ${userId} for the concert ${concertId} successfully deleted.`);
        });
    });
};
