// main.js - Core JavaScript for AtMyWorks Platform

console.log("AtMyWorks JavaScript loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded and parsed");

  // Mobile Navigation Toggle (if you add a mobile menu later)
  // const mobileMenuButton = document.getElementById('mobileMenuButton');
  // const mobileMenu = document.getElementById('mobileMenu');
  // if (mobileMenuButton && mobileMenu) {
  //   mobileMenuButton.addEventListener('click', () => {
  //     mobileMenu.classList.toggle('hidden');
  //   });
  // }

  // Authentication Button Actions
  // These now call the functions defined in js/auth.js
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');

  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      console.log("Login button clicked");
      // Call the function from js/auth.js
      // This will likely redirect to a login page or open a modal in a full implementation
      // For now, redirecting to a hypothetical login page
      window.location.href = '/login.html'; // Or open a modal
      // If you implement a modal in auth.js, you could call a function like:
      // openLoginModal(); // This function would need to be defined in auth.js and made available
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', function () {
      console.log("Signup button clicked");
      // Call the function from js/auth.js
      // This will likely redirect to a signup page or open a modal in a full implementation
      // Redirecting to jobseeker signup as an example
      window.location.href = '/signup-jobseeker.html'; // Or /signup-employer.html, or open a modal
      // If you implement a modal in auth.js, you could call a function like:
      // openSignupModal(); // This function would need to be defined in auth.js and made available
    });
  }

  // Example of a simple interactive element
  // If you have elements that need dynamic behavior, add them here
  // For example, handling form submissions without reload:
  /*
  const exampleForm = document.getElementById('exampleForm');
  if (exampleForm) {
    exampleForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent default form submission
      // Handle form data
      const formData = new FormData(exampleForm);
      console.log("Form submitted with data:", Object.fromEntries(formData));
      // You would process the data here, e.g., send to a server or Firebase
      alert("Form submitted! (Check console for data)");
    });
  }
  */

  // Initialize Search Functionality
  initializeSearch(); // Initialize the search bar functionality

  // Initialize any other components or features
  // initializeGigCards(); // If gig cards need JS enhancements
});

// Utility function for search (example)
function initializeSearch() {
  const searchBar = document.querySelector('.search-bar input');
  const searchButton = document.querySelector('.search-bar button');
  
  if (searchBar && searchButton) {
    const performSearch = () => {
      const query = searchBar.value.trim();
      if (query) {
        console.log("Searching for:", query);
        // In a real app, this would filter gigs or redirect to search results
        // For now, redirecting to browse page with query parameter
        window.location.href = `/browse.html?q=${encodeURIComponent(query)}`;
        // Example: window.location.href = `/search?q=${encodeURIComponent(query)}`;
      } else {
          // Optional: Clear search or show all if query is empty
          window.location.href = `/browse.html`;
      }
    };

    searchButton.addEventListener('click', performSearch);
    searchBar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  } else {
      console.log("Search bar elements not found on this page.");
  }
}

// --- Firebase Integration ---
// The Firebase app, auth, and db objects are expected to be globally available
// from the Firebase SDK initialization in your HTML <head>.
// This file primarily handles UI interactions and calls functions
// potentially defined in other JS files (like auth.js) that use these objects.

// If you define global utility functions in main.js that need Firebase, you can access them here.
// For example, a function to check auth state:
/*
function checkAuthState() {
    // Use the globally available 'auth' object
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User is signed in:", user);
            // Update UI for signed-in user
            // e.g., hide/show login/signup buttons, show logout button/dashboard link
        } else {
            console.log("No user is signed in.");
             // Update UI for signed-out user
        }
    });
}

// Call this function on pages where you need to check auth state
// checkAuthState();
*/
// --- End Firebase Integration ---