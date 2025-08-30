import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCv2K2fdY9IiLmrbe-Y5LxMs7nJlYS9Y1M",
    authDomain: "decision-maker-2957b.firebaseapp.com",
    projectId: "decision-maker-2957b",
    storageBucket: "decision-maker-2957b.firebasestorage.app",
    messagingSenderId: "294974317700",
    appId: "1:294974317700:web:dd0be4ba28c9937c4f8ed1",
    measurementId: "G-TBG1DCFS7W"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };


// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCv2K2fdY9IiLmrbe-Y5LxMs7nJlYS9Y1M",
//   authDomain: "decision-maker-2957b.firebaseapp.com",
//   projectId: "decision-maker-2957b",
//   storageBucket: "decision-maker-2957b.firebasestorage.app",
//   messagingSenderId: "294974317700",
//   appId: "1:294974317700:web:dd0be4ba28c9937c4f8ed1",
//   measurementId: "G-TBG1DCFS7W"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);