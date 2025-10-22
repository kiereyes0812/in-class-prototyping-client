import { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";
const POSTS_BASE = "/posts"; // because app.use("/posts", postRoutes)

export default function AddPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [blog, setBlog] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = title.trim() && blog.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setErr("Please log in first.");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      const res = await fetch(`${API_BASE}${POSTS_BASE}/addPost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // verify middleware needs this
        },
        body: JSON.stringify({
          title: title.trim(),
          blog: blog.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `Failed to add post (${res.status})`);
      }

      // Success → go back to all posts
      navigate("/allPosts", { replace: true });
    } catch (e) {
      setErr(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-3">Add Post</h1>

      {err && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{err}</div>
          <Button variant="outline-light" size="sm" onClick={() => setErr("")}>
            Dismiss
          </Button>
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="postTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            maxLength={200}
            placeholder="Enter a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="form-text">{title.trim().length}/200</div>
        </Form.Group>

        <Form.Group className="mb-4" controlId="postBody">
          <Form.Label>Content</Form.Label>
          <Form.Control
            as="textarea"
            rows={8}
            placeholder="Write your post…"
            value={blog}
            onChange={(e) => setBlog(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={!canSubmit || loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Publish"}
        </Button>
        <Button
          type="button"
          className="ms-2"
          variant="secondary"
          onClick={() => navigate("/allPosts")}
        >
          Cancel
        </Button>
      </Form>
    </div>
  );
}
