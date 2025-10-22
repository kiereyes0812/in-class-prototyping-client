import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {UserProvider} from './UserContext';
import "bootstrap/dist/css/bootstrap.min.css";

import AppNavbar from './components/AppNavbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AllPosts from './pages/AllPost';
import AddPost from './pages/AddPost';
import PostComments from './pages/PostComments';
import AdminModeration from "./pages/AdminModeration";

function App() {

    const [user, setUser] = useState({ id: null, isAdmin: false });

    const unsetUser = () => {

      localStorage.clear();

    };

    useEffect(() => {

    fetch(`https://in-class-prototyping-api.onrender.com/users/details`, {
      headers: {
        Authorization: `Bearer ${ localStorage.getItem('token') }`
      }
    })
    .then(res => res.json())
    .then(data => {
    if (data && data._id) {
      setUser({ 
        id: data._id,
        isAdmin: Boolean(data.isAdmin) || data.role === 'admin'
      });
    } else {
      setUser({ id: null, isAdmin: false });
    }
    })
     .catch(error => {
            // This runs if the fetch fails (e.g., server down, network offline, CORS)
            console.error("Failed to fetch user details on App load:", error);
            setUser({ id: null, isAdmin: false }); // Ensure user is logged out on failure
        });

    }, []);

  return (
    <UserProvider value={{user, setUser, unsetUser}}>
      <Router>
        <Container>
          <AppNavbar />
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/allPosts" element={<AllPosts />} />
            <Route path="/addPost"  element={<AddPost  />} />
            <Route path="/posts/:postId/comments" element={<PostComments />} />
            <Route path="/admin/moderation" element={<AdminModeration />} />
          </Routes>
        </Container>
      </Router>
    </UserProvider>
  );
}


export default App;