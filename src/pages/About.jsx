import React from "react";
import { Navbar, Container, Nav} from 'react-bootstrap'
import { Link } from 'react-router-dom'

const About = ()=> {
    return(
        <>  
              <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand  as={Link} to="/">Watch Together</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/about">About</Nav.Link>
            <Nav.Link as={Link} to="/links">Links</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    <Container>
            <br />
            <h1>About Watch Together</h1>
            <br />
            <p>Watch Together, is a collaborative YouTube viewing platform that lets users share and watch videos in sync with others in real time. Users can add YouTube links to a shared queue, view video details like titles and thumbnails, and enjoy synchronized playback with built-in play and pause events powered by Socket.IO. The app includes a live commenting system, giving viewers the chance to chat while watching, and it stores user details locally for personalized interaction. With an intuitive UI built using React, Bootstrap, and Framer Motion, Watch Together delivers a smooth, engaging experience that makes virtual co-watching simple and fun.</p>
    </Container>
        
        </>
    )
}

export default About