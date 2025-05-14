import { useState, useEffect } from 'react';
import './App.css';
import { Container, Form, Row, Col, ListGroup, Navbar, Nav, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { toast ,ToastContainer} from 'react-toastify'

function App() {
  const [videoLinks, setVideoLinks] = useState([]);

  const [videoData, setVideoData] = useState([]);
  const [newLink, setNewLink] = useState('')

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

  const handleNewLink = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/links/new', { link: newLink });
      console.log(response.data);
      getAllLinks();
      toast.success('Link added!', { theme: 'dark' });
    } catch (err) {
      console.log(err);
      toast.error('Error adding link', { theme: 'dark' });
    }
  };

  const getAllLinks = async()=> {
    try {
      let response = await axios.get(`http://localhost:3000/api/links`)
      setVideoLinks(response.data)
      console.log(response.data)
    } catch(err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getAllLinks()
  }, [])
  
  useEffect(() => {
    const getVideoData = async () => {
      const data = await Promise.all(videoLinks.map(link => fetchVideoData(link.link)));
      setVideoData(data);
    };
  
    if (videoLinks.length > 0) {
      getVideoData(); // fetch video details only after links are loaded
    }
  }, [videoLinks]); // run every time videoLinks updates
  
  return (
    <>
      <ToastContainer />
      <div className="bg-dark bg-gradient border-bottom shadow-lg">
        <Container>
          <div className='text-center p-4'>
              <h1 style={{ letterSpacing: '-3px' }} className=''>watchtogether</h1>
            <h5 className='fs-5 text-body-secondary lead mb-4'>A place where you can watch any type of youtube video, together!</h5>
            <Form className='mt-5'>
              <Form.Control type="text" placeholder="Paste your YouTube link here!" className='rounded-5' onChange={(e) => setNewLink(e.target.value)}/>
            </Form>
            <Button className='rounded-5 px-5 mt-3' onClick={(e)=> handleNewLink()}>Add Link To Queue</Button>
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
            <h6>Queue ({videoLinks.length})</h6>
            <Row className='g-2'>
              {videoData.map((video, index) => (
                <Col key={index} md={4} className=''>
                  <div className="card bg-body-tertiary shadow-lg">
                    <div className="card-header d-flex justify-content-between">
                     <small>Added By </small>
                     <i className="bi bi-x-lg"></i>
                    </div>
                    <Row className='g-0'>
                      <Col md={4}>
                        <Card.Img variant="top" src={video.thumbnails.maxres.url} className='img-fluid rounded-start'/>
                      </Col>
                    <Col md={8}>
                      <div className="card-body">
                        <h6 className='mb-0 p-0'>
                          {video.title}
                        </h6>
                        <small className='text-body-secondary'>{video.channelTitle}</small>
                      </div>
                    </Col>
                    </Row>
                    <div className="card-footer">
                      <Button size='sm'>
                        <i className="bi bi-play-fill me-1"></i>
                        Play Next</Button>
                      
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
