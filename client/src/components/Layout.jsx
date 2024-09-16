
import { Table, Row, Col, Button, Alert, Card, Container, Spinner } from 'react-bootstrap';
import { Outlet, Link } from 'react-router-dom';

import { Navigation } from './Navigation';
import { useState, useEffect } from 'react';
import { LoginForm } from './Auth';
import { TheaterTable } from './TheaterTable.jsx';
import { Reservation } from './Reservation.jsx';

import API from '../API.js';
import '../App.css';


function NotFoundLayout(props) {
    return (
      <>
        <h2>This route is not valid!</h2>
        <Link to="/">
          <Button variant="primary">Go back to the main page!</Button>
        </Link>
      </>
    );
}

function LoginLayout(props) {
  return (
    <Row>
      <Col>
        <LoginForm login={props.login} dirty={props.dirty} setDirty={props.setDirty}
                  errorMessage={props.errorMessage} setErrorMessage={props.setErrorMessage} />
      </Col>
    </Row>
  );
}

function ConcertsLayout(props) {
  const { concerts, loggedIn, reserved } = props;

  return (
  <Container fluid>
    {props.message &&
      ( <Alert key='success' variant='success' className='my-2' onClose={()=>props.setMessage('')} dismissible> {props.message} </Alert>
      )}
    
    {concerts.length === 0 ? (
      <>
        {props.errorMessage && (
        <Alert key='danger' variant='danger' className='my-2' onClose={()=>props.setErrorMessage('')} dismissible> {props.errorMessage} </Alert>
        )}
        <Spinner animation='border' role='status'> <span className='visually-hidden'> Loading concerts data... </span> </Spinner>
        <p> Loading Concerts... </p>
      </>
    ) : (
      <Row className='text-center align-items-center mx-4 my-4'>
      <h1>Select a Concert</h1>
      <div className='d-flex justify-content-center flex-wrap'>
        {concerts.map(concert => (
          <Card className='hover-card' style={{ width: '200px', margin: '10px' }} key={concert.id} 
                onClick={() => props.handleSelection({ target: { value: concert.id } })} >
            <Card.Img variant='top' src={`${concert.id}.jpg`} alt={concert.concert}       // Accessible alternative text
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}  />
            <Card.Body>
              <Card.Title>{concert.concert}</Card.Title>
            </Card.Body>
          </Card>
        ))}
      </div>
    </Row>
    ) }
    
    {loggedIn && (
    <>
      <Row className=" align-items-center">
        <Col className='text-start'>
          <h3>Your Reserved Seats:</h3>
        </Col>
        {reserved.length !== 0 && (
          <Col className="text-end">
            <strong>
              Enjoy a discount for next year's concert season!
            </strong>
          </Col>
        )}
      </Row>

      {reserved.length !== 0 ? (
        <>
          <Table responsive hover className="mx-8 border rounded shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Concert Name</th>
                <th>Seats</th>
                <th>Discount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(props.groupedReservations).map((concertId) => {
                // Find the discount for the current concertId
                const concertDiscount =
                  props.discounts.find((d) => d.concert === concertId)?.discount || 0; // Default to 0 if not found

                return (
                  <tr key={concertId}>
                    <td>
                      <strong>{props.groupedReservations[concertId][0].concert_name}</strong>
                    </td>
                    <td>
                      <ul className="list-inline mb-0">
                        {props.groupedReservations[concertId].map((seat) => (
                          <li
                            key={seat.row + seat.place}
                            className="list-inline-item pe-2" >
                            <span className="badge bg-success">
                              {seat.row} {seat.place}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <p>
                        <strong>{concertDiscount} %</strong>
                      </p>
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        className="px-4"
                        onClick={() => props.handleDelete(concertId)}
                      >
                        Delete All
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </>
      ) : (
        <p className=" text-secondary text-center"><strong>You have no reservations yet.</strong></p>
      )}
    </>
  )}
  </Container>
  );
}

function TheaterLayout(props) {
  const { selectedConcert, theaterData, loggedIn, dirty, occupied, booked} = props; // Retrieve the parameters from the URL
  const totOccupied = occupied.length;
  const totAvailable = theaterData ? theaterData.seats - totOccupied : 0;

  const [dirtyTheater, setDirtyTheater] = useState(false);

  useEffect(() => {
    if (selectedConcert !=null) {
    API.getTheater(selectedConcert.theater)
      .then((theater) => {
        props.setTheaterData(theater);
        setDirtyTheater(true);
      })
      .catch((error) => console.error('Error fetching theater:', error));
    }
  }, []);

  useEffect(() => {
    if(dirtyTheater){
      API.getOccupied(selectedConcert.id)
        .then((occupiedSeats) => {
          props.setOccupied(occupiedSeats);
          setDirtyTheater(false);
        })
        .catch((error) => console.error('Error fetching occupied seats:', error));
    }
  }, [ dirtyTheater ]);

  return (
    <Container fluid>
      {!theaterData ? (
        <div className='my-2'>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading theater data...</span>
          </Spinner>
          <p> Loading theater data... </p>
        </div>
      ) : (
      <Row className='mx-4 align-items-center'>
        <Col className='text-start'>
          <Button variant='outline-primary' onClick={() => props.handleBack()}>
          <i className='bi bi-arrow-bar-left'> Back </i> 
          </Button>
        </Col>
        <Col className='text-end'>
          <h2>{theaterData.name}</h2>
          <h3>Concert: {selectedConcert.name}</h3>
        </Col>
      </Row>
      ) }
    

    {!loggedIn && theaterData && (
      <>
        <Alert className='mx-4 my-4' key={'warning'} variant='warning' dismissible> 
          <i className="bi bi-exclamation-triangle me-2" style={{ fontSize: '24px' }}></i>
          <span>To reserve a seat you need to log in</span>
        </Alert>
        <TheaterTable theaterData={theaterData} occupied={occupied} loggedIn={loggedIn} />
      </>
    )}

    {loggedIn && theaterData && (
      booked ? (
        <>
          <Alert className='mx-4 align-items-center' key='danger' variant='danger' onClose={() => props.setErrorMessage('')}>
            {props.errorMessage}
            <Button variant='outline-danger' className='ms-3' onClick={() => props.handleBack()}>
              <i className='bi bi-arrow-bar-left'> Go Back </i>
            </Button>
          </Alert>
          <TheaterTable theaterData={theaterData} occupied={occupied} loggedIn={loggedIn} selectedConcert={selectedConcert} booked={booked}/>
        </>
      ) : (
        <Row>
          {props.errorMessage && (
            <Alert key='danger' variant='danger' onClose={() => props.setErrorMessage('')} dismissible>
              {props.errorMessage}
            </Alert>
          )}
          <Reservation theaterData={theaterData} setTheaterData={props.setTheaterData} selectedConcert={selectedConcert} setSelectedConcert={props.setSelectedConcert}
                      occupied={occupied} loggedIn={loggedIn} user={props.user} dirty={dirty} setDirty={props.setDirty}
                      dirtyTheater={dirtyTheater} setDirtyTheater={setDirtyTheater} booked={booked}
                      message={props.message} setMessage={props.setMessage} errorMessage={props.errorMessage} setErrorMessage={props.setErrorMessage} />
        </Row>
      )
    )}

    {theaterData && (
      <Row className='text-start mx-4 my-4'>
      <h4 className='text-success'> Available Seats: {totAvailable}</h4>
      <h4 className='text-danger'> Occupied Seats: {totOccupied} </h4>
      <h3> Total Seats: {theaterData.seats}</h3>
    </Row>
    )}
    
    </Container>
  );
}
  

function GenericLayout(props) {
  return (
    <>
     <Row>
        <Col>
          <Navigation loggedIn={props.loggedIn} user={props.user} logout={props.logout} />
        </Col>
      </Row>

      <Row>
        <Col className='text-center'>
          <Outlet />
        </Col>
      </Row>
    </>
  );
}
  
export { GenericLayout, NotFoundLayout, ConcertsLayout, TheaterLayout, LoginLayout };