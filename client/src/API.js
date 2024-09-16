
const SERVER_URL = 'http://localhost:3001/api/';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}

/**
 * Getting from the server side and returning the list of concerts for all theaters.
 */
const getConcertsTheaters = async () => {
    return getJson( fetch(SERVER_URL + 'concerts') )
    .then( json => {
        return json.map((row) => {
            const concertTheater = {
                id: row.id,
                concert: row.concert,
                theater: row.theater
            }
        return concertTheater;
    })
  })
}

/**
 * Getting from the server side and returning the specifications for a specific theater
 */
const getTheater = async (theaterId) => {
  return getJson( fetch(SERVER_URL + 'theaters/' + theaterId) )
  .then( json => {
    const theater = {
      id: json.id,
      name: json.name,
      size: json.size,
      rows: json.rows,
      columns: json.columns,
      seats: json.seats
    }
    return theater;
  })
}

/**
 * Getting from the server side and returning all the occupied seats for a specific concert
 */
const getOccupied = async (concertId) => {
  return getJson( fetch(SERVER_URL + 'reservations/' + concertId) )
  .then( json => {
    return json.map((e) => {
      const occupiedSeat = {
        reservation_id: e.reservation_id,
        concert_id: e.concert_id,
        concert_name: e.concert_name,
        row: e.row,
        place: e.place,
        user: e.user
      }
      return occupiedSeat;
    })
  })
}

/**
 * Getting the seats reserved by a specific user
 */
const findReservation = async (userId) => {
  return getJson(fetch(SERVER_URL + 'reservations/concert/' + userId, {
  credentials: 'include' }))
  .then( json => {
    return json.map((e) => {
        const seatReserved = {
            reservation_id: e.reservation_id,
            concert_id: e.concert_id,
            concert_name: e.concert_name,
            row: e.row,
            place: e.place,
            user: e.user
        }
    return seatReserved;
    })
  })
}

/**
 * Checking if the selected seats are still available (manual reservation only)
 */
const checkAvailabilityParallel = async (concert_id, selectedSeats) => {
  const urls = selectedSeats.map(seat => {
    return (SERVER_URL + 'reservations/check-availability/' + `${concert_id}/${seat.row}/${seat.place}`);
  });

  try {
    // Fetch all URLs in parallel
    const promises = urls.map(url => fetch(url, { credentials: 'include' }) );
    const responses = await Promise.all(promises);

    // Log responses status and check if all responses are ok
    responses.forEach((res, index) => {
      if (!res.ok) {
        console.error(`Request ${index} failed with status: ${res.status}`);
      }
    });

    // Extract JSON from each response in parallel
    const occupiedSeatsPromises = responses.map(res => res.json());
    const occupiedSeatsResults = await Promise.all(occupiedSeatsPromises);

    // Filter out the seats that are already occupied
    const blueSeats = occupiedSeatsResults.filter(result => result.isOccupied);
    return blueSeats;
  
  } catch (error) {
    console.error('Error:', error);
    return null;  // Handle the error as needed
  }
};


/**
 * Posting to the server the list of selected seats (both automatic and manually reservation)
 */
const postSelected = async (selectedSeats, userId) => {
  const reservationData = selectedSeats.map(seat => ({
    concert_id: seat.concert_id,
    concert_name: seat.concert_name,
    row: seat.row,
    place: seat.place,
    user: seat.user // Ensure the user ID is included
  }));

  return getJson(
    fetch(SERVER_URL + 'reservations', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reservation: reservationData, userId: userId })
    })
  )
};

/**
 * Checking and adding new reservations given a number of seats (automatic reservation)
 */
const postAutoSelected = async (selectedConcert, seatCount, theaterData, userId) => {
  return getJson( fetch(SERVER_URL + 'reservations/auto-reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        selectedConcert: selectedConcert,
        seatCount: seatCount,
        userId: userId,
        theaterData: theaterData,
      }),
    })
  )
  .then((json) => {
    return json.reservedSeats.map((seat) => {
      const reservedSeat = {
        concert_id: seat.concert_id,
        concert_name: selectedConcert.name,
        row: seat.row,
        place: seat.place,
        user: userId,
      };
      return reservedSeat;
    });
  })
  .catch((error) => {
    if (error.availableSeats !== undefined) {
      // Handle custom error with available seats information
      console.error('Error: Not enough seats available. Remaining seats:', error.availableSeats);
      throw { 
        error: error.error, 
        availableSeats: error.availableSeats 
      };
    } else {
      console.error('Error during automatic seat reservation:', error);
      throw { error: error.error || error.message };
    }
  });
};


/**
 * Deleting to the server the list of selected seats
 */
const deleteReservation = async (concertId, userId) => {
  try {
    const response = await fetch(SERVER_URL + 'reservations/' + concertId, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userId })
    });

    // Check if the response status is OK
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error: ${errorData.error}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    // Log any errors that occur during the fetch operation
    console.error('Error deleting reservation:', error);
    throw error;  // Rethrow the error to be handled by the caller
  }
};


/*** Authentication functions ***/
/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    credentials: 'include'
  })
  )
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  })
  )
}

/**
 * This function retrieves an authentication token .
 */
async function getAuthToken() {
  return getJson(fetch(SERVER_URL + 'auth-token', {
    credentials: 'include'
  })
  )
}


/**
 * Server 2 API
 */
async function getDiscount(authToken, rows) {
  // retrieve info from an external server, where info can be accessible only via JWT token
  return getJson(fetch('http://localhost:3002/api/' + 'discount', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({rows: rows}),
  })
  );
}


const API = { getConcertsTheaters, getTheater, getOccupied, postSelected, findReservation, checkAvailabilityParallel, postAutoSelected, deleteReservation, logIn, getUserInfo, logOut,
  getAuthToken, getDiscount };
export default API;