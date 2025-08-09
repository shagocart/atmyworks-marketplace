// js/auth.js - Authentication related JavaScript

console.log("Auth module loaded");

// --- Firebase Auth Integration using Compat SDK ---
// These functions rely on `window.firebaseApp` being set by `js/firebase-config.js`

/**
 * Handles user login using email and password with Firebase Authentication.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
async function handleFirebaseLogin(email, password) {
    console.log("Attempting Firebase Login...");
    try {
        // Ensure Firebase Auth is available
        if (!window.firebaseApp || !window.firebaseApp.auth) {
            throw new Error("Firebase Auth is not initialized. Please check the console for Firebase loading errors.");
        }

        const userCredential = await window.firebaseApp.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Firebase Login Successful for user:", user.uid);
        alert("Login successful!");

        // --- ROLE-BASED REDIRECTION LOGIC ---
        // Fetch user role from Firestore
        let redirectUrl = '/index.html'; // Default fallback

        try {
            const userDoc = await window.firebaseApp.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const role = userData.role;

                console.log(`User role identified as: ${role}`);

                switch (role) {
                    case 'jobseeker':
                        redirectUrl = '/dashboard-freelancer.html';
                        break;
                    case 'employer':
                        redirectUrl = '/dashboard-client.html';
                        break;
                    case 'admin':
                        redirectUrl = '/dashboard-admin.html';
                        break;
                    default:
                        console.warn(`Unknown role '${role}', redirecting to default dashboard.`);
                        redirectUrl = '/index.html'; // Or a generic dashboard
                }
            } else {
                console.warn("User document not found in Firestore, redirecting to profile setup or default.");
                // Potentially redirect to a profile completion page
                redirectUrl = '/profile.html'; // Example
            }
        } catch (firestoreError) {
            console.error("Error fetching user role from Firestore:", firestoreError);
            // Still log in, but redirect to a safe default
        }

        console.log(`Redirecting user to: ${redirectUrl}`);
        window.location.href = redirectUrl;

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Firebase Login Error:", errorCode, errorMessage);

        // Provide user-friendly error messages
        let userMessage = "Login failed. Please try again.";
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-email') {
            userMessage = "Invalid email or password.";
        } else if (errorCode === 'auth/too-many-requests') {
            userMessage = "Too many failed login attempts. Please try again later or reset your password.";
        } else if (errorCode === 'auth/network-request-failed') {
             userMessage = "Network error. Please check your internet connection.";
        }
        alert(userMessage);
        throw error; // Re-throw for caller
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
    console.log("Attempting Firebase Signup for role:", role);
    try {
        // Ensure Firebase Auth is available
        if (!window.firebaseApp || !window.firebaseApp.auth) {
            throw new Error("Firebase Auth is not initialized. Please check the console for Firebase loading errors.");
        }

        const userCredential = await window.firebaseApp.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Firebase Signup Successful for new user:", user.uid);
        alert("Account created successfully!");

        // After signup, save additional user data to Firestore
        if (window.firebaseApp && window.firebaseApp.db) {
            try {
                let additionalData = {
                    uid: user.uid, // Explicitly store UID
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
                     console.warn("Incomplete user data for role:", role, userData);
                     // You might choose to fail signup here if critical data is missing
                     // For now, we log and proceed
                }

                // Save to a 'users' collection in Firestore
                await window.firebaseApp.db.collection('users').doc(user.uid).set(additionalData);
                console.log("User data saved to Firestore for UID:", user.uid);
            } catch (firestoreError) {
                console.error("Error saving user data to Firestore:", firestoreError);
                // Decide if signup should fail if Firestore write fails
                // Or just log the error and proceed. Alerting user is important.
                alert("Account created, but profile setup had an issue. Please contact support or try updating your profile later.");
            }
        } else {
            console.warn("Firestore 'db' object not found. Skipping user data save.");
            alert("Account created, but profile setup could not be completed. Please contact support.");
        }

        // Redirect to a page indicating success or prompting login/verification
        // For simplicity, redirecting to index to prompt login after potential email verification
        // You might want a dedicated "welcome" or "verify email" page.
        window.location.href = '/index.html'; // Or /login.html

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Firebase Signup Error:", errorCode, errorMessage);

        // Provide user-friendly error messages
        let userMessage = `Signup failed: ${errorMessage}`;
        if (errorCode === 'auth/email-already-in-use') {
            userMessage = "This email is already registered. Please try logging in.";
        } else if (errorCode === 'auth/weak-password') {
            userMessage = "Password is too weak. Please use a stronger password (at least 6 characters).";
        } else if (errorCode === 'auth/invalid-email') {
            userMessage = "Please enter a valid email address.";
        } else if (errorCode === 'auth/operation-not-allowed') {
            userMessage = "Email/password accounts are not enabled. Please contact support.";
        } else if (errorCode === 'auth/network-request-failed') {
             userMessage = "Network error. Please check your internet connection.";
        }
        alert(userMessage);
        throw error; // Re-throw for caller
    }
}

/**
 * Handles user logout.
 */
async function handleFirebaseLogout() {
    console.log("Handling Logout with Firebase");
    try {
        // Ensure Firebase Auth is available
        if (!window.firebaseApp || !window.firebaseApp.auth) {
             throw new Error("Firebase Auth is not initialized.");
        }
        await window.firebaseApp.auth.signOut();
        console.log("Firebase Logout Successful");
        alert("You have been logged out.");

        // Redirect to homepage or login page
        window.location.href = '/index.html';
    } catch (error) {
        console.error("Firebase Logout Error:", error);
        alert("Logout failed. Please try again.");
        throw error; // Re-throw for caller
    }
}

// --- DOMContentLoaded Event Listener ---
// Attach global event listeners if elements are found on the specific page
document.addEventListener('DOMContentLoaded', function () {
    console.log("Auth DOM loaded, attaching global event listeners if elements exist");

    // Logout Buttons (e.g., in dashboard headers)
    const logoutButtons = document.querySelectorAll('.logout-btn');
    if (logoutButtons.length > 0) {
        console.log(`Found ${logoutButtons.length} logout button(s), attaching click listeners`);
        logoutButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Logout button clicked");
                handleFirebaseLogout();
            });
        });
    } else {
        console.log("No logout buttons found on this page");
    }

    // --- FORM SUBMISSION HANDLERS ---
    // These are more robust ways to handle forms, called by page-specific scripts

    /**
     * Generic handler for login forms.
     * Expects form to have inputs named 'email' and 'password'.
     */
    window.handleLoginFormSubmit = async function(event) {
        event.preventDefault();
        console.log("Login form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';
        }

        try {
            await handleFirebaseLogin(email, password);
            // If successful, handleFirebaseLogin will redirect. No further action needed here.
        } catch (error) {
            // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Log In';
            }
            // Error message already shown in handleFirebaseLogin
            console.error("Login failed in global handler:", error);
        }
    };

    /**
     * Generic handler for signup forms (jobseeker or employer).
     * Expects form to have relevant inputs and a hidden 'role' input or determined logic.
     */
    window.handleSignupFormSubmit = async function(event) {
         event.preventDefault();
        console.log("Signup form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const username = formData.get('username')?.trim(); // For jobseeker
        const fullName = formData.get('fullName')?.trim(); // For both
        const companyName = formData.get('companyName')?.trim(); // For employer
        const phoneNumber = formData.get('phoneNumber')?.trim();
        const website = formData.get('website')?.trim(); // For employer
        const portfolioLink = formData.get('portfolioLink')?.trim(); // For jobseeker

        // --- DETERMINE ROLE ---
        // Option 1: Use a hidden input in the form
        // let role = formData.get('role'); // e.g., <input type="hidden" name="role" value="jobseeker">
        // Option 2: Infer from form ID or specific fields (as done previously)
        let role = 'client'; // Default assumption
        if (form.id === 'jobseekerSignupForm' || username) {
            role = 'jobseeker';
        } else if (form.id === 'employerSignupForm' || companyName) {
            role = 'employer';
        }
        console.log("Determined role for signup:", role);

        // --- BASIC VALIDATION ---
        if (!email || !password || !fullName) {
            alert("Email, password, and full name are required.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        // Email validation regex (basic)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        // Role-specific validation
        if (role === 'jobseeker' && (!username)) {
            alert("Username is required for jobseekers.");
            return;
        }
        if (role === 'employer' && (!companyName)) {
            alert("Company name is required for employers.");
            return;
        }

        const userData = {
            email,
            password,
            username: username || undefined,
            fullName,
            companyName: companyName || undefined,
            phoneNumber: phoneNumber || '',
            website: website || '',
            portfolioLink: portfolioLink || '',
            role
        };

        console.log("Prepared user data for signup:", userData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Account...';
        }

        try {
            await handleFirebaseSignup(userData);
            // If successful, handleFirebaseSignup will redirect. No further action needed here.
        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Account';
            }
            // Error message already shown in handleFirebaseSignup
            console.error("Signup failed in global handler:", error);
        }
    };

    // --- ATTACH LISTENERS TO EXISTING FORMS ON PAGE LOAD ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log("Login form found on page, attaching submit listener via global handler");
        loginForm.addEventListener('submit', window.handleLoginFormSubmit);
    }

    const jobseekerSignupForm = document.getElementById('jobseekerSignupForm');
    if (jobseekerSignupForm) {
        console.log("Jobseeker signup form found on page, attaching submit listener via global handler");
        jobseekerSignupForm.addEventListener('submit', window.handleSignupFormSubmit);
    }

    const employerSignupForm = document.getElementById('employerSignupForm');
    if (employerSignupForm) {
        console.log("Employer signup form found on page, attaching submit listener via global handler");
        employerSignupForm.addEventListener('submit', window.handleSignupFormSubmit);
    }

});
// --- End DOMContentLoaded Event Listener ---

// Make logout function globally available for inline handlers or other scripts
window.handleFirebaseLogout = handleFirebaseLogout;

// --- End of auth.js ---