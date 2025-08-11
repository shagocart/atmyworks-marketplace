// js/firebase-config.js - Firebase configuration and initialization for AtMyWorks

console.log("Firebase Config Script Loading...");

// !!! REPLACE WITH YOUR ACTUAL FIREBASE CONFIG FROM FIREBASE CONSOLE !!!
// This configuration object is specific to YOUR Firebase project (atmyworks-cd97c)
const firebaseConfig = {
  apiKey: "AIzaSyCNRX6gKVVp9UbqSFHrNC4TvPUflBvEAl8",
  authDomain: "atmyworks-cd97c.firebaseapp.com",
  projectId: "atmyworks-cd97c",
  storageBucket: "atmyworks-cd97c.firebasestorage.app",
  messagingSenderId: "477860893271",
  appId: "1:477860893271:web:c19737c9343c11538b8912"
};

/**
 * Initializes Firebase App and core services (Auth, Firestore, Storage).
 * Ensures Firebase is only initialized once.
 * Makes services globally accessible via window.firebaseApp.
 * @returns {Object|null} The initialized firebaseApp object or null on error.
 */
function initializeFirebaseApp() {
  console.log("Attempting to initialize Firebase App...");

  // --- PREVENT MULTIPLE INITIALIZATIONS ---
  // Check if Firebase App is already initialized
  if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.app) {
    console.log("Firebase App already initialized. Returning existing instance.");
    return window.firebaseApp;
  }

  try {
    // --- CORE SDK CHECK ---
    // Ensure the core Firebase object and initializeApp are available
    // This check is crucial as it depends on firebase-app-compat.js being loaded
    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
      throw new Error("Firebase core SDK (firebase-app-compat.js) not loaded or initializeApp is missing. Please check the console for Firebase loading errors and ensure the SDK script tag is present in your HTML <head> before this script.");
    }

    // --- INITIALIZE FIREBASE APP ---
    console.log("Initializing Firebase App with config:", firebaseConfig);
    const app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase App initialized successfully:", app.name);

    // --- INITIALIZE FIREBASE SERVICES ---
    // Check and initialize Firebase services using the Compat SDK
    // These checks depend on the respective compat SDK scripts being loaded
    let authInstance = null;
    let firestoreInstance = null;
    let storageInstance = null;

    // Initialize Auth
    if (typeof firebase.auth !== 'undefined') {
      authInstance = firebase.auth();
      console.log("Firebase Auth instance (Compat) created.");
    } else {
      console.error("Firebase Auth service not available. Ensure firebase-auth-compat.js is loaded in your HTML <head> before this script.");
    }

    // Initialize Firestore
    if (typeof firebase.firestore !== 'undefined') {
      firestoreInstance = firebase.firestore();
      console.log("Firebase Firestore instance (Compat) created.");
    } else {
      console.error("Firebase Firestore service not available. Ensure firebase-firestore-compat.js is loaded in your HTML <head> before this script.");
    }

    // Initialize Storage (Optional)
    if (typeof firebase.storage !== 'undefined') {
        storageInstance = firebase.storage();
        console.log("Firebase Storage instance (Compat) created.");
    } else {
        console.warn("Firebase Storage service not available. Ensure firebase-storage-compat.js is loaded in your HTML <head> before this script if needed.");
    }

    // --- MAKE SERVICES GLOBALLY ACCESSIBLE ---
    // Create the global firebaseApp object with initialized services
    window.firebaseApp = {
      app: app,
      auth: authInstance,
      db: firestoreInstance,
      storage: storageInstance
    };

    console.log("Firebase services successfully attached to window.firebaseApp");
    return window.firebaseApp;

  } catch (error) {
    console.error("Critical Error Initializing Firebase App:", error.message);
    console.error("Stack trace:", error.stack);

    // Make the error globally known for other scripts to handle
    window.firebaseApp = { 
      error: error.message,
      app: null,
      auth: null,
      db: null,
      storage: null
    };
    
    // Provide user feedback if possible
    if (typeof alert !== 'undefined') {
        alert("Failed to initialize Firebase services. Some features may not work. Please refresh the page.");
    }

    return window.firebaseApp; // Return the error object
  }
}

// --- EXECUTE INITIALIZATION ---
// This function runs immediately when the script is loaded
// It assumes the required Firebase SDK scripts are loaded BEFORE this file.
console.log("Executing Firebase initialization...");
const initializedApp = initializeFirebaseApp();

// --- PROVIDE FEEDBACK ON INITIALIZATION RESULT ---
if (initializedApp && !initializedApp.error) {
    console.log("Firebase configuration script executed successfully.");
    console.log("Available services:", {
        auth: !!initializedApp.auth,
        db: !!initializedApp.db,
        storage: !!initializedApp.storage
    });
} else if (initializedApp && initializedApp.error) {
    console.error("Firebase configuration script failed:", initializedApp.error);
} else {
    console.warn("Firebase configuration script completed, but app was not initialized.");
}

// --- OPTIONAL: EXPOSE INITIALIZATION FUNCTION GLOBALLY ---
// This allows other scripts to re-attempt initialization if needed,
// though it's protected against multiple initializations internally.
window.initializeFirebaseApp = initializeFirebaseApp;

console.log("Firebase Config Script Loaded and Executed");