document.addEventListener('DOMContentLoaded', function () {
  console.log("Main JS loaded");

  // Check if firebaseApp is available (from firebase-config.js)
  if (typeof window.firebaseApp !== 'undefined') {
      window.auth = window.firebaseApp.auth;
      window.db = window.firebaseApp.db;
      console.log("Firebase services available in main.js");
  } else {
      console.warn("Firebase not initialized. Some features might not work.");
  }

  // --- Hero Search Functionality ---
  const heroSearchInput = document.getElementById('heroSearchInput');
  const heroSearchButton = document.getElementById('heroSearchButton');

  if (heroSearchInput && heroSearchButton) {
      const performHeroSearch = () => {
          const query = heroSearchInput.value.trim();
          if (query) {
              console.log("Hero search for:", query);
              // Redirect to browse page with query parameter
              window.location.href = `/browse.html?q=${encodeURIComponent(query)}`;
          } else {
              window.location.href = `/browse.html`;
          }
      };

      heroSearchButton.addEventListener('click', performHeroSearch);
      heroSearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              performHeroSearch();
          }
      });
  }

  // --- Authentication Button Actions (Header) ---
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');

  if (loginBtn) {
      loginBtn.addEventListener('click', function () {
          console.log("Login button clicked");
          window.location.href = '/signup-employer.html'; // Or a dedicated login page
      });
  }

  if (signupBtn) {
      signupBtn.addEventListener('click', function () {
          console.log("Signup button clicked");
          window.location.href = '/signup-jobseeker.html'; // Default to jobseeker
      });
  }

  // --- Newsletter Form (Footer) ---
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
      newsletterForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const emailInput = this.querySelector('input[type="email"]');
          const email = emailInput.value.trim();

          if (!email) {
              alert("Please enter your email address.");
              return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
              alert("Please enter a valid email address.");
              return;
          }

          console.log("Subscribing email:", email);
          // In a full implementation, send this to your backend or Firebase
          alert(`Thank you for subscribing with ${email}!`);
          emailInput.value = '';
      });
  }

  // --- General Form Handling (Example) ---
  // You can add more specific form handlers here or in dedicated files like auth.js
  // For example, handling a contact form:
  /*
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
          e.preventDefault();
          // Handle contact form submission
          console.log("Contact form submitted");
          // ... logic ...
      });
  }
  */

});

// Utility function to format currency (example)
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Utility function to show/hide elements
function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}