import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      const response = await axios.post("https://fsp-1-assignment-backend-plum.vercel.app/auth/signup", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setMessage(response.data.message || "Account created successfully!");
      setMessageType("success");

      // Clear the form after successful signup
      setName("");
      setEmail("");
      setPassword("");

      // Navigate to Login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);

      setMessage(
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again.",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="text-center mb-4">Workasana Signup</h2>

        <form onSubmit={handleSignup}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>

            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="signup-email" className="form-label">
              Email
            </label>

            <input
              type="email"
              id="signup-email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>

            <input
              type="password"
              id="signup-password"
              className="form-control"
              placeholder="Create a password (minimum 8 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          {message && (
            <div
              className={`alert ${
                messageType === "success" ? "alert-success" : "alert-danger"
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
