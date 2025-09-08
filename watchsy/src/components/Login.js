import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "react-phone-input-2/lib/style.css";
import websiteLogo from "../assets/watchsy.jpg";
import "../App.css";
import eye from "../assets/eye.png";
import hide from "../assets/hiding eyes monkey.png";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  getAuth,
  createUserWithEmailAndPassword,
  TwitterAuthProvider,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const googleprovider = new GoogleAuthProvider();
  const twitterProvider = new TwitterAuthProvider();

  const showEmailFormHandler = () => setShowEmailForm(true);
  


  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const authInstance = getAuth();

    if (!isSignUp) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          authInstance,
          email,
          password
        );
        const user = userCredential.user;
        
        // Add smooth transition effect
        document.body.style.transition = "background-color 0.8s ease";
        document.body.style.backgroundColor = "#181c24";
        
        setTimeout(() => {
          navigate("/", { state: { name: user.email, id: user.uid } });
        }, 300);
      } catch (error) {
        setError("Login failed: " + error.message);
        setIsLoading(false);
      }
    } else {
      // Validate passwords match for signup
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please try again.");
        setIsLoading(false);
        return;
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(
          authInstance,
          email,
          password
        );
        const user = userCredential.user;
        
        // Add smooth transition effect
        document.body.style.transition = "background-color 0.8s ease";
        document.body.style.backgroundColor = "#181c24";
        
        setTimeout(() => {
          navigate("/", { state: { name: user.email, id: user.uid } });
        }, 300);
      } catch (error) {
        setError("Signup failed: " + error.message);
        setIsLoading(false);
      }
    }
  };

  const googleHandleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleprovider);
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const userData = { name: user.email, id: user.uid };
          
          // Add smooth transition effect
          document.body.style.transition = "background-color 0.8s ease";
          document.body.style.backgroundColor = "#181c24";
          
          setTimeout(() => {
            navigate("/", { state: userData });
          }, 300);
        } else {
          navigate("/login");
          setIsLoading(false);
        }
      });
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const twitterHandleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, twitterProvider);
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const userData = { name: user.email, id: user.uid };
          navigate("/", { state: userData });
        }
      });
    } catch (error) {
      setError("Twitter login failed: " + error.message);
      setIsLoading(false);
    }
  };

  const btnSwap = () => {
    setIsSignUp(!isSignUp);
    setConfirmPassword(""); // Clear confirm password when switching modes
    setError(""); // Clear any previous errors
  };

  const goBack = () => {
    setShowEmailForm(false);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div>
      {/* Inline CSS animations */}
      <style>
        {`
          @keyframes gradientShift { ... } 
          @keyframes floatingPattern { ... } 
          @keyframes shimmer { ... } 
          /* your CSS animations kept same */
        `}
      </style>

      <div style={styles.pageWrapper}>
        {/* Background */}
        <div style={styles.backgroundContainer}>
          <div style={styles.gradientOverlay}></div>
          <div style={styles.patternOverlay}></div>
        </div>

        {/* Main Container */}
        <div style={styles.outerContainer}>
          <div style={styles.container}>
            {/* Logo */}
            <div style={styles.logoContainer}>
              <img
                src={websiteLogo}
                alt="Website Logo"
                style={styles.logo}
                className="logo-shimmer"
              />
            </div>

            <h2 style={styles.heading} className="content-title">
              {showEmailForm
                ? isSignUp
                  ? "Create Account"
                  : "Sign In"
                : "Welcome to Watchsy"}
            </h2>

            {!showEmailForm ? (
              <div style={styles.buttonContainer}>
                
                <button
                  type="button"
                  onClick={showEmailFormHandler}
                  style={styles.emailBtn}
                  className="email-btn"
                >
                  Continue with Email
                </button>

                <button
                  type="button"
                  onClick={googleHandleLogin}
                  style={styles.googleBtn}
                  className="google-btn"
                  disabled={isLoading}
                >
                  {/* Google SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48">
<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
</svg>
                  {isLoading ? "Loading..." : "Sign in with Google"}
                </button>
                <button
                  type="button"
                  onClick={twitterHandleLogin}
                  style={styles.googleBtn}
                  className="google-btn"
                  disabled={isLoading}
                >
                  {/* Twitter SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="26" height="26" viewBox="0 0 48 48">
<path fill="#03A9F4" d="M42,12.429c-1.323,0.586-2.746,0.977-4.247,1.162c1.526-0.906,2.7-2.351,3.251-4.058c-1.428,0.837-3.01,1.452-4.693,1.776C34.967,9.884,33.05,9,30.926,9c-4.08,0-7.387,3.278-7.387,7.32c0,0.572,0.067,1.129,0.193,1.67c-6.138-0.308-11.582-3.226-15.224-7.654c-0.64,1.082-1,2.349-1,3.686c0,2.541,1.301,4.778,3.285,6.096c-1.211-0.037-2.351-0.374-3.349-0.914c0,0.022,0,0.055,0,0.086c0,3.551,2.547,6.508,5.923,7.181c-0.617,0.169-1.269,0.263-1.941,0.263c-0.477,0-0.942-0.054-1.392-0.135c0.94,2.902,3.667,5.023,6.898,5.086c-2.528,1.96-5.712,3.134-9.174,3.134c-0.598,0-1.183-0.034-1.761-0.104C9.268,36.786,13.152,38,17.321,38c13.585,0,21.017-11.156,21.017-20.834c0-0.317-0.01-0.633-0.025-0.945C39.763,15.197,41.013,13.905,42,12.429"></path>
</svg>
                  {isLoading ? "Loading..." : "Sign in with Twitter"}
                </button>
              </div>
            ) : (
              <div style={styles.formContainer}>
                <form onSubmit={handleLogin} style={styles.form}>
                  <div style={styles.inputContainer}>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={styles.input}
                      className="input-focus form-input"
                      aria-label="Email address"
                      autoComplete="email"
                    />
                  </div>

                  <div style={styles.inputContainer}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={styles.input}
                      className="input-focus form-input"
                      aria-label="Password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      style={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="password-toggle"
                    >
                      <img src={showPassword ? hide : eye} alt="Toggle password" style={{ width: "25px", height: "25px" }} />
                    </button>
                  </div>

                  {isSignUp && (
                    <div style={styles.inputContainer}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={isSignUp}
                        style={styles.input}
                        className="input-focus form-input"
                        aria-label="Confirm password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        style={styles.passwordToggle}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        className="password-toggle"
                      >
                        <img src={showConfirmPassword ? hide : eye} alt="Toggle confirm password" style={{ width: "25px", height: "25px" }} />
                      </button>
                    </div>
                  )}

                  {error && <div style={styles.error}>{error}</div>}

                  <button
                    type="submit"
                    style={styles.submitBtn}
                    className="submit-btn"
                    disabled={!email.trim() || !password.trim() || (isSignUp && !confirmPassword.trim()) || isLoading}
                  >
                    {isLoading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
                  </button>

                  <div style={styles.linkContainer}>
                    {!isSignUp ? (
                      <button
                        type="button"
                        onClick={btnSwap}
                        style={styles.textLink}
                        className="text-link accent-text"
                      >
                        Don't have an account? Sign up
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        style={styles.textLink}
                        className="text-link accent-text"
                      >
                        Already have an account? Sign in
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={goBack}
                      style={styles.textLink}
                      className="text-link accent-text"
                    >
                      Back to options
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #181c24 0%, #232b3b 50%, #333a4d 100%)",
  },
  backgroundContainer: { 
    position: "fixed", 
    top: 0, 
    left: 0, 
    width: "100%", 
    height: "100%", 
    zIndex: -1, 
    overflow: "hidden" 
  },
  gradientOverlay: { 
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, rgba(24, 28, 36, 0.9) 0%, rgba(35, 43, 59, 0.8) 50%, rgba(51, 58, 77, 0.9) 100%)",
  },
  patternOverlay: { 
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255, 217, 61, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 217, 61, 0.1) 0%, transparent 50%)",
    animation: "floatingPattern 20s ease-in-out infinite",
  },
  outerContainer: { 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    minHeight: "100vh", 
    padding: "20px",
    position: "relative",
    zIndex: 1,
  },
  container: { 
    background: "rgba(35, 43, 59, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 217, 61, 0.2)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  logoContainer: { 
    marginBottom: "24px",
    display: "flex",
    justifyContent: "center",
  },
  logo: { 
    width: "80px", 
    height: "80px", 
    borderRadius: "16px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
  },
  brandName: { 
    fontSize: "36px", 
    fontWeight: "800",
    color: "#f5f6fa",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  tagline: { 
    fontSize: "16px",
    color: "#b8c5d6",
    margin: "0 0 32px 0",
    fontWeight: "500",
  },
  heading: { 
    fontSize: "28px",
    fontWeight: "700",
    color: "#f5f6fa",
    margin: "0 0 32px 0",
  },
  buttonContainer: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "16px",
    marginBottom: "24px",
  },
  emailBtn: { 
    padding: "16px 24px", 
    borderRadius: "50px",
    border: "none",
    background: "linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%)",
    color: "#181c24",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(255, 217, 61, 0.3)",
  },
  googleBtn: { 
    padding: "16px 24px", 
    borderRadius: "50px",
    border: "2px solid #333a4d",
    background: "rgba(35, 43, 59, 0.8)",
    color: "#f5f6fa",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  formContainer: { 
    width: "100%",
    marginTop: "8px",
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "20px",
    width: "100%",
  },
  inputContainer: { 
    position: "relative", 
    width: "100%",
  },
  input: { 
    width: "100%",
    padding: "18px 20px", 
    borderRadius: "16px",
    border: "2px solid #333a4d",
    fontSize: "16px",
    background: "rgba(24, 28, 36, 0.8)",
    color: "#f5f6fa",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
  },
  passwordToggle: { 
    position: "absolute", 
    right: "20px", 
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "18px",
    userSelect: "none",
    transition: "opacity 0.3s ease",
    border: "2px solid #333a4d",
    borderRadius: "50%",
    padding: "3px 4px",
  },
  submitBtn: { 
    padding: "18px 24px", 
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #ffd93d 0%, #ff6b6b 100%)",
    color: "#181c24",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(255, 217, 61, 0.3)",
    marginTop: "8px",
  },
  linkContainer: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "12px",
    marginTop: "16px",
  },
  textLink: { 
    border: "none", 
    background: "none",
    color: "#ffd93d",
    fontSize: "14px",
    cursor: "pointer",
    transition: "color 0.3s ease",
    textDecoration: "underline",
    padding: "4px 0",
  },
  error: { 
    color: "#ff6b6b",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "center",
    padding: "8px 12px",
    background: "rgba(255, 107, 107, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 107, 107, 0.2)",
  },
};

export default Login;
