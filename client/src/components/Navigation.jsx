import 'bootstrap-icons/font/bootstrap-icons.css';

import { Navbar, Nav, Form } from 'react-bootstrap';

import { LoginButton, LogoutButton } from './Auth';

const Navigation = (props) => {

    return (
        <Navbar expand="md" className="bg-body-secondary justify-content-between">
            <Navbar.Brand className="mx-2">
                <i className="bi bi-ticket-perforated mx-2" />
                Concert Seats
            </Navbar.Brand>
            <Nav className="mx-2">
                <Navbar.Text className="mx-2 fs-5">
                    {props.user && props.user.name && `Logged in as: ${props.user.name}`}
                </Navbar.Text>
                <Form className="d-flex align-items-center" variant="dark">
                    {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                </Form>
            </Nav>
        </Navbar>
    );
}

export { Navigation };