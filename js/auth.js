// auth.js - Authentication related JavaScript

console.log("Auth module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Auth DOM loaded");
    // Initialization code can go here if needed
});

// --- Firebase Auth Integration using Compat SDK ---
// These functions assume `auth` is globally available from your Firebase initialization

/**
 * Handles user login using email and password with Firebase Authentication.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
async function handleFirebaseLogin(email, password) {
    try {
        // Use the globally available 'auth' object from Firebase Compat
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Firebase Login Successful:", user);
        alert("Login successful!");

        // After login, redirect based on user role or to a default dashboard
        // A more robust system would check Firestore for user role
        // For now, we'll redirect to a general dashboard or index
        // You might want to store the role in localStorage or check Firestore
        window.location.href = '/dashboard-client.html'; // Or /dashboard-freelancer.html based on role

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Firebase Login Error:", errorCode, errorMessage);
        // Provide user-friendly error messages
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-email') {
            alert("Invalid email or password.");
        } else if (errorCode === 'auth/too-many-requests') {
            alert("Too many failed login attempts. Please try again later or reset your password.");
        } else {
            alert(`Login failed: ${errorMessage}`);
        }
        // Re-throw the error so the calling function knows it failed
        throw error;
    }
}

/**
 * Handles user signup using email and password with Firebase Authentication.
 * Determines role (jobseeker/employer) based on passed data.
 * @param {Object} userData - Object containing user signup data.
 * @param {string} userData.email - The user's email address.
 * @param {string} userData.password - The user's password.
 * @param {string} [userData.username] - Username (for jobseekers).
 * @param {string} [userData.fullName] - Full name.
 * @param {string} [userData.companyName] - Company name (for employers).
 * @param {string} [userData.phoneNumber] - Phone number.
 * @param {string} [userData.website] - Company website (for employers).
 * @param {string} [userData.portfolioLink] - Portfolio link (for jobseekers).
 * @param {string} userData.role - 'jobseeker' or 'employer'.
 */
async function handleFirebaseSignup(userData) {
    const { email, password, username, fullName, companyName, phoneNumber, website, portfolioLink, role } = userData;
    try {
        // Use the globally available 'auth' object from Firebase Compat
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Firebase Signup Successful:", user);
        alert("Account created successfully!");

        // After signup, save additional user data to Firestore
        // Check if db is globally available (from your Firebase init)
        if (typeof db !== 'undefined') {
            try {
                let additionalData = {
                    email: email,
                    role: role, // 'jobseeker' or 'employer'
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Add role-specific data
                if (role === 'jobseeker' && username && fullName) {
                    additionalData.username = username;
                    additionalData.fullName = fullName;
                    additionalData.portfolioLink = portfolioLink || '';
                    additionalData.phoneNumber = phoneNumber || '';
                    // You might want to set initial KYC status here if needed
                    // additionalData.kycStatus = 'not_submitted';
                } else if (role === 'employer' && companyName && fullName) {
                    additionalData.companyName = companyName;
                    additionalData.fullName = fullName; // Contact person's name
                    additionalData.website = website || '';
                    additionalData.phoneNumber = phoneNumber || '';
                } else {
                     // This shouldn't happen if form validation is correct
                    console.warn("Incomplete user data for role:", role, userData);
                }

                // Save to a 'users' collection in Firestore
                await db.collection('users').doc(user.uid).set(additionalData);
                console.log("User data saved to Firestore for UID:", user.uid);
            } catch (firestoreError) {
                console.error("Error saving user data to Firestore:", firestoreError);
                // Decide if signup should fail if Firestore write fails
                // Or just log the error and proceed
                alert("Account created, but profile setup had an issue. Please contact support.");
            }
        } else {
            console.warn("Firestore 'db' object not found. Skipping user data save.");
        }

        // Sign out the user immediately after creation so they must verify email
        // OR, you can keep them signed in but direct them to a verification page.
        // Firebase usually sends a verification email automatically, but you can trigger it.
        // await user.sendEmailVerification(); // Optional: Send verification email

        // Redirect to a page indicating email verification is needed or login page
        // For simplicity, redirecting to index to prompt login after verification
        window.location.href = '/index.html'; // Or a "verify email" page

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Firebase Signup Error:", errorCode, errorMessage);
        // Provide user-friendly error messages
        if (errorCode === 'auth/email-already-in-use') {
            alert("This email is already registered. Please try logging in.");
        } else if (errorCode === 'auth/weak-password') {
            alert("Password is too weak. Please use a stronger password (at least 6 characters).");
        } else if (errorCode === 'auth/invalid-email') {
            alert("Please enter a valid email address.");
        } else if (errorCode === 'auth/operation-not-allowed') {
            alert("Email/password accounts are not enabled. Please contact support.");
        } else {
            alert(`Signup failed: ${errorMessage}`);
        }
        // Re-throw the error so the calling function knows it failed
        throw error;
    }
}

/**
 * Handles user logout.
 */
async function handleFirebaseLogout() {
    console.log("Handling Logout with Firebase");
    try {
        // Use the globally available 'auth' object from Firebase Compat
        await firebase.auth().signOut();
        console.log("Firebase Logout Successful");
        alert("You have been logged out.");

        // Redirect to homepage or login page
        window.location.href = '/index.html';
    } catch (error) {
        console.error("Firebase Logout Error:", error);
        alert("Logout failed. Please try again.");
        // Re-throw the error so the calling function knows it failed
        throw error;
    }
}
// --- End Firebase Auth Integration ---

// --- Form Submission Handlers (Updated to call Firebase functions) ---
/**
 * Handles login form submission.
 * @param {Event} event - The form submission event.
 */
function handleLoginFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("Login form submitted");

    const form = event.target;
    const email = form.email.value.trim(); // Trim whitespace
    const password = form.password.value;

    console.log("Login attempt with:", { email, password });

    // Basic Validation
    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    // Call the Firebase login function
    handleFirebaseLogin(email, password);
}

/**
 * Handles signup form submission (works for both jobseeker and employer forms).
 * @param {Event} event - The form submission event.
 */
function handleSignupFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("Signup form submitted");

    const form = event.target;
    // Get form data - adapt selectors based on your actual form field IDs/names

    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword?.value;

    // Optional fields (present in different signup forms)
    const username = form.username?.value?.trim(); // For jobseeker
    const fullName = form.fullName?.value?.trim(); // For both, but meaning differs
    const companyName = form.companyName?.value?.trim(); // For employer
    const phoneNumber = form.phoneNumber?.value?.trim();
    const website = form.website?.value?.trim(); // For employer
    const portfolioLink = form.portfolioLink?.value?.trim(); // For jobseeker

    console.log("Signup attempt with:", { username, fullName, companyName, email, password });

    // Basic Validation
    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Basic password strength check (optional)
    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    // Determine role based on which form this is (or data provided)
    // This is a simple way, you could also use a hidden input or check form ID
    let role = 'client'; // Default assumption
    if (username && fullName) {
        role = 'jobseeker';
    } else if (companyName && fullName) {
        role = 'employer';
    } else {
        // If neither set of specific fields is present, we can't determine the role
        // This might indicate a problem with the form or JS logic
        console.warn("Could not determine user role from form data. Defaulting to 'client'.");
    }

    // Prepare data object for signup function
    const userData = {
        email: email,
        password: password,
        role: role
    };

    // Add optional fields if they exist
    if (username) userData.username = username;
    if (fullName) userData.fullName = fullName;
    if (companyName) userData.companyName = companyName;
    if (phoneNumber) userData.phoneNumber = phoneNumber;
    if (website) userData.website = website;
    if (portfolioLink) userData.portfolioLink = portfolioLink;

    // Call the Firebase signup function
    handleFirebaseSignup(userData);
}
// --- End Form Submission Handlers ---

// --- DOMContentLoaded Event Listener ---
// When the DOM is ready, attach event listeners to auth forms if they exist
// This part might be redundant now as we are attaching listeners directly in the HTML pages
// but it's kept for completeness or if you have forms dynamically added
document.addEventListener('DOMContentLoaded', function () {
    console.log("Auth DOM loaded, attaching event listeners");

    // Login Form
    const loginForm = document.getElementById('loginForm'); // Make sure your login form has this ID
    if (loginForm) {
        console.log("Found login form, attaching submit listener");
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    } else {
        console.log("Login form not found on this page");
    }

    // Signup Forms (Jobseeker and Employer might be separate)
    const jobseekerSignupForm = document.getElementById('jobseekerSignupForm');
    if (jobseekerSignupForm) {
        console.log("Found jobseeker signup form, attaching submit listener");
        jobseekerSignupForm.addEventListener('submit', handleSignupFormSubmit);
    } else {
        console.log("Jobseeker signup form not found on this page");
    }

    const employerSignupForm = document.getElementById('employerSignupForm');
    if (employerSignupForm) {
        console.log("Found employer signup form, attaching submit listener");
        employerSignupForm.addEventListener('submit', handleSignupFormSubmit);
    } else {
        console.log("Employer signup form not found on this page");
    }

    // Logout Button (if present on the page, e.g., in dashboard)
    // You might need to adjust the selector based on your actual logout button
    const logoutButtons = document.querySelectorAll('.logout-btn'); // Example: class 'logout-btn'
    if (logoutButtons.length > 0) {
        console.log(`Found ${logoutButtons.length} logout button(s), attaching click listeners`);
        logoutButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default link behavior if it's an <a> tag
                handleFirebaseLogout();
            });
        });
    } else {
        console.log("No logout buttons found on this page");
    }
});
// --- End DOMContentLoaded Event Listener ---

// Make functions available globally if needed by inline handlers or other scripts
// (Though attaching via addEventListener is preferred)
window.handleFirebaseLogin = handleFirebaseLogin;
window.handleFirebaseSignup = handleFirebaseSignup;
window.handleFirebaseLogout = handleFirebaseLogout;