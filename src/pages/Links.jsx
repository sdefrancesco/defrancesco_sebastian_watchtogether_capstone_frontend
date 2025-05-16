import React, { useEffect, useState } from "react";
import { Navbar, Container, Nav, Card, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Links = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const getAllLinks = async()=> {
    try {
      let response = await axios.get(`${BACKEND_URL}/api/links`)
      setLinks(response.data)
      setLoading(false)
      console.log(response.data)
    } catch(err) {
      console.log(err)
    }
  }

  useEffect(() => {

    getAllLinks();
  }, []);

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand as={Link} to="/">Watch Together</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/about">About</Nav.Link>
              <Nav.Link as={Link} to="/links">Links</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <h1>Links</h1>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row>
            {links.map(link => (
              <Col key={link._id} md={4} className="mb-3">
                <Card>
                  <Card.Img variant="top" src={`https://img.youtube.com/vi/${link.videoId}/0.jpg`} />
                  <Card.Body>
                    <Card.Title>{link.title}</Card.Title>
                    <Card.Text>
                      {link.description || "No description available."}
                    </Card.Text>
                    <a href={`https://www.youtube.com/watch?v=${link.videoId}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Watch on YouTube
                    </a>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default Links;
