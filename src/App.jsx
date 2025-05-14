import { useState, useEffect } from 'react';
import './App.css';
import { Container, Form, Row, Col, ListGroup, Navbar, Nav, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { toast ,ToastContainer} from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [videoLinks, setVideoLinks] = useState([]);

  const [currentVideoId, setCurrentVideoId] = useState('')


  const [videoData, setVideoData] = useState([]);
  const [newLink, setNewLink] = useState('')

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

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
      toast.success('Link added to queue', { theme: 'dark' });
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

  const handleDeleteLink = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/links/${id}`);
      toast.info('Link removed from queue.', { theme: 'dark' });
      getAllLinks(); // refresh the list
    } catch (err) {
      console.error(err);
      toast.error('Error deleting link', { theme: 'dark' });
    }
  };

  const fetchComments = async (linkId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/comments/${linkId}`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load comments', { theme: 'dark' });
    }
  };
  
  const addComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
  
    try {
      const res = await axios.post('http://localhost:3000/api/comments', {
        text: commentText,
        linkId: videoLinks.find(link => new URL(link.link).searchParams.get("v") === currentVideoId)?._id,
        author: "Anonymous", 
      });
  
      setCommentText('');
      fetchComments(videoLinks.find(link => new URL(link.link).searchParams.get("v") === currentVideoId)?._id);
      toast.success('Comment added!', { theme: 'dark' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to add comment', { theme: 'dark' });
    }
  };

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
            <Form>
              <h6>Video Parameters</h6>
          <div className="px-4 py-2 border bg-body-tertiary shadow-lg rounded mb-2 d-flex align-items-center justify-content-between">
              <Form.Check
                type="switch"
                id="autoplay-switch"
                label="Autoplay"
                size='sm'
              />
              <Form.Check
                type="switch"
                id="fullscreen-switch"
                label="Full Screen"
              />
              <Form.Check
                type="switch"
                id="comments-switch"
                label="Comments"
              />
          </div>
            </Form>
            {currentVideoId? (
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${currentVideoId}`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
          ></iframe>

            ): (
              <div className="p-5 text-center border bg-body-tertiary mb-3 rounded shadow-lg">No Video Set Yet</div>
            )}
            <h6>Up Next</h6>
            <h6>Queue ({videoLinks.length})</h6>
            <Row className='g-2'>
            <AnimatePresence>
    {videoLinks.map((link, index) => {
      const video = videoData[index];
      if (!video) return null;

      return (
        <Col key={link._id} md={4}>
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card bg-body-tertiary shadow-lg"
          >
            <div className="card-header d-flex justify-content-between">
              <small>Added By</small>
              <i
                className="bi bi-x-lg"
                onClick={() => handleDeleteLink(link._id)}
                style={{ cursor: 'pointer' }}
              ></i>
            </div>
            <Row className='g-0'>
              <Col md={4}>
                <Card.Img
                  variant="top"
                  src={video.thumbnails?.maxres?.url || video.thumbnails?.default?.url}
                  className='img-fluid rounded-start'
                />
              </Col>
              <Col md={8}>
                <div className="card-body">
                  <h6 className='mb-0 p-0'>{video.localized.title}</h6>
                  <small className='text-body-secondary'>{video.channelTitle}</small>
                </div>
              </Col>
            </Row>
            <div className="card-footer">
              <Button
                size='sm'
                onClick={() => {
                  const videoId = new URL(link.link).searchParams.get("v");
                  setCurrentVideoId(videoId);
                  fetchComments(link._id);
                }}
              >
                <i className="bi bi-play-fill me-2"></i>
                Play Next
              </Button>
            </div>
          </motion.div>
        </Col>
      );
    })}
  </AnimatePresence>
            </Row>
          </Col>
          <Col md={3}>
          <h6>Comments {comments.length > 0 && `(${comments.length})`}</h6>
              <div id="comments" className='bg-dark rounded border shadow-lg'>
                  <div style={{maxHeight: '600px', overflowY: 'scroll', minHeight: '500px'}} className='p-3'>
                  {comments.length === 0 ? (
                    <div>No Comments Yet</div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment._id} className="bg-body-tertiary border rounded px-3 py-2 mb-2 shadow-lg">
                        <small className='fw-bold' style={{ fontSize: '.7rem' }}>
                          {comment.author || 'Anonymous'}
                        </small>
                        <p className='mb-1'>{comment.text}</p>
                        <small style={{ fontSize: '.7rem' }} className='text-muted'>
                          {new Date(comment.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))
                  )}


                  </div>
              <div className="new-comment  mt-3 p-3 border-top bg-body-tertiary">
                <h6 className='small'>Add A Comment</h6>
                <Form onSubmit={addComment}>
                  <Form.Control
                    size='sm'
                    as='textarea'
                    value={commentText}
                    placeholder="Thoughts on this video?"
                    className='rounded px-3 bg-body-tertiary'
                    onChange={(e) => setCommentText(e.target.value)}
                    rows='3'
                  />
                  <Button type='submit' size='sm' className='mt-2'>Submit</Button>
                </Form>

              </div>
              </div>
                
          </Col>
        </Row>
      </Container>
      
    </>
  );
}

export default App;
