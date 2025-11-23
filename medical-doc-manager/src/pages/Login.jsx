// Styled version of user's Login component with warm yellow aesthetic
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
      } else {
        localStorage.setItem("token", data.token);
        setMessage("Login successful! Refreshing...");
        setTimeout(() => (window.location.href = "/"), 800);
      }
    } catch (err) {
      setMessage("Login failed.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://i.pinimg.com/1200x/a8/51/9c/a8519c8b104ef1f944063a0fcc0d59da.jpg')",
      }}
    >
      <div className="w-96 bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-yellow-300">
        <h2 className="text-3xl mb-5 font-extrabold text-center text-yellow-800 drop-shadow-sm">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border border-yellow-300 rounded-lg mb-4 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border border-yellow-300 rounded-lg mb-4 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-yellow-500 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-yellow-600 transition"
        >
          Login
        </button>

        <div className="text-center mt-5">
          <p className="text-yellow-800">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-yellow-700 font-bold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>

        <div className="text-center mt-5 bg-yellow-100 p-4 rounded-xl border border-yellow-300 shadow-inner">
          <p className="text-yellow-800 text-sm font-semibold">Demo Account:</p>
          <p className="text-yellow-700 text-sm">
            Email: <span className="font-mono">test@user.com</span>
          </p>
          <p className="text-yellow-700 text-sm">
            Password: <span className="font-mono">mypassword123</span>
          </p>
        </div>

        {message && (
          <p className="text-center mt-4 text-red-500 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
