// js/firebase-config.js
console.log("Firebase Config Script Loading...");

// !!! REPLACE WITH YOUR ACTUAL FIREBASE CONFIG FROM FIREBASE CONSOLE !!!
const firebaseConfig = {
  apiKey: "AIzaSyCNRX6gKVVp9UbqSFHrNC4TvPUflBvEAl8",
  authDomain: "atmyworks-cd97c.firebaseapp.com",
  projectId: "atmyworks-cd97c",
  storageBucket: "atmyworks-cd97c.firebasestorage.app",
  messagingSenderId: "477860893271",
  appId: "1:477860893271:web:c19737c9343c11538b8912"
};

// Function to initialize Firebase
function initializeFirebaseApp() {
  console.log("Attempting to initialize Firebase App...");
  try {
    // Check if the core Firebase object and initializeApp are available
    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
      throw new Error("Firebase core SDK (firebase-app-compat.js) not loaded or initializeApp is missing.");
    }

    // Initialize Firebase App
    const app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase App initialized successfully:", app.name);

    // Check and initialize Firebase services
    let authInstance = null;
    let firestoreInstance = null;
    let storageInstance = null;

    if (firebase.auth) {
      authInstance = firebase.auth();
      console.log("Firebase Auth instance created.");
    } else {
      console.error("Firebase Auth service not available. Ensure firebase-auth-compat.js is loaded.");
    }

    if (firebase.firestore) {
      firestoreInstance = firebase.firestore();
      console.log("Firebase Firestore instance created.");
    } else {
      console.error("Firebase Firestore service not available. Ensure firebase-firestore-compat.js is loaded.");
    }

    // Optional: Initialize Storage if you plan to use it
    if (firebase.storage) {
        storageInstance = firebase.storage();
        console.log("Firebase Storage instance created.");
    } else {
        console.warn("Firebase Storage service not available. Ensure firebase-storage-compat.js is loaded if needed.");
    }

    // Make services globally accessible
    window.firebaseApp = {
      app: app,
      auth: authInstance,
      db: firestoreInstance,
      storage: storageInstance
    };

    console.log("Firebase services attached to window.firebaseApp");
    return window.firebaseApp;

  } catch (error) {
    console.error("Critical Error Initializing Firebase App:", error.message);
    // Make the error globally known
    window.firebaseApp = { error: error.message };
    return null;
  }
}

// Execute initialization when this script runs
// This assumes the required Firebase SDK scripts are loaded BEFORE this file.
const initializedApp = initializeFirebaseApp();

if (initializedApp && !initializedApp.error) {
    console.log("Firebase configuration script executed successfully.");
} else if (initializedApp && initializedApp.error) {
    console.error("Firebase configuration script failed:", initializedApp.error);
} else {
    console.warn("Firebase configuration script completed, but app was not initialized.");
}

// Optional: Expose the initialization function globally if needed elsewhere
// window.initializeFirebaseApp = initializeFirebaseApp;