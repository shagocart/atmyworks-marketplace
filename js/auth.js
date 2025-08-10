// js/auth.js - Enhanced Authentication related JavaScript for AtMyWorks

console.log("Enhanced Auth module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Enhanced Auth DOM loaded");

    // --- GLOBAL AUTH STATE LISTENER ---
    // Listen for auth state changes (login/logout)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db; // Assuming Firestore is initialized in firebase-config.js
        window.storage = window.firebaseApp.storage; // Assuming Storage is initialized
        console.log("Firebase Auth, DB, and Storage services available in auth.js");

        // This listener triggers whenever the user's auth state changes
        window.auth.onAuthStateChanged(user => {
            console.log("Auth state changed. Current user:", user ? user.uid : "None");
            
            // Update UI elements based on auth state across all pages
            updateAuthUI(user);

            // If on a protected page (like dashboard), check role/subscription
            // This part is handled by the specific page's JS (e.g., dashboard-admin.html)
        });
    } else {
        console.warn("Firebase not initialized in auth.js. Some features might not work.");
        // Hide auth-dependent UI elements or show an error
        updateAuthUI(null); 
    }

    // --- GENERIC AUTH UI UPDATER ---
    function updateAuthUI(user) {
        const loginBtnNav = document.getElementById('loginBtnNav');
        const signupBtnNav = document.getElementById('signupBtnNav');
        const authButtonsNav = document.querySelector('.auth-buttons'); // Assuming this holds login/signup
        const userMenuNav = document.getElementById('userMenuNav'); // Assuming you have a user menu element
        const logoutBtnNav = document.getElementById('logoutBtnNav'); // Assuming logout button has this ID

        if (user) {
            // User is signed in
            console.log("User is signed in:", user.email);
            if (authButtonsNav) authButtonsNav.style.display = 'none';
            if (userMenuNav) {
                userMenuNav.style.display = 'flex'; // Or 'block'
                // Update user name/avatar in menu
                const userNameElement = userMenuNav.querySelector('#userName');
                if (userNameElement) {
                    userNameElement.textContent = user.displayName || user.email?.split('@')[0] || 'User';
                }
                // Update user avatar initials
                const userAvatarElements = userMenuNav.querySelectorAll('.user-avatar');
                userAvatarElements.forEach(avatar => {
                    if (avatar) {
                        const initials = (user.displayName || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase();
                        avatar.textContent = initials;
                    }
                });
            }
            if (logoutBtnNav) {
                // Remove any existing listener to prevent duplicates
                logoutBtnNav.removeEventListener('click', window.handleFirebaseLogout);
                logoutBtnNav.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent default link behavior if it's an <a> tag
                    window.handleFirebaseLogout();
                });
            }
        } else {
            // User is signed out
            console.log("User is signed out");
            if (authButtonsNav) authButtonsNav.style.display = 'flex'; // Or 'block'
            if (userMenuNav) userMenuNav.style.display = 'none';
            // Remove logout listener if it was added previously (good practice)
            if (logoutBtnNav) {
                logoutBtnNav.removeEventListener('click', window.handleFirebaseLogout);
            }
        }
    }

    // --- FIREBASE AUTH INTEGRATION USING COMPAT SDK ---
    // These functions assume `auth` and `db` are globally available from your Firebase initialization

    /**
     * Handles user login using email and password with Firebase Authentication.
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     */
    window.handleFirebaseLogin = async function(email, password) {
        console.log("Attempting Firebase Login...");
        try {
            // Ensure Firebase Auth is available
            if (!window.auth) {
                throw new Error("Firebase Auth is not initialized. Please check the console for Firebase loading errors.");
            }

            const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Firebase Login Successful:", user.uid);
            
            // --- EMAIL VERIFICATION CHECK ---
            // It's good practice to ensure the user has verified their email
            if (!user.emailVerified) {
                console.warn("User email not verified:", user.email);
                alert("Please verify your email address before logging in. A verification email has been sent.");
                // Sign them out and prompt verification
                await window.auth.signOut();
                // Optionally, resend verification email
                // await user.sendEmailVerification();
                return; // Stop login process
            }
            // --- END EMAIL VERIFICATION CHECK ---

            // Show success message
            showMessage("Login successful! Welcome back.", "success");

            // --- ROLE-BASED REDIRECTION LOGIC ---
            // Fetch user role from Firestore to determine where to redirect
            let redirectUrl = '/index.html'; // Default fallback

            try {
                // Query the 'users' collection for the document with the user's UID
                const userDoc = await window.db.collection('users').doc(user.uid).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const role = userData.role;

                    console.log(`User role identified as: ${role}`);

                    // Determine redirect URL based on role
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
                            console.warn(`Unknown role '${role}', redirecting to default.`);
                            // Optionally, redirect to a profile completion page
                            // redirectUrl = '/profile.html'; 
                    }
                } else {
                    console.warn("User document not found in Firestore, redirecting to profile setup or default.");
                    // Potentially redirect to a profile completion page
                    // redirectUrl = '/profile.html'; // Example
                }
            } catch (firestoreError) {
                console.error("Error fetching user role from Firestore:", firestoreError);
                showMessage("Logged in, but there was an issue loading your profile. You will be redirected to the homepage.", "warning");
            }

            console.log(`Redirecting user to: ${redirectUrl}`);
            // Use a slight delay to allow the success message to be seen
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500); // 1.5 second delay

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
            } else if (errorCode === 'auth/user-disabled') {
                userMessage = "This account has been disabled. Please contact support.";
            } else if (errorCode === 'auth/email-not-verified') {
                 userMessage = "Please verify your email address before logging in.";
            }
            showMessage(userMessage, "danger");
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
    window.handleFirebaseSignup = async function(userData) {
        const { email, password, username, fullName, companyName, phoneNumber, website, portfolioLink, role } = userData;
        console.log("Attempting Firebase Signup for role:", role);
        try {
            // Ensure Firebase Auth is available
            if (!window.auth) {
                 throw new Error("Firebase Auth is not initialized. Please check the console for Firebase loading errors.");
            }

            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Firebase Signup Successful for new user:", user.uid);
            
            // Immediately send email verification
            try {
                await user.sendEmailVerification();
                console.log("Email verification sent to:", user.email);
            } catch (verificationError) {
                console.error("Error sending verification email:", verificationError);
                // Don't fail signup if email fails, just warn
                showMessage("Account created, but email verification could not be sent. Please contact support.", "warning");
            }

            // After signup, save additional user data to Firestore
            if (window.db) {
                try {
                    let additionalData = {
                        uid: user.uid, // Explicitly store UID
                        email: email,
                        role: role, // 'jobseeker' or 'employer' or 'admin'
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
                    } else if (role === 'admin') {
                         // Handle admin signup if needed, might require manual assignment
                         additionalData.fullName = fullName || 'Admin User';
                    } else {
                         console.warn("Incomplete user data for role:", role, userData);
                         // You might choose to fail signup here if critical data is missing
                         // For now, we log and proceed with minimal data
                         additionalData.fullName = fullName || email?.split('@')[0] || 'User';
                    }

                    // Save to a 'users' collection in Firestore
                    await window.db.collection('users').doc(user.uid).set(additionalData);
                    console.log("User data saved to Firestore for UID:", user.uid);
                    
                } catch (firestoreError) {
                    console.error("Error saving user data to Firestore:", firestoreError);
                    // Decide if signup should fail if Firestore write fails
                    // Or just log the error and proceed
                    showMessage("Account created, but profile setup had an issue. Please contact support or update your profile later.", "danger");
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping user data save.");
                showMessage("Account created, but profile setup could not be completed. Please contact support.", "danger");
            }

            // Show success message
            showMessage("Account created successfully! Please check your email for verification.", "success");

            // Redirect to a page indicating success or prompting login/verification
            // For simplicity, redirecting to index to prompt login after potential email verification
            // You might want a dedicated "welcome" or "verify email" page.
            // Use a slight delay to allow the success message to be seen
            setTimeout(() => {
                window.location.href = '/index.html'; // Or /login.html
            }, 2000); // 2 second delay

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
            showMessage(userMessage, "danger");
            // Re-throw the error so the calling function knows it failed
            throw error; 
        }
    }

    /**
     * Handles user logout.
     */
    window.handleFirebaseLogout = async function() {
        console.log("Handling Logout with Firebase");
        try {
            // Ensure Firebase Auth is available
            if (!window.auth) {
                 throw new Error("Firebase Auth is not initialized.");
            }
            
            await window.auth.signOut();
            console.log("Firebase Logout Successful");
            showMessage("You have been logged out.", "info");

            // Redirect to homepage or login page
            // Use a slight delay to allow the message to be seen
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000); // 1 second delay
        } catch (error) {
            console.error("Firebase Logout Error:", error);
            showMessage("Logout failed. Please try again.", "danger");
            // Re-throw the error so the calling function knows it failed
            throw error; 
        }
    }

    /**
     * Handles password reset requests.
     * @param {string} email - The user's email address.
     */
    window.handleFirebasePasswordReset = async function(email) {
        if (!email) {
            showMessage("Please enter your email address.", "warning");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage("Please enter a valid email address.", "warning");
            return;
        }

        try {
            // Ensure Firebase Auth is available
            if (!window.auth) {
                 throw new Error("Firebase Auth is not initialized.");
            }

            await window.auth.sendPasswordResetEmail(email);
            console.log("Password reset email sent to:", email);
            showMessage(`Password reset link sent to ${email}. Please check your inbox.`, "success");
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Firebase Password Reset Error:", errorCode, errorMessage);

            let userMessage = "Failed to send password reset email. Please try again.";
            if (errorCode === 'auth/user-not-found') {
                userMessage = "No account found with that email address.";
            } else if (errorCode === 'auth/invalid-email') {
                userMessage = "Please enter a valid email address.";
            } else if (errorCode === 'auth/too-many-requests') {
                userMessage = "Too many requests. Please try again later.";
            }
            showMessage(userMessage, "danger");
            throw error;
        }
    };

    /**
     * Checks if the current user has an active subscription.
     * This function queries Firestore to verify the user's subscription status.
     * @param {string} userId - The Firebase UID of the user.
     * @returns {Promise<boolean>} True if the user has an active subscription, false otherwise.
     */
    window.checkUserSubscription = async function(userId) {
        if (!userId) {
            console.warn("No user ID provided for subscription check.");
            return false;
        }

        // Ensure Firebase services are available
        if (!window.db) {
            console.warn("Firestore 'db' not available for subscription check.");
            return false;
        }

        try {
            console.log(`Checking subscription for user: ${userId}`);
            // Query the 'users' collection for the document with the user's UID
            const userDoc = await window.db.collection('users').doc(userId).get({ source: 'server' }); // Force server fetch

            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log("User data found for subscription check:", userData);

                // --- KEY CHECK: Is the user an admin? ---
                // Admins bypass subscription checks
                if (userData.role === 'admin') {
                    console.log("User is admin, granting access.");
                    return true;
                }
                // --- END ADMIN CHECK ---

                // --- KEY CHECK: Does the user have an active subscription? ---
                // This assumes you have a 'subscription' field in the user document
                // with properties like 'status' and 'expiresAt'
                const subscription = userData.subscription;
                if (subscription) {
                    const isActive = subscription.status === 'active';
                    const expiresAt = subscription.expiresAt;
                    // Check if expiration date exists and is in the future
                    const isNotExpired = expiresAt ? expiresAt.toDate() > new Date() : true; 
                    
                    console.log(`Subscription check - Active: ${isActive}, Not Expired: ${isNotExpired}`);
                    return isActive && isNotExpired;
                } else {
                    console.log("No subscription data found for user.");
                    return false; // User exists but has no subscription data
                }
                // --- END SUBSCRIPTION CHECK ---
                
            } else {
                console.log("No user document found for UID:", userId);
                return false; // User doc doesn't exist, deny access
            }
        } catch (error) {
            console.error("Error checking user subscription:", error);
            // In case of an error (e.g., network issue), deny access for security
            return false;
        }
    };

    /**
     * Checks if the current user is an admin.
     * This function queries Firestore to verify the user's role.
     * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
     */
    window.checkIfUserIsAdmin = async function() {
        const user = window.auth.currentUser;
        if (!user) {
            console.log("No user logged in for admin check.");
            return false;
        }

        try {
            console.log(`Checking admin role for user: ${user.uid}`);
            // Query the 'users' collection for the document with the user's UID
            // Force fetching from the server to bypass potential cache issues
            const userDoc = await window.db.collection('users').doc(user.uid).get({ source: 'server' });

            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log("User data found for admin check:", userData);

                // --- KEY CHECK: Is the user's role 'admin'? ---
                const isAdmin = userData.role === 'admin';
                console.log(`Admin check result: ${isAdmin}`);
                return isAdmin;
                // --- END KEY CHECK ---
                
            } else {
                console.log("No user document found for UID:", user.uid);
                return false; // User doc doesn't exist, deny admin access
            }
        } catch (error) {
            console.error("Error checking admin role:", error);
            // In case of an error (e.g., network issue, permission denied), deny access for security
            return false;
        }
    };

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
            showMessage("Please enter both email and password.", "warning");
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';
        }

        try {
            await window.handleFirebaseLogin(email, password);
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
            showMessage("Email, password, and full name are required.", "warning");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.", "warning");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must be at least 6 characters long.", "warning");
            return;
        }

        // Email validation regex (basic)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage("Please enter a valid email address.", "warning");
            return;
        }

        // Role-specific validation
        if (role === 'jobseeker' && (!username)) {
            showMessage("Username is required for jobseekers.", "warning");
            return;
        }
        if (role === 'employer' && (!companyName)) {
            showMessage("Company name is required for employers.", "warning");
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
            await window.handleFirebaseSignup(userData);
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

    /**
     * Generic handler for password reset forms.
     * Expects form to have an input named 'email'.
     */
    window.handlePasswordResetFormSubmit = async function(event) {
        event.preventDefault();
        console.log("Password reset form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email')?.trim();

        if (!email) {
            showMessage("Please enter your email address.", "warning");
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending Reset Link...';
        }

        try {
            await window.handleFirebasePasswordReset(email);
            // Success message is shown in handleFirebasePasswordReset
            // Optionally, clear the form or redirect
            form.reset();
        } catch (error) {
            // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Send Reset Link';
            }
            // Error message already shown in handleFirebasePasswordReset
            console.error("Password reset failed in global handler:", error);
        }
    };
    // --- End Form Submission Handlers ---

    // --- UTILITY FUNCTIONS ---
    /**
     * Displays a temporary message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('success', 'danger', 'warning', 'info').
     * @param {number} duration - How long to show the message in milliseconds (default 5000).
     */
    function showMessage(message, type = 'info', duration = 5000) {
        // Remove any existing messages
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message-toast message-toast-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius-md);
            color: white;
            font-weight: var(--font-weight-semibold);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            cursor: pointer;
            transition: opacity var(--transition-normal), transform var(--transition-normal);
            opacity: 0;
            transform: translateY(-20px);
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = 'var(--success-500)';
                break;
            case 'danger':
                messageElement.style.backgroundColor = 'var(--danger-500)';
                break;
            case 'warning':
                messageElement.style.backgroundColor = 'var(--warning-500)';
                break;
            case 'info':
            default:
                messageElement.style.backgroundColor = 'var(--primary-500)';
        }

        // Append to body
        document.body.appendChild(messageElement);

        // Fade in
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 100);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.remove();
                        }
                    }, 300); // Match transition duration
                }
            }, duration);
        }

        // Remove on click
        messageElement.addEventListener('click', function() {
            this.style.opacity = '0';
            this.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (this.parentNode) {
                    this.remove();
                }
            }, 300); // Match transition duration
        });
    }

    // Make showMessage globally available
    window.showMessage = showMessage;

    /**
     * Utility function to escape HTML to prevent XSS.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Make escapeHtml globally available
    window.escapeHtml = escapeHtml;

    // --- ATTACH LISTENERS TO EXISTING FORMS ON PAGE LOAD ---
    // This part might be redundant now as we are attaching listeners directly in the HTML pages
    // but it's kept for completeness or if you have forms dynamically added
    const loginForm = document.getElementById('loginForm'); // Make sure your login form has this ID
    if (loginForm) {
        console.log("Found login form, attaching submit listener");
        loginForm.addEventListener('submit', window.handleLoginFormSubmit);
    } else {
        console.log("Login form not found on this page");
    }

    const jobseekerSignupForm = document.getElementById('jobseekerSignupForm');
    if (jobseekerSignupForm) {
        console.log("Found jobseeker signup form, attaching submit listener");
        jobseekerSignupForm.addEventListener('submit', window.handleSignupFormSubmit);
    } else {
        console.log("Jobseeker signup form not found on this page");
    }

    const employerSignupForm = document.getElementById('employerSignupForm');
    if (employerSignupForm) {
        console.log("Found employer signup form, attaching submit listener");
        employerSignupForm.addEventListener('submit', window.handleSignupFormSubmit);
    } else {
        console.log("Employer signup form not found on this page");
    }

    const passwordResetForm = document.getElementById('passwordResetForm');
    if (passwordResetForm) {
        console.log("Found password reset form, attaching submit listener");
        passwordResetForm.addEventListener('submit', window.handlePasswordResetFormSubmit);
    } else {
        console.log("Password reset form not found on this page");
    }

    // Logout Button (if present on the page, e.g., in dashboard)
    // You might need to adjust the selector based on your actual logout button
    const logoutButtons = document.querySelectorAll('.logout-btn'); // Example: class 'logout-btn'
    if (logoutButtons.length > 0) {
        console.log(`Found ${logoutButtons.length} logout button(s), attaching click listeners`);
        logoutButtons.forEach(button => {
            // Remove any existing listener to prevent duplicates
            button.removeEventListener('click', window.handleFirebaseLogout);
            button.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default link behavior if it's an <a> tag
                window.handleFirebaseLogout();
            });
        });
    } else {
        console.log("No logout buttons found on this page");
    }
    // --- End DOMContentLoaded Event Listener ---
});