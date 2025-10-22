import { useContext, useEffect, useMemo, useState } from "react";
import { Card, Button, Spinner, Collapse } from "react-bootstrap";
import UserContext from "../UserContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://in-class-prototyping-api.onrender.com";
const POSTS_BASE = "/posts"; // server mounts post routes at /posts

export default function AdminModeration() {
  const { user } = useContext(UserContext) || {};
  const isAdmin = Boolean(user?.isAdmin);
  const token = useMemo(() => localStorage.getItem("token"), []);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(new Set()); // expanded rows
  const [busyId, setBusyId] = useState("");    // to disable buttons while acting

  // --- guard (client-side) ---
  useEffect(() => {
    if (!isAdmin) navigate("/allPosts", { replace: true });
  }, [isAdmin, navigate]);

  // --- load all posts ---
  useEffect(() => {
    let keep = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}${POSTS_BASE}/allPosts`);
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

  const toggle = (id) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- Admin actions ---
  async function deletePost(postId) {
    if (!window.confirm("Delete this post?")) return;
    try {
      setBusyId(postId);
      const res = await fetch(`${API_BASE}${POSTS_BASE}/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to delete post");
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusyId("");
    }
  }

  async function deleteComment(postId, commentId) {
    if (!window.confirm("Remove this comment?")) return;
    try {
      setBusyId(`${postId}:${commentId}`);
      const res = await fetch(`${API_BASE}${POSTS_BASE}/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to remove comment");

      // server returns updated post; merge it
      setPosts(prev => prev.map(p => (p._id === j._id ? j : p)));
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setBusyId("");
    }
  }

  if (!isAdmin) return null; // brief flash guard

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
        <span className="ms-2">Loading…</span>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Admin Moderation</h1>
        <Button variant="outline-secondary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      {posts.length === 0 ? (
        <p className="text-muted">No posts found.</p>
      ) : (
        <div className="row g-3">
          {posts.map((p) => (
            <div className="col-12" key={p._id}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="me-3">
                      <div className="h5 mb-1">{p.title}</div>
                      <div className="text-muted small mb-2">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busyId === p._id}
                        onClick={() => deletePost(p._id)}
                      >
                        Delete Post
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => toggle(p._id)}
                        aria-controls={`post-${p._id}`}
                        aria-expanded={open.has(p._id)}
                      >
                        {open.has(p._id) ? "Hide" : "Details"}
                      </Button>
                    </div>
                  </div>

                  <Collapse in={open.has(p._id)}>
                    <div id={`post-${p._id}`} className="mt-3">
                      <div className="mb-3" style={{ whiteSpace: "pre-wrap" }}>{p.blog}</div>

                      <div className="fw-semibold mb-2">Comments</div>
                      {(!p.comments || p.comments.length === 0) ? (
                        <div className="text-muted">No comments.</div>
                      ) : (
                        <ul className="list-unstyled mb-0">
                          {p.comments.map((c) => (
                            <li key={c._id} className="border rounded p-2 mb-2">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <div style={{ whiteSpace: "pre-wrap" }}>{c.comment}</div>
                                  {c.createdAt && (
                                    <div className="text-muted small">
                                      {new Date(c.createdAt).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  disabled={busyId === `${p._id}:${c._id}`}
                                  onClick={() => deleteComment(p._id, c._id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Collapse>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
