import { useEffect, useMemo, useState, useContext } from "react";
import { Card, Button, Spinner, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import UserContext from "../UserContext"; // assumes you store user + isAdmin after login

const API_BASE = "https://in-class-prototyping-api.onrender.com";
const POSTS_BASE = "/posts"; // because server mounts postRoutes at /posts

export default function AllPosts() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext) || {}; // expect { id, isAdmin } or similar
  const isAdmin = Boolean(user?.isAdmin); // UI-only guard; server still enforces verifyAdmin

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // UI state for expand/collapse per post
  const [expanded, setExpanded] = useState(() => new Set());

  // Comment modal state
  const [showModal, setShowModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    let keep = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}${POSTS_BASE}/allPosts`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || `Failed to load posts (${res.status})`);
        }
        const j = await res.json();
        if (keep) setPosts(Array.isArray(j) ? j : []);
      } catch (e) {
        if (keep) setErr(e.message || "Network error");
      } finally {
        if (keep) setLoading(false);
      }
    })();
    return () => { keep = false; };
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openComment = (postId) => {
    setActivePostId(postId);
    setCommentText("");
    setShowModal(true);
  };

  const submitComment = async () => {
    if (!token) {
      setErr("Please log in to comment.");
      setShowModal(false);
      return;
    }
    if (!commentText.trim()) return;

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}${POSTS_BASE}/${activePostId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // required by verify middleware
        },
        body: JSON.stringify({ comment: commentText.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to add comment");

      // server returns updated post; merge it into local state
      setPosts(prev => prev.map(p => (p._id === j._id ? j : p)));
      setShowModal(false);
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusy(false);
    }
  };

  // Admin: delete post
  const deletePost = async (postId) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this post?")) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}${POSTS_BASE}/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to delete post");
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusy(false);
    }
  };

  // Admin: remove comment
  const removeComment = async (postId, commentId) => {
    if (!isAdmin) return;
    if (!window.confirm("Remove this comment?")) return;
    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}${POSTS_BASE}/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to remove comment");
      setPosts(prev => prev.map(p => (p._id === j._id ? j : p)));
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading posts…</span>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">All Posts</h1>
        <div>
          <Button variant="outline-secondary" className="me-2" onClick={() => navigate("/addPost")}>
            New Post
          </Button>
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <div className="row g-3">
          {posts.map((p) => {
            const isLong = (p.blog || "").length > 400;
            const showFull = expanded.has(p._id);
            const displayText = showFull || !isLong ? p.blog : `${p.blog.slice(0, 400)}…`;

            return (
              <div className="col-12 col-md-6 col-lg-4" key={p._id}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title className="h5">{p.title}</Card.Title>
                    <Card.Text className="text-muted small mb-2">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                    </Card.Text>
                    <Card.Text style={{ whiteSpace: "pre-wrap" }}>
                      {displayText}
                    </Card.Text>

                    {isLong && (
                      <Button
                        size="sm"
                        variant="link"
                        className="px-0"
                        onClick={() => toggleExpand(p._id)}
                      >
                        {showFull ? "View less" : "View more"}
                      </Button>
                    )}

                    <div className="d-flex gap-2 mt-2">
                      <Button size="sm" onClick={() => openComment(p._id)}>
                        Add Comment
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => deletePost(p._id)}
                        >
                          Delete Post
                        </Button>
                      )}
                    </div>
                  </Card.Body>

                  {Array.isArray(p.comments) && p.comments.length > 0 && (
                    <Card.Footer className="bg-light">
                      <div className="fw-semibold mb-2">Comments</div>
                      <ul className="list-unstyled mb-0">
                        {p.comments.map((c) => (
                          <li key={c._id} className="mb-2">
                            <div className="d-flex justify-content-between">
                              <div style={{ whiteSpace: "pre-wrap" }}>{c.comment}</div>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  disabled={busy}
                                  onClick={() => removeComment(p._id, c._id)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card.Footer>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!token && (
            <div className="alert alert-warning">You must be logged in to comment.</div>
          )}
          <Form>
            <Form.Group controlId="commentText">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment…"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!commentText.trim() || !token || busy} onClick={submitComment}>
            {busy ? "Posting..." : "Post Comment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
