import { useContext, useEffect, useState } from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import UserContext from "../UserContext";

export default function AppNavbar() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext) || {};
  const [isAuthed, setIsAuthed] = useState(false);

  // consider logged in if we have user or a token in localStorage
  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    setIsAuthed(!!user?.id || hasToken);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser && setUser(null); // clear context if available
    navigate("/login", { replace: true });
  };

  return (
    <Navbar bg="light" expand="md" className="shadow-sm">
      <Container>
        <Navbar.Brand
          onClick={() => navigate("/")}
          role="button"
          className="fw-semibold"
        >
          Blog App
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/allPosts">
              View All Posts
            </Nav.Link>
          </Nav>

          {!isAuthed ? (
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="primary" onClick={() => navigate("/register")}>
                Register
              </Button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Button variant="outline-danger" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
