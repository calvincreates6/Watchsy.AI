import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "react-phone-input-2/lib/style.css";
import websiteLogo from "../assets/watchsy.jpg";
import "../App.css";
import eye from "../assets/eye.png";
import hide from "../assets/hiding eyes monkey.png";
import star from "../assets/star.png";
import videoReel from "../assets/video reel.png";
import checkList from "../assets/checklist.png";
import { useToast } from "./ToastProvider";
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
import loginPageImage from "../assets/Movie-login-bg.jpg";

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
  const toast = useToast();

  const getAuthErrorMessage = (error) => {
    const code = (error && error.code) || "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "No account found for that email.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled.";
      default:
        return "Something went wrong. Please try again.";
    }
  };
  // Auto logout timer
  useEffect(() => {
    let timerId;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        // 24 hours in ms
        const DURATION = 24 * 60 * 60 * 1000;
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(async () => {
          try {
            await auth.signOut();
            if (toast && typeof toast.info === 'function') toast.info('You were signed out for security. Please sign in again.');
            navigate('/login');
          } catch (_) {}
        }, DURATION);
      } else {
        if (timerId) { clearTimeout(timerId); timerId = undefined; }
      }
    });
    return () => { if (timerId) clearTimeout(timerId); unsub && unsub(); };
  }, [navigate, toast]);

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
        
        try { if (toast && typeof toast.success === 'function') toast.success('Welcome back!'); } catch(_) {}
        setTimeout(() => {
          navigate("/", { state: { name: user.email, id: user.uid } });
        }, 300);
      } catch (error) {
        const msg = getAuthErrorMessage(error);
        try { if (toast && typeof toast.error === 'function') toast.error(msg); } catch(_) {}
        setError("");
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
        
        try { if (toast && typeof toast.success === 'function') toast.success('Account created!'); } catch(_) {}
        setTimeout(() => {
          navigate("/", { state: { name: user.email, id: user.uid } });
        }, 300);
      } catch (error) {
        const msg = getAuthErrorMessage(error);
        try { if (toast && typeof toast.error === 'function') toast.error(msg); } catch(_) {}
        setError("");
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
          
          try { if (toast && typeof toast.success === 'function') toast.success('Signed in with Google'); } catch(_) {}
          setTimeout(() => {
            navigate("/", { state: userData });
          }, 300);
        } else {
          navigate("/login");
          setIsLoading(false);
        }
      });
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      try { if (toast && typeof toast.error === 'function') toast.error(msg); } catch(_) {}
      setError("");
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
      const msg = getAuthErrorMessage(error);
      try { if (toast && typeof toast.error === 'function') toast.error(msg); } catch(_) {}
      setError("");
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
          
          <div style={styles.bgImage}></div>
          <div style={styles.gradientOverlay}></div>
          <div style={styles.vignetteOverlay}></div>
        </div>
        {/* Main Container */}
        <div className="login-page" style={styles.loginPage}>
        <div className="login-container" style={styles.outerContainer}>
        <div className="textGrid" style={styles.textGrid}>
          <h1 style={styles.textGridTitle} className="content-title">
            Discover with <br /><span style={styles.titleHighlight}>Watchsy AI</span>
          </h1>
          <p style={styles.textGridSubtitle} className="content-body">
            Smart recommendations based on your liked movies. Track, share and find where to watch.
          </p>
          <div style={styles.featuresRow}>
            <div style={styles.featureItem}>
              <img src={star} alt="AI Picks" style={styles.featureIcon} />
              <span>AI picks you'll love</span>
            </div>
            <div style={styles.featureItem}>
              <img src={videoReel} alt="Trailers" style={styles.featureIcon} />
              <span>Trailers & Cast</span>
            </div>
            <div style={styles.featureItem}>
              <img src={checkList} alt="Save and Share your favorite movies" style={styles.featureIcon} />
              <span>Save and Share your favorite movies</span>
            </div>
          </div>
        </div>
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

                  {/* Errors are shown via toast popups */}

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
    </div>
  );
};

const styles = {
  loginPage: {},
  pageWrapper: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "transparent",
  },
  backgroundContainer: { 
    position: "fixed", 
    top: 0, 
    left: 0, 
    width: "100%", 
    height: "100%", 
    zIndex: 0, 
    overflow: "hidden" 
  },
  bgImage: {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${loginPageImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    // filter: "saturate(1.08) contrast(1.06) brightness(0.9)",
    transform: "scaleX(-1.02)",
  },
  gradientOverlay: { 
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, rgba(24, 28, 36, 0.6) 0%, rgba(35, 43, 59, 0) 50%, rgba(51, 58, 77, 0) 100%)",
    pointerEvents: "none",
  },
  vignetteOverlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
    pointerEvents: "none",
  },
  outerContainer: { 
    display: "flex", 
    justifyContent: "right", 
    alignItems: "center", 
    minHeight: "100vh", 
    padding: "20px",
    position: "relative",
    zIndex: 1,
  },
  textGrid: {
    position: "absolute",
    left: "32px",
    bottom: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    gap: "8px",
    maxWidth: "520px",
    padding: "14px 18px",
    color: "#f5f6fa",
    background: "linear-gradient(90deg, rgba(36, 100, 202, 0.3), rgba(0,0,0,0.25))",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "16px",
    backdropFilter: "blur(4px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  textGridTitle: {
    margin: 0,
    fontSize: "40px",
    lineHeight: 1.15,
    fontWeight: 800,
  },
  titleHighlight: {
    background: "linear-gradient(135deg, #ff0088 0%, #00b3ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  textGridSubtitle: {
    margin: "4px 0 8px 0",
    color: "#e6edf6",
    fontSize: "16px",
    opacity: 0.95,
  },
  featuresRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  featureItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "20px",
    padding: "8px 12px",
    fontWeight: 600,
    fontSize: "14px",
  },
  featureIcon: {
    width: "18px",
    height: "18px",
  },
  container: { 
    background: "linear-gradient(90deg, rgba(240, 200, 200, 0.7) 0%, rgba(0,0,0,0.25) 100%)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    // border: "1px solid rgba(255, 217, 61, 0.2)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    right: "30",
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
    fontSize: "20px",
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
    border: "2px solid rgb(255, 217, 61, 0.5)",
    background: "rgba(95, 48, 10, 0.8)",
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
    borderRadius: "28px",
    border: "2px solid rgb(255, 217, 61, 0.5)",
    fontSize: "16px",
    background: "rgba(95, 48, 10, 0.75)",
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
