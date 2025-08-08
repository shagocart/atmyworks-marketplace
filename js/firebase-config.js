// js/firebase-config.js
// Your web app's Firebase configuration (PASTE YOUR ACTUAL CONFIG HERE!)
const firebaseConfig = {
  apiKey: "AIzaSyCNRX6gKVVp9UbqSFHrNC4TvPUflBvEAl8", // <-- MAKE SURE THIS IS YOURS
  authDomain: "atmyworks-cd97c.firebaseapp.com",
  projectId: "atmyworks-cd97c",
  storageBucket: "atmyworks-cd97c.firebasestorage.app",
  messagingSenderId: "477860893271",
  appId: "1:477860893271:web:c19737c9343c11538b8912"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth, db, and storage easily accessible globally
// This allows other JS files (like auth.js, main.js) to use them simply as 'auth', 'db', etc.
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Optional: Log to console to confirm it loaded (remove later if desired)
console.log("Firebase initialized in firebase-config.js");

// Make them globally available (like we did in index.html <script>)
// This is a simple way for other scripts to access them.
window.firebaseApp = {
    auth: auth,
    db: db,
    storage: storage
};