document.addEventListener('DOMContentLoaded', function () {
    console.log("Auth JS loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        console.log("Firebase services available in auth.js");
    } else {
        console.warn("Firebase not initialized in auth.js. Auth features will not work.");
        return; // Exit if Firebase is not available
    }

    // --- Form Submission Handlers ---
    function handleLoginFormSubmit(event) {
        event.preventDefault();
        console.log("Login form submitted");

        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;

        console.log("Login attempt with:", { email, password });

        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        handleFirebaseLogin(email, password);
    }

    function handleSignupFormSubmit(event) {
        event.preventDefault();
        console.log("Signup form submitted");

        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword?.value;
        // Optional fields based on form type
        const username = form.username?.value?.trim();
        const fullName = form.fullName?.value?.trim();
        const companyName = form.companyName?.value?.trim();

        console.log("Signup attempt with:", { username, fullName, companyName, email, password });

        if (!email || !password) {
            alert("Email and password are required.");
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

        const userData = {
            email: email,
            password: password
        };

        if (username) userData.username = username;
        if (fullName) userData.fullName = fullName;
        if (companyName) userData.companyName = companyName;

        handleFirebaseSignup(userData);
    }

    // --- Firebase Auth Functions ---
    async function handleFirebaseLogin(email, password) {
        try {
            const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Firebase Login Successful:", user);
            alert("Login successful!");

            // Determine redirect based on user role (needs to be stored/fetched)
            // For now, redirecting to client dashboard as an example
            // A more robust system would check Firestore for user role
            window.location.href = '/dashboard-client.html';

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Login Error:", errorCode, errorMessage);
            if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                alert("Invalid email or password.");
            } else {
                alert(`Login failed: ${errorMessage}`);
            }
        }
    }

    async function handleFirebaseSignup(userData) {
        const { email, password, username, fullName, companyName } = userData;
        try {
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Firebase Signup Successful:", user);
            alert("Account created successfully!");

            if (typeof window.db !== 'undefined') {
                try {
                    let role = 'client'; // Default assumption
                    let additionalData = { email: email };

                    if (username && fullName) {
                        role = 'jobseeker';
                        additionalData.username = username;
                        additionalData.fullName = fullName;
                    } else if (companyName) {
                        role = 'employer';
                        additionalData.companyName = companyName;
                    }
                    additionalData.role = role;
                    additionalData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

                    await window.db.collection('users').doc(user.uid).set(additionalData);
                    console.log("User data saved to Firestore for UID:", user.uid);
                } catch (firestoreError) {
                    console.error("Error saving user data to Firestore:", firestoreError);
                    alert("Account created, but profile setup had an issue. Please contact support.");
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping user data save.");
            }

            // Redirect to index to prompt login after potential email verification
            window.location.href = '/index.html';

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Signup Error:", errorCode, errorMessage);
            if (errorCode === 'auth/email-already-in-use') {
                alert("This email is already registered. Please try logging in.");
            } else if (errorCode === 'auth/weak-password') {
                alert("Password is too weak. Please use a stronger password.");
            } else {
                alert(`Signup failed: ${errorMessage}`);
            }
        }
    }

    async function handleFirebaseLogout() {
        console.log("Handling Logout with Firebase");
        try {
            await window.auth.signOut();
            console.log("Firebase Logout Successful");
            alert("You have been logged out.");
            window.location.href = '/index.html';
        } catch (error) {
            console.error("Firebase Logout Error:", error);
            alert("Logout failed. Please try again.");
        }
    }

    // --- DOM Event Listeners ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log("Found login form, attaching submit listener");
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }

    const jobseekerSignupForm = document.getElementById('jobseekerSignupForm');
    if (jobseekerSignupForm) {
        console.log("Found jobseeker signup form, attaching submit listener");
        jobseekerSignupForm.addEventListener('submit', handleSignupFormSubmit);
    }

    const employerSignupForm = document.getElementById('employerSignupForm');
    if (employerSignupForm) {
        console.log("Found employer signup form, attaching submit listener");
        employerSignupForm.addEventListener('submit', handleSignupFormSubmit);
    }

    const logoutButtons = document.querySelectorAll('.logout-btn');
    if (logoutButtons.length > 0) {
        console.log(`Found ${logoutButtons.length} logout button(s), attaching click listeners`);
        logoutButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                handleFirebaseLogout();
            });
        });
    }

    // Make logout function globally available if needed
    window.handleFirebaseLogout = handleFirebaseLogout;
});