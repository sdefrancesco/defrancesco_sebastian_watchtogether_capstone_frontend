import { useState, useEffect, useRef } from 'react';
import { Container, Form, Row, Col, ListGroup, Navbar, Nav, Button, Card, Modal } from 'react-bootstrap';
import axios from 'axios';
import { toast ,ToastContainer} from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import YouTube from 'react-youtube';
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const socket = io(`${BACKEND_URL}`)

const Home = () => {

  const [videoLinks, setVideoLinks] = useState([]);

  const [currentVideoId, setCurrentVideoId] = useState('')


  const [videoData, setVideoData] = useState([]);
  const [newLink, setNewLink] = useState('')

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const [showUserModal, setShowUserModal] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');


  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditLink, setCurrentEditLink] = useState(null);
  const [editedLink, setEditedLink] = useState('');

  // Add ref for YouTube player instance
  const playerRef = useRef(null);

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
      const response = await axios.post(`${BACKEND_URL}/api/links/new`, { link: newLink });
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
      let response = await axios.get(`${BACKEND_URL}/api/links`)
      setVideoLinks(response.data)
      console.log(response.data)
    } catch(err) {
      console.log(err)
    }
  }

  const handleDeleteLink = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/links/${id}`);
      toast.info('Link removed from queue.', { theme: 'dark' });
      getAllLinks(); // refresh the list
    } catch (err) {
      console.error(err);
      toast.error('Error deleting link', { theme: 'dark' });
    }
  };

  const fetchComments = async (linkId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/comments/${linkId}`);
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
      const storedUser = JSON.parse(localStorage.getItem('watchTogetherUser'));
      const author = storedUser ? `${storedUser.firstName} ${storedUser.lastName}` : 'Anonymous';
  
      const res = await axios.post(`${BACKEND_URL}/api/comments`, {
        text: commentText,
        linkId: videoLinks.find(link => new URL(link.link).searchParams.get("v") === currentVideoId)?._id,
        author,
      });
  
      setCommentText('');
      fetchComments(videoLinks.find(link => new URL(link.link).searchParams.get("v") === currentVideoId)?._id);
      toast.success('Comment added!', { theme: 'dark' });
      socket.emit('newComment', {
        linkId: videoLinks.find(link => new URL(link.link).searchParams.get("v") === currentVideoId)?._id
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to add comment', { theme: 'dark' });
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      const userData = { firstName, lastName };
      localStorage.setItem('watchTogetherUser', JSON.stringify(userData))
      setShowUserModal(false);
      toast.success(`Welcome, ${firstName} ${lastName}!`, { theme: 'dark' });
      socket.emit('userJoined', userData);
    } else {
      toast.error('Please enter both first and last name.', { theme: 'dark' });
    }
  };

  const handleUpdateLink = async (id, newLink) => {
    try {
        console.log(id)
      const response = await axios.put(`${BACKEND_URL}/api/links/${id}`, {
        link: newLink })
  
        console.log(response.data)
      // Update state
      const updatedLinks = videoLinks.map(link =>
        link._id === response.data._id ? response.data.link : link
      );
      setVideoLinks(updatedLinks);
  
      fetchVideoData(updatedLinks);
  
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event) => {
    const playerStatus = event.data;
    const currentTime = playerRef.current.getCurrentTime();

    if (playerStatus === 1) { // playing
      socket.emit('playVideo', {
        videoId: currentVideoId,
        time: currentTime,
      });
    } else if (playerStatus === 2) { // paused
      socket.emit('pauseVideo', {
        videoId: currentVideoId,
        time: currentTime,
      });
    }
    // add more cases in future like when video ends
  };

  useEffect(() => {
    getAllLinks();
  
    // Check for existing user
    let storedUser = localStorage.getItem('watchTogetherUser');
  
    if (!storedUser) {
      // If no user is stored, generate a random one
      const randomUser = {
        firstName: `User${Math.floor(Math.random() * 10000)}`,
        lastName: ''
      };
      localStorage.setItem('watchTogetherUser', JSON.stringify(randomUser));
      storedUser = JSON.stringify(randomUser);
    }
  
    // Parse and use stored user
    const { firstName, lastName } = JSON.parse(storedUser);
    setFirstName(firstName);
    setLastName(lastName);
    setShowUserModal(false);
  
    socket.on('connect', () => {
      socket.emit('userJoined', { firstName, lastName });
    });
  
    socket.on('newUserJoined', (user) => {
      toast.info(`${user.firstName} ${user.lastName} has joined the room.`, { theme: 'dark' });
    });
  
    return () => {
      socket.off('newUserJoined');
      socket.off('connect');
    };
  }, []);
  
  useEffect(() => {
    const getVideoData = async () => {
      const data = await Promise.all(videoLinks.map(link => fetchVideoData(link.link)));
      setVideoData(data);
    };
  
    if (videoLinks.length > 0) {
      getVideoData();
  
      // Set default video
      if (!currentVideoId) {
        const firstVideoId = new URL(videoLinks[0].link).searchParams.get("v");
        setCurrentVideoId(firstVideoId);
        fetchComments(videoLinks[0]._id);
      }
    }

    socket.on('newComment', ({ linkId }) => {
      const currentLinkId = videoLinks.find(link => new URL(link.link).searchParams.get("v") === currentVideoId)?._id;
      if (linkId === currentLinkId) {
        fetchComments(linkId);
      }
    });
    return () => {
      socket.off('newComment'); // clean up
    };
  }, [videoLinks]);

  useEffect(() => {
    // Listen for play and pause events from other users
    socket.on('playVideo', ({ videoId, time }) => {
      if (videoId === currentVideoId && playerRef.current) {
        playerRef.current.seekTo(time, true);
        playerRef.current.playVideo();
      }
    });

    socket.on('pauseVideo', ({ videoId, time }) => {
      if (videoId === currentVideoId && playerRef.current) {
        playerRef.current.seekTo(time, true);
        playerRef.current.pauseVideo();
      }
    });

    return () => {
      socket.off('playVideo');
      socket.off('pauseVideo');
    };
  }, [currentVideoId]);
  
  return (
    <>
      <ToastContainer />
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
              <YouTube
                videoId={currentVideoId}
                opts={{
                  width: '100%',
                  height: '400',
                  playerVars: {
                    autoplay: 0,
                  },
                }}
                onEnd={() => {
                  const currentIndex = videoLinks.findIndex(link => new URL(link.link).searchParams.get("v") === currentVideoId);
                  const next = videoLinks[currentIndex + 1];
                  if (next) {
                    const nextId = new URL(next.link).searchParams.get("v");
                    setCurrentVideoId(nextId);
                    fetchComments(next._id);
                  }
                }}
              />

            ): (
              <div className="p-5 text-center border bg-body-tertiary mb-3 rounded shadow-lg">No Video Set Yet</div>
            )}
            {currentVideoId && (() => {
  const currentIndex = videoLinks.findIndex(link => {
    const videoId = new URL(link.link).searchParams.get("v");
    return videoId === currentVideoId;
  });
  const nextVideo = videoLinks[currentIndex + 1];
  const nextVideoData = videoData[currentIndex + 1];

  if (nextVideo && nextVideoData) {
    return (
      <>
        <h6 className='mt-4'>Up Next</h6>
        <Card className="mb-3 shadow-lg bg-body-tertiary">
          <Row className="g-0">
            <Col md={4}>
              <Card.Img
                src={nextVideoData.thumbnails?.maxres?.url || nextVideoData.thumbnails?.default?.url}
                className='img-fluid rounded-start'
              />
            </Col>
            <Col md={8}>
              <Card.Body>
                <Card.Title style={{ fontSize: '1rem' }}>{nextVideoData.localized.title}</Card.Title>
                <Card.Text>
                  <small className="text-muted">{nextVideoData.channelTitle}</small>
                </Card.Text>
                <Button
                  size="sm"
                  onClick={() => {
                    const nextId = new URL(nextVideo.link).searchParams.get("v");
                    setCurrentVideoId(nextId);
                    fetchComments(nextVideo._id);
                  }}
                >
                  <i className="bi bi-play-fill me-2"></i>Play Now
                </Button>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </>
    );
  }
  return null;
})()}
<h6 className='mt-4'>Queue ({videoLinks.length})</h6>
<Row className='g-2'>
  <AnimatePresence>
    {videoLinks.map((link, index) => {
      const video = videoData[index];
      if (!video) return null;

      return (
        <Col key={link._id} md={12}>
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card bg-body-tertiary shadow-lg mb-3"
          >
            <Row className='g-0'>
              <Col md={4}>
                <Card.Img
                  variant="top"
                  src={video.thumbnails?.maxres?.url || video.thumbnails?.default?.url}
                  className='img-fluid rounded-start'
                />
              </Col>
              <Col md={8}>
                <div className="card-body position-relative">
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link._id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      color: '#888'
                    }}
                    aria-label="Remove from queue"
                    title="Remove from queue"
                  >
                    &times;
                  </button>
                  <h6 className='mb-0 p-0'>{video.localized.title}</h6>
                  <small className='text-body-secondary'>{video.channelTitle}</small>
                  <div className="d-flex align-items-center mt-3">
                    <Button
                    className='me-3'
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
                    <Button
                        size='sm'
                        variant='warning'
                        onClick={() => {
                            setCurrentEditLink(link);
                            setEditedLink(link.link); 
                            setShowEditModal(true);
                        }}
                        >
                        Edit
                        </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </motion.div>
        </Col>
      );
    })}
  </AnimatePresence>
</Row>
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
    <Modal.Header closeButton>
        <Modal.Title>Edit Video Link</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <Form>
        <Form.Group controlId="editVideoLink">
            <Form.Label>Video URL</Form.Label>
            <Form.Control
            type="text"
            value={editedLink}
            onChange={(e) => setEditedLink(e.target.value)}
            />
        </Form.Group>
        </Form>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
        Cancel
        </Button>
        <Button
        variant="primary"
        onClick={() => {
            handleUpdateLink(currentEditLink._id, editedLink);
            setShowEditModal(false);
        }}
        >
        Save Changes
        </Button>
    </Modal.Footer>
    </Modal>

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
              <div className="new-comment  p-3 border-top bg-body-tertiary">
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

      <Modal show={showUserModal} backdrop="static" centered>
  <Modal.Header>
    <Modal.Title>Welcome to WatchTogether</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form onSubmit={handleUserSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>First Name</Form.Label>
        <Form.Control
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter first name"
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Last Name</Form.Label>
        <Form.Control
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter last name"
          required
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Enter Room
      </Button>
    </Form>
  </Modal.Body>
</Modal>
      
    </>
  );
}

export default Home;

