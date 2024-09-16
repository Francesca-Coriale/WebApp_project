
import { useState, useEffect } from 'react';
import { Container, Row, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import API from '../API.js';
import { TheaterTable } from './TheaterTable.jsx';

function AutomaticReservation(props) {
  const { theaterData, selectedConcert, user } = props;
  const [autoSeatCount, setAutoSeatCount] = useState(0);

  const navigate = useNavigate();

  const handleAutoReservation  = async () => {
    try {
      await API.postAutoSelected(selectedConcert, autoSeatCount, theaterData, user.id);
      props.setMessage('Reservation successfully completed!');
      props.setErrorMessage('');
      props.setDirty(true);
      props.setSelectedConcert(null);
      navigate('/');
    } catch (error) {
      if (error.availableSeats !== undefined) {
        // Display a custom error message with remaining available seats
        props.setErrorMessage(`Failed to reserve seats: ${error.error}. Remaining available seats: ${error.availableSeats}`);
      } else {
        // Display the general error message
        props.setErrorMessage(`Failed to reserve seats: ${error.error}`);
      }
      console.error('Auto-reservation error:', error);
    }
  }


  const handleSubmit = (event) => {
    event.preventDefault();  // Prevent default form submission behavior
    if (autoSeatCount > 0) {
      handleAutoReservation();
    }
  };

  return (
  <div>
      <Form onSubmit={handleSubmit}>
          <Form.Group controlId='autoSeatCount'>
              <Form.Label> <h3>Automatic: How many seats to reserve?</h3></Form.Label>
              <Form.Control 
              type='number' 
              min='0' 
              value={autoSeatCount} 
              onChange={(e) => setAutoSeatCount(parseInt(e.target.value))} 
              placeholder='Enter a number' 
              />
          </Form.Group>
          <Button className='my-2' variant='primary' type='submit' disabled={autoSeatCount <= 0}>
              Reserve Automatically
          </Button>
      </Form>
  </div>
)}


function ManualReservation(props) {
  const { theaterData, selectedConcert, selectedSeats, setSelectedSeats, occupied, loggedIn, booked, user } = props;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [blueSeats, setBlueSeats] = useState([]);
  
  const navigate = useNavigate();

  // useEffect to clear blue seats after a delay
  useEffect(() => {
    if (blueSeats.length > 0) {
      setSelectedSeats([]);
      const timeout = setTimeout(() => {
      setBlueSeats([]);
      props.setDirtyTheater(true);
      }, 5000); // Clear blue seats after 5 seconds
      return () => clearTimeout(timeout); // Cleanup function to clear the timeout if blueSeats changes before the timeout completes
    }
  }, [blueSeats]);


  const handleManualReservation = async () => {
    setShowConfirmation(false); // Hide confirmation modal
    try {
      const occupiedSeats = await API.checkAvailabilityParallel(selectedConcert.id, selectedSeats);
      if (occupiedSeats.length === 0) {
        const updatedSeats = selectedSeats.map(seat => ({
          ...seat,
          concert_id: selectedConcert.id,
          concert_name: selectedConcert.name,
          user: user.id
        }));
        await API.postSelected(updatedSeats, user.id);
        props.setMessage('Reservation successfully completed!')
        props.setErrorMessage('');
        props.setSelectedConcert(null);
        props.setTheaterData(null);
        setSelectedSeats([]);
        props.setDirty(true);
        navigate('/');
      } else {
        props.setErrorMessage('The seats in blue have already been occupied by others. Try again');
        setBlueSeats(occupiedSeats); // Highlight occupied seats in blue
      }
    } catch (error) {
      console.error('Error during seat availability check or reservation:', error);
    }
  };


  const handleReservationCancel = () => {
    setSelectedSeats([]);
    setShowConfirmation(false); // Hide confirmation modal
  };

  return (
      <TheaterTable theaterData={theaterData} occupied={occupied} selectedSeats={selectedSeats} setSelectedSeats={setSelectedSeats} blueSeats={blueSeats}
                    loggedIn={loggedIn} booked={booked} selectedConcert={selectedConcert} showConfirmation={showConfirmation} setShowConfirmation={setShowConfirmation}
                    handleManualReservation={handleManualReservation} handleReservationCancel={handleReservationCancel} />
  );
}


function Reservation(props) {
  const { theaterData, selectedConcert, occupied, loggedIn } = props;
  const [selectedSeats, setSelectedSeats] = useState([]);

  return (
    <Container>
      <Row>
        <AutomaticReservation theaterData={theaterData} selectedConcert={selectedConcert} setSelectedConcert={props.setSelectedConcert} 
                              occupied={occupied} dirty={props.dirty} setDirty={props.setDirty} loggedIn={loggedIn} user={props.user}
                              message={props.message} setMessage={props.setMessage} errorMessage={props.errorMessage} setErrorMessage={props.setErrorMessage} />
      </Row>
      <Row>
        <h3 className='my-2'> Or manually: Choose seats to reserve </h3>
        <ManualReservation theaterData={theaterData} setTheaterData={props.setTheaterData} selectedConcert={selectedConcert} setSelectedConcert={props.setSelectedConcert} occupied={occupied} 
                          selectedSeats={selectedSeats} setSelectedSeats={setSelectedSeats} errorMessage={props.errorMessage} setErrorMessage={props.setErrorMessage}
                          message={props.message} setMessage={props.setMessage} dirtyTheater={props.dirtyTheater} setDirtyTheater={props.setDirtyTheater}
                          dirty={props.dirty} setDirty={props.setDirty} loggedIn={loggedIn} user={props.user} booked={props.booked} />
      </Row>
      <Row className='text-start mx-4'>
        <h4 className='text-warning'> Selected Seats: {selectedSeats.length} </h4>
      </Row>
    </Container>
  )
}


export {Reservation};
