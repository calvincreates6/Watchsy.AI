import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "react-phone-input-2/lib/style.css";
import ParticlesComponent from "../assets/particles";
import websiteLogo from "../assets/websiteLogo2.jpg"
import "../App.css";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  getAuth, createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

let hiddenEmail = true;
let temp = null;
const Login = () => {



  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  let googleprovider = new GoogleAuthProvider();

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       // console.log("User is already logged in:", user.uid);
  //       navigate("/", { state: { id: user.uid, name: user.email || "User" } });
  //     }
  //   });

  //   return () => unsubscribe(); // Cleanup listener
  // }, [navigate]);

  function hideEmail() {
    console.log("Clicked!!");
    if (hiddenEmail === true) {
      hiddenEmail = false;
      document.getElementById("email-form").style.visibility = "visible";
      document.getElementById("google").remove();
      document.getElementById("email").remove();
      document.getElementById("container0").style.height="410px";
      document.getElementById("container").style.height="400px";


    }
  }

  const googleHandleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      await signInWithPopup(auth, googleprovider);
  
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const userId = user.uid;
          temp = userId;
          let emailU = user.email || "No Email Provided"; // Ensure email is available
  
          const userData = { name: emailU, id: userId };
          console.log("User ID:", userId);
          console.log("User Email:", emailU); // Log email for debugging
  
          navigate("/", { state: userData });
        } else {
          console.log("User is not signed in");
          navigate("/login"); // Redirect if authentication fails
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };
  
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     if(!isSignUp)
//     {
//     onAuthStateChanged(auth, (user) => {
//       if (user) {
//         const userId = user.uid;
//         temp = userId;
//         let emailU = user.email; // declare emailU
//         if (!emailU) {
//           emailU = "No Email Provided"; // Handle case where email is not available
//         }
    
//         const userData = { name: emailU, id: userId };
//         console.log("User ID:", userId);
//         console.log("User Email:", emailU); // Log email for debugging
//         navigate("/", { state: userData });
//       } else {
//         console.log("User is not signed in");
//         // Consider redirecting to a login page instead.
//         navigate("/login");  // Or another appropriate route
//       }
//     });
//   } else{
//     const auth = getAuth();
// const signupForm = document.getElementById('email-form');

// signupForm.addEventListener('submit', (e) => {
//   e.preventDefault();

//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;

//   createUserWithEmailAndPassword(auth, email, password)
//     .then((userCredential) => {
//       // Signed in 
//       const user = userCredential.user;
//       console.log("User created successfully:", user.uid);
//       // Redirect to your app's main page or display a success message
//       window.location.href = "/dashboard"; // Replace with your dashboard URL
//     })
//     .catch((error) => {
//       const errorCode = error.code;
//       const errorMessage = error.message;
//       console.error("Error creating user:", errorCode, errorMessage);
//       // Display an error message to the user
//       alert("Signup failed: " + errorMessage);
//     });
// });
//   }
//   };

const handleLogin = async (e) => {
  e.preventDefault();
  const auth = getAuth();

  if (!isSignUp) {
    // Login Flow
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User logged in:", user.uid);
      
      // Navigate to homepage with user data
      navigate("/", { state: { name: user.email, id: user.uid } });
    } catch (error) {
      console.error("Login failed:", error.code, error.message);
      setError("Login failed: " + error.message);
    }
  } else {
    // Sign-up Flow
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully:", user.uid);
      
      // Navigate to homepage or dashboard after sign-up
      navigate("/", { state: { name: user.email, id: user.uid } });
    } catch (error) {
      console.error("Signup failed:", error.code, error.message);
      setError("Signup failed: " + error.message);
    }
  }
};


  const [isSignUp, setIsSignUp] = useState(false);

  const btnSwap = () => {
    console.log("Clicked!!");
    setIsSignUp(true); // Change state to swap button
  };
  // const signUpButton = document.querySelector(".signUp");
  // const submitContainer = document.querySelector("#submit");
  // function btnSwap () {
  //   console.log("Clicked!!");
  //     const newButton = document.createElement("button");
  //     newButton.id = "signUpSubmit";
  //     newButton.type = "submit";
  //     newButton.textContent = "Sign Up";
  //     newButton.style.cssText = "background-color: white; color: white; padding: 10px; border: none; cursor: pointer; z-index: 2";
  //     newButton.innerText = "signup";
  //     // Replace existing content inside #submit
  //     document.querySelector("form").removeChild(submitContainer);
  //     // submitContainer.innerHTML = "";  // Clear previous content
  //     document.querySelector("form").appendChild(newButton);
  // }
  

  return (
    <div>
      <ParticlesComponent id="particles" style={styles.particle}/>
      <div id="container0">
    <div id="container" style={styles.container}>
    <img src={websiteLogo} alt="Website Name The Chosen" height="100px"  />

      <h2 style={styles.heading}>Login</h2>
      {/* {error && <p style={styles.error}>{error}</p>} */}
      <span><button id="email" type="submit" onClick={hideEmail} style={styles.google}>
        Email
      </button>
      </span>
      {/* <hr color="black"></hr> */}
      <span>
      <button id="google" type="submit" onClick={googleHandleLogin} style={styles.google}>
        <span>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          class="LgbsSe-Bz112c"
          width="13px"
          height="13px"
        >
          <g>
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </g>
        </svg>
        <span> Sign up with Google </span>
        </span>
      </button>
      </span>

      {/* <form id="email-form" onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button id="submit" type="submit" style={styles.submit}>
          Login
        </button>
        <a className="signUp" onClick={btnSwap}  >No account? Sign up now</a>
      </form> */}
       <form id="email-form" onSubmit={handleLogin} style={styles.form}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={styles.input}
      />
      {error && <p style={styles.error}>{error}</p>}

      <button id="submit" type="submit" style={styles.submit}>
        {isSignUp ? "Sign Up" : "Login"}
      </button>

      {!isSignUp && (
        <a className="signUp" onClick={btnSwap} style={styles.signUpLink}>
          No account? Sign up now
        </a>
      )}
    </form>
      {/* {error && <p style={styles.error}>{error}</p>} */}
    </div>
    </div>
    </div>
  );
};

const styles = {
  heading: {
    margin: "6px",
    color: "white",
    fontSize: "25px",
  },
 container: {
    width: "300px",
    height: "300px",
    // margin: "5px auto",
    textAlign: "center",
    padding: "20px",
    position: "relative",  // Ensure it stays above
    zIndex: "1",           // Higher than particles (-2)
    background: "black",
// background: "linear-gradient(126deg, rgba(17,17,17,1) 30%, rgba(69,90,100,1) 35%, rgba(120,144,156,1) 55%, rgba(176,190,197,1) 74%, rgba(255,255,255,1) 94%)",
},
  form: {
    display: "flex",
    flexDirection: "column",
    visibility: "hidden",
  },
  input: {
    width: "75%",
    padding: "10px",
    margin: "10px 0",
    border: "1px solid #ccc",
    borderRadius: "20px",
    font: "GoogleFont",
  },
  submit: {
    font: "Trebuchet MS",
    margin: "6px",
    padding: "10px",
    backgroundColor: "#78909c",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    width: "80%",
  },
  num: {
    width: "80%",
    borderRadius: "25px",
  },
google: {
  marginTop: "8px",
    padding: "10px",
    font: "Google Sans",
    fontSize: "16px",
    width: "80%",
    backgroundColor: "white",
    color: "grey",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
  },
  particle: {
    zIndex: "-2", // Move further behind
    height: "100%", 
    width: "100%",
    position: "fixed", // Ensure it covers the entire background
    top: "0",
    left: "0",
},

  error: {
    marginTop: "3px",
    color: "red",
    fontSize: "12px",
  },
};

export default Login;
