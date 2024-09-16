
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { React, useState, useEffect, useMemo } from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { GenericLayout, NotFoundLayout, ConcertsLayout, TheaterLayout, LoginLayout } from './components/Layout';
import API from './API.js';

function App() {
  return (
    <BrowserRouter>
      <AppWithRouter />
    </BrowserRouter>
  );
}

function AppWithRouter(props) {  

  const navigate = useNavigate();  // To be able to call useNavigate, the component must already be in BrowserRouter (see App)

  const [loggedIn, setLoggedIn] = useState(false); // This state keeps track if the user is currently logged-in.
  const [user, setUser] = useState(null);

  const [concerts, setConcerts] = useState([]); // State to store the list of concerts
  const [selectedConcert, setSelectedConcert] = useState(null); // State to store the selected concert
  
  const [reserved, setReserved] = useState([]);  // State to store the reserved seats for the user

  const [theaterData, setTheaterData] = useState(null); // State to store theater data
  const [occupied, setOccupied] = useState([]);

  const [booked, setBooked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(true);

  const [authToken, setAuthToken] = useState(undefined);
  const [ discounts, setDiscounts ] = useState([]); //list of discounts for each concert


  const renewToken = () => {
    API.getAuthToken().then((resp) => { setAuthToken(resp.token); } )
    .catch(err => {console.log('DEBUG: renewToken err: ',err)});
  }


  useEffect(()=> {
    const checkAuth = async() => {
      try { // here you have the user info, if already logged in
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        API.getAuthToken().then((resp) => { setAuthToken(resp.token); })
      } catch(err) {
        // NO need to do anything: user is simply not yet authenticated
      }
    };
    checkAuth();
  }, []);  // The useEffect callback is called only the first time the component is mounted.


  /**
   * CONCERT'S FUNCTIONS
   */
  useEffect(() => {
    API.getConcertsTheaters()
    .then((concertList) => {
      setConcerts(concertList);
      setErrorMessage('');
    })
    .catch((error) => setErrorMessage('Error fetching server:', error));
  }, []); //run it only at mount time


  useEffect(() => {
    if ( loggedIn && dirty ) {
      API.findReservation(user.id)
        .then((reservedList) => {
          setReserved(reservedList);
          setDirty(false);
        })
        .catch((error) => console.error('Error fetching reserved seats:', error));
    }
  }, [loggedIn, dirty]);


  const groupedReservations = useMemo(() => {
    return reserved.reduce((groups, seat) => {
      const concertId = seat.concert_id;
      if (!groups[concertId]) {
        groups[concertId] = [];
      }
      groups[concertId].push(seat);
      return groups;
    }, {});
  }, [reserved]);  // This will recalculate only when `reserved` changes
  

  useEffect(() => {
    if (reserved.length !== 0 && authToken) {
        Object.keys(groupedReservations).forEach(concertId => {
          const rows = groupedReservations[concertId].map(e => e.row); // Get the rows for the current concertId
          API.getDiscount(authToken, rows)
          .then(d => {
            const el = { concert: concertId, discount: d };
            setDiscounts(prevDiscounts => {
              // Find the existing discount for the current concertId
              const existingDiscount = prevDiscounts.find(discount => discount.concert === concertId);
              if (existingDiscount) { // If found, update the discount value
                return prevDiscounts.map(discount =>
                  discount.concert === concertId
                    ? { ...discount, discount: d }
                    : discount
                );
              } else {
                return [...prevDiscounts, el];
              }
            });
          })
          .catch(err => {
            setDiscounts([]); // Clear the discounts on error or handle error case
            API.getAuthToken()
            .then(resp => setAuthToken(resp.token));
          });
        });
    }
  }, [reserved, authToken]);


  // Concert's booking handle (a user is not allow to book the same concert more than once) 
  const handleBooked = (concertId) => {
    const book = reserved.find(row => row.concert_id === concertId);
    if (book != null) {
      setErrorMessage('You have already booked this concert');
      setBooked(true);
    }
  }
  const handleSelection = (event) => {
    const concertId = parseInt(event.target.value);
    const selected = concerts.find(row => row.id === concertId);
    handleBooked(concertId); // A user should not book the same concert more than once
    if (selected) {
      const concert = {
        id: parseInt(selected.id),
        name: selected.concert,
        theater: parseInt(selected.theater)
      };
      setSelectedConcert(concert);
      const theatercode = encodeURIComponent(concert.theater); // URL-encode the theater name
      const concertName = encodeURIComponent(concert.name); // URL-encode the concert name
      navigate(`/theater/${theatercode}/${concertName}`);
    } else {
      setSelectedConcert(null);
    }
  };

  //Handle the delete of a reservation (all the seats for a concert)
  const handleDelete = async (concertId) => {
    const userId = user.id;
    API.deleteReservation(concertId, userId)
    .then(() => {
      setDirty(true);
    })
    .catch((error) => console.error('Error deleting reserved seats:', error));
  }


  
  const handleBack = () => {
    // clean up everything
    setSelectedConcert(null);
    setTheaterData(null);
    setDirty(true);
    setErrorMessage('');
    setBooked(false);
    navigate('/');
  }


  /**
   * LOGIN AND LOGOUT HANDLES
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
      setDirty(true);
      renewToken();
    } catch (err) {
      throw err;  // error is handled and visualized in the login form, do not manage error, throw it
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(null);
    setSelectedConcert(null);
    setReserved([]);
    setAuthToken(undefined);
    setDiscounts([]);
    setBooked(false);
    setMessage('');
    setErrorMessage('');
    navigate('/');
  };


  return (
    <Container fluid>
      <Routes>
        <Route path='/' element={<GenericLayout message={message} setMessage={setMessage}
                                  errorMessage={errorMessage} setErrorMessage={setErrorMessage}
                                  loggedIn={loggedIn} user={user} logout={handleLogout} /> } >
          <Route index element={<ConcertsLayout concerts={concerts} loggedIn={loggedIn} reserved={reserved}
                                  message={message} setMessage={setMessage} errorMessage={errorMessage} setErrorMessage={setErrorMessage} 
                                  discounts={discounts} groupedReservations={groupedReservations}
                                  handleSelection={handleSelection} handleDelete={handleDelete} /> } />
          <Route path='/theater/:theaterName/:concertName' 
                element={<TheaterLayout selectedConcert={selectedConcert} setSelectedConcert={setSelectedConcert} 
                          theaterData={theaterData} setTheaterData={setTheaterData} loggedIn={loggedIn} user={user} 
                          occupied={occupied} setOccupied={setOccupied} errorMessage={errorMessage} setErrorMessage={setErrorMessage}
                          message={message} setMessage={setMessage} dirty={dirty} setDirty={setDirty}
                          booked={booked} setBooked={setBooked} handleBack={handleBack} />} />                                                                 
          <Route path='*' element={<NotFoundLayout />} />
        </Route>
        <Route path='/login' element={!loggedIn ? <LoginLayout login={handleLogin} dirty={dirty} setDirty={setDirty}
                                                    errorMessage={errorMessage} setErrorMessage={setErrorMessage} /> : <Navigate replace to='/' />} />
      </Routes>
    </Container>
  );
}

export default App;
