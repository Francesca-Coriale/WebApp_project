import { useState } from 'react';
import { Form, Button, Alert, Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('user1@exam.com');
  const [password, setPassword] = useState('pwd');

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    if (!username) {
      props.setErrorMessage('Username cannot be empty');
    } else if (!password) {
      props.setErrorMessage('Password cannot be empty');
    } else {
      props.login(credentials)
        .then(() => {
          props.setErrorMessage('');
          //props.setDirty(true);
          navigate('/');
        })
        .catch((err) => {
          props.setErrorMessage(err.error);
        });
    }
  };

  return (
    <Row>
      <Col xs={4}></Col>
      <Col xs={4}>
        <h1 className='pb-3'>Login</h1>

        <Form onSubmit={handleSubmit}>
          {props.errorMessage ? <Alert dismissible onClose={() => props.setErrorMessage('')} variant='danger'>{props.errorMessage}</Alert> : null}
          
          <Form.Group className='mb-3'>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type='email'
              value={username}
              placeholder='Example: userX@exam.com'
              onChange={(ev) => setUsername(ev.target.value)}
            />
          </Form.Group>
          
          <Form.Group className='mb-3'>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type='password'
              value={password}
              placeholder='Enter your password'
              onChange={(ev) => setPassword(ev.target.value)}
            />
          </Form.Group>

          <Button className='mt-3' type='submit'>Login</Button>
          <Button className='mt-3' variant='danger' onClick={() => navigate(-1)}>Cancel</Button>
        </Form>
      </Col>
      <Col xs={4}></Col>
    </Row>
  );
}


function LogoutButton(props) {
  return (
    <Button variant='outline-dark' onClick={props.logout}>Logout</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant='outline-success' onClick={()=> navigate('/login')}>Login</Button>
  )
}

export { LoginForm, LogoutButton, LoginButton };