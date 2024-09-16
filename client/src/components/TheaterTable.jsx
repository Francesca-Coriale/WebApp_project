import { Container, Table, Row, Col, Button, Modal } from 'react-bootstrap';
import { useState } from 'react';

function TheaterTable(props) {
  const { theaterData, occupied, selectedSeats, blueSeats, loggedIn, booked, selectedConcert, setShowConfirmation, showConfirmation, handleManualReservation, handleReservationCancel } = props;
  
  // Function to check if a seat is occupied
  const isSeatOccupied = (rowIndex, columnIndex) => {
    return occupied.some(seat => 
      seat.row === rowIndex + 1 && seat.place === String.fromCharCode(65 + columnIndex)
    );
  };

  // Function to check if a seat is selected (use optional chaining)
  const isSeatSelected = (rowIndex, columnIndex) => {
    return selectedSeats?.some(seat => 
      seat.row === rowIndex + 1 && seat.place === String.fromCharCode(65 + columnIndex)
    );
  };

  // Function to check if a seat is blue (use optional chaining)
  const isSeatBlue = (rowIndex, columnIndex) => {
    return blueSeats?.some(seat => 
      seat.row === rowIndex + 1 && seat.place === String.fromCharCode(65 + columnIndex)
    );
  };

  // Handle seat click (only for logged-in users)
  const handleSeatClick = (rowIndex, columnIndex) => {
    if (!loggedIn || isSeatOccupied(rowIndex, columnIndex) || booked) return;  // Disable seat clicking for non-logged-in users or if seat is occupied or booked is true
    const seatCode = {
      row: rowIndex + 1,
      place: String.fromCharCode(65 + columnIndex)
    };
    props.setSelectedSeats(prevSelectedSeats => {
      if (isSeatSelected(rowIndex, columnIndex)) {
        return prevSelectedSeats.filter(seat => !(seat.row === seatCode.row && seat.place === seatCode.place));
      } else {
        return [...prevSelectedSeats, seatCode];
      }
    });
  };

  return (
    <Container fluid>
      <Row className="justify-content-center mx-4 my-2">
        <div className="bg-light text-center p-3 mb-3 rounded" style={{ height: '70px', fontSize: '24px', fontWeight: 'bold' }}>
          STAGE
        </div>
      </Row>

      <Row className='mx-4 my-2'>
        <Table bordered hover responsive="md">
          <tbody>
            {Array.from({ length: theaterData.rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: theaterData.columns }).map((_, columnIndex) => {
                  const seatCode = `${rowIndex + 1}${String.fromCharCode(65 + columnIndex)}`;
                  const seatOccupied = isSeatOccupied(rowIndex, columnIndex);
                  const seatSelected = isSeatSelected(rowIndex, columnIndex);
                  const seatBlue = isSeatBlue(rowIndex, columnIndex); 
                  return (
                    <td 
                      id={seatCode} 
                      key={columnIndex} 
                      style={{ 
                        border: '3px solid white',
                        textAlign: 'center', 
                        backgroundColor: seatBlue ? 'lightblue' : seatOccupied ? 'lightcoral' : seatSelected ? 'yellow' : 'lightgreen',
                        cursor: loggedIn && !booked && !seatOccupied ? 'pointer' : 'default' 
                      }}
                      onClick={() => handleSeatClick(rowIndex, columnIndex)} >
                      <i className={`bi bi-ticket-perforated ${seatBlue ? 'text-primary' : seatOccupied ? 'text-danger' : seatSelected ? 'text-warning' : 'text-success'}`} style={{ fontSize: '24px' }}></i>
                      <div> {seatCode} </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
    
      {loggedIn && !booked &&(
        <Row className='mx-4 my-2'>
          <Col>
            <Button variant='success' onClick={() => setShowConfirmation(true)} disabled={theaterData.seats === occupied.length || selectedSeats.length==0} > Submit </Button>
            <Button variant='danger' onClick={handleReservationCancel} disabled={theaterData.seats === occupied.length || selectedSeats.length==0} > Cancel </Button>
          </Col>
        </Row>
      )}

      {loggedIn && (
        <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Reservation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h3>Concert: {selectedConcert.name}</h3>
            <ul>
              {selectedSeats?.map((seat, index) => (
                <li key={index}>Row {seat.row}, Place {seat.place}</li>
              ))}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant='success' onClick={handleManualReservation}> Confirm </Button>
            <Button variant='danger' onClick={handleReservationCancel}> Cancel </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
}

export { TheaterTable };
