import { useEffect, useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Spinner, Form } from "react-bootstrap";
import UserContext from "../UserContext";

const API_BASE = "https://in-class-prototyping-api.onrender.com";
const POSTS_BASE = "/posts";

export default function PostComments() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext) || {}; // expecting { id, isAdmin } in your app
  const isAdmin = Boolean(user?.isAdmin);
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  // ---- load post (with comments) ----
  useEffect(() => {
    let keep = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}${POSTS_BASE}/${postId}`, {
          headers: { Accept: "application/json" }
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || `Failed to load post (${res.status})`);
        }
        const j = await res.json();
        if (keep) setPost(j);
      } catch (e) {
        if (keep) setErr(e.message || "Network error");
      } finally {
        if (keep) setLoading(false);
      }
    })();
    return () => { keep = false; };
  }, [postId]);

  // ---- add a comment (auth required) ----
  async function addComment() {
    if (!token) {
      setErr("Please log in to comment.");
      return;
    }
    if (!comment.trim()) return;

    try {
      setBusy(true);
      setErr("");
      const res = await fetch(`${API_BASE}${POSTS_BASE}/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: comment.trim() })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to add comment");
      // API returns the updated post; refresh local view
      setPost(j);
      setComment("");
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  // ---- admin-only: remove a comment ----
  async function removeComment(commentId) {
    if (!isAdmin) return;
    if (!window.confirm("Remove this comment?")) return;

    try {
      setBusy(true);
      setErr("");
      const res = await fetch(
        `${API_BASE}${POSTS_BASE}/${postId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to remove comment");
      setPost(j); // updated post
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
        <span className="ms-2">Loading…</span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{err}</div>
          <Button variant="outline-light" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Post & Comments</h1>
        <div>
          <Button className="me-2" variant="outline-secondary" onClick={() => navigate("/allPosts")}>
            ← All Posts
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title className="h5">{post.title}</Card.Title>
          <Card.Text className="text-muted small mb-2">
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
          </Card.Text>
          <Card.Text style={{ whiteSpace: "pre-wrap" }}>{post.blog}</Card.Text>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Body>
          <h2 className="h6">Add a comment</h2>
          {!token && (
            <div className="alert alert-warning py-2 mb-2">
              You must be logged in to comment.
            </div>
          )}
          <Form onSubmit={(e) => { e.preventDefault(); addComment(); }}>
            <Form.Group className="mb-2" controlId="comment">
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Write your comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!token || busy}
              />
            </Form.Group>
            <Button type="submit" disabled={!token || !comment.trim() || busy}>
              {busy ? "Posting…" : "Post Comment"}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h2 className="h6 mb-3">Comments</h2>
          {(!post.comments || post.comments.length === 0) ? (
            <p className="text-muted mb-0">No comments yet.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {post.comments.map((c) => (
                <li key={c._id} className="mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {c.comment}
                      {c.createdAt && (
                        <div className="text-muted small">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={busy}
                        onClick={() => removeComment(c._id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
