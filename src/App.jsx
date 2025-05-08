import { useState, useEffect } from 'react';
import './App.css';
import { Container, Form, Row, Col, ListGroup, Navbar, Nav, Button } from 'react-bootstrap';
import axios from 'axios';

function App() {
  const [videoLinks, setVideoLinks] = useState([
    "https://www.youtube.com/watch?v=2PuFyjAs7JA",
    "https://www.youtube.com/watch?v=2PuFyjAs7JA",
    "https://www.youtube.com/watch?v=2PuFyjAs7JA",
    "https://www.youtube.com/watch?v=2PuFyjAs7JA",
    "https://www.youtube.com/watch?v=2PuFyjAs7JA",
  ]);

  const [videoData, setVideoData] = useState([]); 

  const apiKey = 'AIzaSyC2VT90TYxe-1d4o1E7FXm9xi--6VuMwZA';

  const fetchVideoData = async (url) => {
    const videoId = new URL(url).searchParams.get("v"); 
    if (videoId) {
      try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
          params: {
            part: 'snippet',
            id: videoId,
            key: apiKey
          }
        });
        const video = response.data.items[0]?.snippet;
        console.log(video)
        return video
      } catch (error) {
        console.error("Error fetching video data:", error);
        return {
          title: "Title not found",
          thumbnail: '',
        };
      }
    }
    return {
      title: "Invalid URL",
      thumbnail: '',
    };
  };

  useEffect(() => {
    const getVideoData = async () => {
      const data = await Promise.all(videoLinks.map(link => fetchVideoData(link)));
      setVideoData(data);
    };

    getVideoData();
  }, [videoLinks]);

  return (
    <>
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand href="#home">
              <h4 style={{ letterSpacing: '-2px' }} className=''>watchtogether</h4>
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#features">Features</Nav.Link>
          <Nav.Link href="#pricing">Pricing</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
      <div className="bg-dark bg-gradient border-bottom shadow-lg">
        <Container>
          <div className='text-center p-4'>
            <h5 className='display-6 fs-5 text-body-secondary'>Paste a link from YouTube</h5>
            <Form className='mt-4'>
              <Form.Control type="text" placeholder="Paste your YouTube link here!" className='rounded-5' />
            </Form>
          </div>
        </Container>
      </div>
      <br />
      <Container>
        <Row>
          <Col md={9}>
            <iframe
              width="100%"
              height="400"
              src="https://www.youtube.com/watch?v=2PuFyjAs7JA"
              frameBorder="0"
              allow="encrypted-media"
              allowFullScreen
            ></iframe>
            <h6>Up Next</h6>
            <h6>Queue</h6>
            <Row>
              {videoData.map((video, index) => (
                <Col key={index} md={4} className='mb-4'>
                  <div className="card bg-body-tertiary shadow-lg">
                    <div className="card-body">
                      <img
                        src={video.thumbnails.default.url}
                        alt={video.title}
                        style={{ width: '50px', height: 'auto', marginRight: '10px' }}
                      />
                      {video.title}<br/>
                      <h6>{video.channelTitle}</h6>

                    </div>
                  </div>
                </Col>
              ))}

            </Row>
          </Col>
          <Col md={3}>
              <h6>Comments</h6>
          </Col>
        </Row>
      </Container>
      
    </>
  );
}

export default App;
