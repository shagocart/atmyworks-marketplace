// js/profile.js - Profile related JavaScript for AtMyWorks

console.log("Profile module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Profile DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in profile.js");
    } else {
        console.warn("Firebase not initialized in profile.js. Profile features will not work.");
        // Hide profile-dependent UI elements or show an error
        hideProfileUI();
        return;
    }

    // --- PROFILE SYSTEM LOGIC ---
    window.ProfileSystem = {
        currentUser: null,
        currentUserId: null,

        /**
         * Initializes the profile system.
         * Sets up auth state listener and loads initial profile data.
         */
        async init() {
            console.log("Initializing Profile System...");
            
            // Listen for auth state changes (login/logout)
            window.auth.onAuthStateChanged(user => {
                if (user) {
                    this.currentUser = user;
                    this.currentUserId = user.uid;
                    console.log("User logged in for profile:", user.uid, user.email);
                    this.loadUserProfile();
                } else {
                    this.currentUser = null;
                    this.currentUserId = null;
                    console.log("User logged out from profile system");
                    hideProfileUI();
                    // Redirect to login or homepage
                    // window.location.href = '/login.html';
                }
            });
        },

        /**
         * Loads the current user's profile data from Firestore.
         */
        async loadUserProfile() {
            if (!this.currentUser || !this.currentUserId) {
                console.warn("No user logged in, cannot load profile.");
                hideProfileUI();
                return;
            }

            const profileView = document.getElementById('profileView');
            const profileEdit = document.getElementById('profileEdit');
            const profileNameElement = document.getElementById('profileName');
            const profileEmailElement = document.getElementById('profileEmail');
            const profileAvatarTextElements = document.querySelectorAll('.user-avatar');
            const dropdownUserNameElement = document.getElementById('dropdownUserName');
            const dropdownUserEmailElement = document.getElementById('dropdownUserEmail');
            const userAvatarElements = document.querySelectorAll('.user-avatar');

            // Show loading state in view mode
            if (profileNameElement) profileNameElement.textContent = 'Loading...';
            if (profileEmailElement) profileEmailElement.textContent = this.currentUser.email || '';
            if (dropdownUserNameElement) dropdownUserNameElement.textContent = 'Loading...';
            if (dropdownUserEmailElement) dropdownUserEmailElement.textContent = this.currentUser.email || '';
            
            profileAvatarTextElements.forEach(avatar => {
                if (avatar) {
                    const initials = (this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'U').charAt(0).toUpperCase();
                    avatar.textContent = initials;
                }
            });

            try {
                console.log(`Loading profile for user: ${this.currentUserId}`);
                // Query Firestore for the user's document in the 'users' collection
                const userDoc = await window.db.collection('users').doc(this.currentUserId).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log("User data loaded:", userData);
                    
                    // Update view mode with user data
                    this.updateProfileView(userData);
                    // Populate edit form with user data
                    this.populateEditForm(userData);
                    
                } else {
                    console.warn("User document not found in Firestore:", this.currentUserId);
                    // Handle case where user doc doesn't exist yet
                    const defaultData = {
                        uid: this.currentUserId,
                        email: this.currentUser.email || '',
                        fullName: 'New User',
                        username: this.currentUser.email ? this.currentUser.email.split('@')[0] : 'user',
                        role: 'client', // Default assumption
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    // Update view mode with default data
                    this.updateProfileView(defaultData);
                    // Populate edit form with default data
                    this.populateEditForm(defaultData);
                    
                    // Optionally, create the user document
                    // await window.db.collection('users').doc(this.currentUserId).set(defaultData);
                }

            } catch (error) {
                console.error("Error loading user profile:", error);
                alert('Failed to load profile. Please try again.');
                hideProfileUI();
            }
        },

        /**
         * Updates the profile view section with user data.
         * @param {Object} userData - The user data from Firestore.
         */
        updateProfileView(userData) {
            const profileView = document.getElementById('profileView');
            const profileNameElement = document.getElementById('profileName');
            const profileEmailElement = document.getElementById('profileEmail');
            const profileAvatarTextElements = document.querySelectorAll('.user-avatar');
            const dropdownUserNameElement = document.getElementById('dropdownUserName');
            const dropdownUserEmailElement = document.getElementById('dropdownUserEmail');
            const userAvatarElements = document.querySelectorAll('.user-avatar');
            const roleTextElement = document.getElementById('roleText');

            if (profileView) {
                profileView.style.display = 'block';
                
                // Update user name/avatar in view mode
                const displayName = userData.fullName || userData.username || userData.email?.split('@')[0] || 'User';
                const initials = (displayName || 'U').charAt(0).toUpperCase();
                
                if (profileNameElement) {
                    profileNameElement.textContent = displayName;
                }
                if (profileEmailElement) {
                    profileEmailElement.textContent = userData.email || 'No email';
                }
                if (roleTextElement) {
                    roleTextElement.textContent = userData.role || 'client';
                }
                
                profileAvatarTextElements.forEach(avatar => {
                    if (avatar) {
                        avatar.textContent = initials;
                    }
                });
                
                // Update dropdown menu user info
                if (dropdownUserNameElement) {
                    dropdownUserNameElement.textContent = displayName;
                }
                if (dropdownUserEmailElement) {
                    dropdownUserEmailElement.textContent = userData.email || 'No email';
                }
                
                // Update user avatar initials
                userAvatarElements.forEach(avatar => {
                    if (avatar) {
                        avatar.textContent = initials;
                    }
                });

                // Update other profile fields
                const profileFullNameElement = document.getElementById('profileFullName');
                const profileUsernameElement = document.getElementById('profileUsername');
                const profileMemberSinceElement = document.getElementById('profileMemberSince');
                const profileLastSeenElement = document.getElementById('profileLastSeen');
                const profilePhoneElement = document.getElementById('profilePhone');
                const profileLocationElement = document.getElementById('profileLocation');
                const profileBioElement = document.getElementById('profileBio');
                
                if (profileFullNameElement) {
                    profileFullNameElement.textContent = userData.fullName || '-';
                }
                if (profileUsernameElement) {
                    profileUsernameElement.textContent = userData.username || '-';
                }
                if (profileMemberSinceElement) {
                    let formattedDate = 'N/A';
                    if (userData.createdAt) {
                        const dateObj = userData.createdAt.toDate();
                        formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                    }
                    profileMemberSinceElement.textContent = formattedDate;
                }
                if (profileLastSeenElement) {
                    let formattedDate = 'Recently';
                    if (userData.lastSeen) {
                        const dateObj = userData.lastSeen.toDate();
                        formattedDate = dateObj.toLocaleString(); // e.g., 10/27/2023, 10:30:00 AM
                    }
                    profileLastSeenElement.textContent = formattedDate;
                }
                if (profilePhoneElement) {
                    profilePhoneElement.textContent = userData.phoneNumber || '-';
                }
                if (profileLocationElement) {
                    profileLocationElement.textContent = userData.location || '-';
                }
                if (profileBioElement) {
                    profileBioElement.textContent = userData.bio || 'No bio available.';
                }
                
                console.log("Profile view updated with user data");
            }
        },

        /**
         * Populates the profile edit form with user data.
         * @param {Object} userData - The user data from Firestore.
         */
        populateEditForm(userData) {
            const editFullNameInput = document.getElementById('editFullName');
            const editUsernameInput = document.getElementById('editUsername');
            const editEmailInput = document.getElementById('editEmail');
            const editPhoneInput = document.getElementById('editPhone');
            const editLocationInput = document.getElementById('editLocation');
            const editBioTextarea = document.getElementById('editBio');
            const editAvatarTextElement = document.getElementById('editAvatarText');
            
            if (editFullNameInput) {
                editFullNameInput.value = userData.fullName || '';
            }
            if (editUsernameInput) {
                editUsernameInput.value = userData.username || '';
            }
            if (editEmailInput) {
                editEmailInput.value = userData.email || '';
            }
            if (editPhoneInput) {
                editPhoneInput.value = userData.phoneNumber || '';
            }
            if (editLocationInput) {
                editLocationInput.value = userData.location || '';
            }
            if (editBioTextarea) {
                editBioTextarea.value = userData.bio || '';
            }
            if (editAvatarTextElement) {
                const displayName = userData.fullName || userData.username || userData.email?.split('@')[0] || 'U';
                const initials = (displayName || 'U').charAt(0).toUpperCase();
                editAvatarTextElement.textContent = initials;
            }
            
            console.log("Profile edit form populated with user data");
        },

        /**
         * Saves changes made in the profile edit form to Firestore.
         * CORRECTED VERSION TO HANDLE UNDEFINED VALUES
         */
        async saveProfileChanges() {
            const user = window.auth.currentUser;
            if (!user) {
                alert('You must be logged in to save changes.');
                return;
            }

            const profileEditForm = document.getElementById('profileEditForm');
            if (!profileEditForm) {
                console.warn("Profile edit form not found.");
                return;
            }

            // --- CORRECTED DATA PREPARATION ---
            // Use FormData to collect form data
            const formData = new FormData(profileEditForm);
            
            // Prepare data object, explicitly handling potentially undefined values
            const updatedData = {};
            
            // Collect and trim values
            const fullName = formData.get('fullName')?.trim();
            const username = formData.get('username')?.trim();
            const email = formData.get('email')?.trim();
            const phoneNumber = formData.get('phoneNumber')?.trim();
            const location = formData.get('location')?.trim();
            const bio = formData.get('bio')?.trim();
            
            // Add fields to updatedData only if they are not undefined/null
            // This prevents Firestore from receiving 'undefined' values
            if (fullName !== undefined && fullName !== null) updatedData.fullName = fullName;
            if (username !== undefined && username !== null) updatedData.username = username;
            if (email !== undefined && email !== null) updatedData.email = email;
            if (phoneNumber !== undefined && phoneNumber !== null) updatedData.phoneNumber = phoneNumber;
            if (location !== undefined && location !== null) updatedData.location = location;
            if (bio !== undefined && bio !== null) updatedData.bio = bio;
            
            // Always update the timestamp
            updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            // --- END CORRECTED DATA PREPARATION ---

            // Basic Validation
            if (!updatedData.fullName) {
                alert('Full Name is required.');
                return;
            }

            if (!updatedData.username) {
                alert('Username is required.');
                return;
            }

            // Email validation regex (basic)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updatedData.email)) {
                alert('Please enter a valid email address.');
                return;
            }

            console.log("Prepared user data for update:", updatedData);

            // Show loading state on submit button
            const submitButton = profileEditForm.querySelector('button[type="submit"]');
            const originalContent = submitButton ? submitButton.innerHTML : '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving Changes...';
            }

            try {
                console.log("Saving profile changes for user:", user.uid);
                
                // --- HANDLE EMAIL CHANGE ---
                if (updatedData.email && updatedData.email !== user.email) {
                    console.log("Email change detected:", updatedData.email);
                    if (!confirm("Changing your email will require verification. Do you want to proceed?")) {
                        return;
                    }
                    
                    // Update email in Firebase Authentication
                    await user.updateEmail(updatedData.email);
                    console.log("Firebase Auth email updated successfully");
                    
                    // Send verification email to the new address
                    await user.sendEmailVerification();
                    console.log("Verification email sent to new address:", updatedData.email);
                    
                    alert(`Email updated to ${updatedData.email}. A verification email has been sent to the new address.`);
                }
                // --- END EMAIL CHANGE HANDLING ---

                // Update user document in Firestore
                // Only send defined fields to prevent 'undefined' errors
                await window.db.collection('users').doc(user.uid).update(updatedData);
                console.log("User data updated in Firestore for UID:", user.uid);
                
                // Update last seen timestamp
                await window.db.collection('users').doc(user.uid).update({
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Show success message
                alert('Profile updated successfully!');
                
                // Reload the profile view to show updated data
                this.loadUserProfile();
                
                // Switch back to view mode
                this.switchToViewMode();
                
            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Error saving profile changes:", errorCode, errorMessage);
                
                // Provide user-friendly error messages
                let userMessage = `Failed to update profile: ${errorMessage}`;
                if (errorCode === 'auth/email-already-in-use') {
                    userMessage = "This email is already registered. Please try logging in.";
                } else if (errorCode === 'auth/invalid-email') {
                    userMessage = "Please enter a valid email address.";
                } else if (errorCode === 'auth/requires-recent-login') {
                     userMessage = "For security reasons, please log out and log back in before changing your email.";
                } else if (errorCode === 'auth/network-request-failed') {
                     userMessage = "Network error. Please check your internet connection.";
                } else if (errorCode === 'auth/user-disabled') {
                    userMessage = "This account has been disabled. Please contact support.";
                } else if (errorCode === 'auth/user-not-found') {
                     userMessage = "User account not found. Please try logging in again.";
                } else if (errorCode === 'auth/operation-not-allowed') {
                     userMessage = "Email/password accounts are not enabled. Please contact support.";
                } else if (errorCode === 'auth/weak-password') {
                     userMessage = "Password is too weak. Please use a stronger password (at least 6 characters).";
                } else if (errorCode === 'auth/too-many-requests') {
                     userMessage = "Too many requests. Please try again later.";
                }
                alert(userMessage);
                
            } finally {
                // Re-enable button and restore original content
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalContent || 'Save Changes';
                }
            }
        },

        /**
         * Switches the profile UI to view mode.
         */
        switchToViewMode() {
            const profileView = document.getElementById('profileView');
            const profileEdit = document.getElementById('profileEdit');
            
            if (profileView) profileView.style.display = 'block';
            if (profileEdit) profileEdit.style.display = 'none';
            
            console.log("Switched to profile view mode");
        },

        /**
         * Switches the profile UI to edit mode.
         */
        switchToEditMode() {
            const profileView = document.getElementById('profileView');
            const profileEdit = document.getElementById('profileEdit');
            
            if (profileView) profileView.style.display = 'none';
            if (profileEdit) profileEdit.style.display = 'block';
            
            console.log("Switched to profile edit mode");
        },

        /**
         * Resets the profile edit form to its initial state.
         */
        resetEditForm() {
            const profileEditForm = document.getElementById('profileEditForm');
            if (profileEditForm) {
                profileEditForm.reset();
                console.log("Profile edit form reset");
            }
        }
    };

    // Initialize the profile system
    window.ProfileSystem.init();

    // --- ATTACH EVENT LISTENERS ---
    // Handle Edit Profile Button Click
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            console.log("Edit Profile button clicked");
            window.ProfileSystem.switchToEditMode();
        });
    }

    // Handle Cancel Edit Button Click
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            console.log("Cancel Edit button clicked");
            window.ProfileSystem.resetEditForm();
            window.ProfileSystem.switchToViewMode();
        });
    }

    // Handle Profile Edit Form Submission
    const profileEditForm = document.getElementById('profileEditForm');
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("Profile edit form submitted");
            await window.ProfileSystem.saveProfileChanges();
        });
    }

    // Handle Logout Button Click (in header or user menu)
    const logoutButtons = document.querySelectorAll('.logout-btn');
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
    
    // Handle Avatar Upload in View Mode
    const profileAvatarContainer = document.getElementById('profileAvatarContainer');
    const avatarUploadInput = document.getElementById('avatarUpload');
    if (profileAvatarContainer && avatarUploadInput) {
        profileAvatarContainer.addEventListener('click', function() {
            avatarUploadInput.click();
        });
        
        avatarUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log("Avatar file selected in view mode:", file.name);
                handleAvatarUpload(file);
            }
        });
    }
    
    // Handle Avatar Upload in Edit Mode
    const editAvatarContainer = document.getElementById('editAvatarContainer');
    const editAvatarUploadInput = document.getElementById('editAvatarUpload');
    if (editAvatarContainer && editAvatarUploadInput) {
        editAvatarContainer.addEventListener('click', function() {
            editAvatarUploadInput.click();
        });
        
        editAvatarUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log("Avatar file selected in edit mode:", file.name);
                handleAvatarUpload(file);
            }
        });
    }

    // --- AVATAR UPLOAD HANDLER ---
    async function handleAvatarUpload(file) {
        const user = window.auth.currentUser;
        if (!user) {
            alert('You must be logged in to upload an avatar.');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG, GIF).');
            return;
        }

        // Validate file size (e.g., 5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            alert('File size exceeds 5MB limit. Please select a smaller image.');
            return;
        }

        try {
            console.log("Uploading avatar for user:", user.uid);
            
            // Show loading state
            const profileAvatarContainers = document.querySelectorAll('#profileAvatarContainer, #editAvatarContainer');
            profileAvatarContainers.forEach(container => {
                if (container) {
                    container.innerHTML = `
                        <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                        <input type="file" id="editAvatarUpload" accept="image/*" style="display: none;">
                    `;
                }
            });

            // Upload avatar to Firebase Storage
            const storageRef = window.storage.ref();
            const avatarRef = storageRef.child(`avatars/${user.uid}/${Date.now()}_${file.name}`);
            const snapshot = await avatarRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log("Avatar uploaded successfully:", downloadURL);
            
            // Update user document in Firestore with avatar URL
            await window.db.collection('users').doc(user.uid).update({
                avatarUrl: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("User document updated with avatar URL for UID:", user.uid);
            
            // Update UI with new avatar
            profileAvatarContainers.forEach(container => {
                if (container) {
                    container.innerHTML = `
                        <img src="${downloadURL}" alt="User Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                        <input type="file" id="editAvatarUpload" accept="image/*" style="display: none;">
                        <div id="avatarCameraOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--transition-fast);">
                            <i class="fas fa-camera" style="color: var(--white); font-size: 2rem;"></i>
                        </div>
                    `;
                    
                    // Add hover effect back
                    container.addEventListener('mouseenter', function() {
                        const overlay = this.querySelector('#avatarCameraOverlay');
                        if (overlay) overlay.style.opacity = '1';
                    });
                    container.addEventListener('mouseleave', function() {
                        const overlay = this.querySelector('#avatarCameraOverlay');
                        if (overlay) overlay.style.opacity = '0';
                    });
                }
            });
            
            // Also update dropdown avatars
            const dropdownAvatars = document.querySelectorAll('.user-avatar');
            dropdownAvatars.forEach(avatar => {
                if (avatar) {
                    avatar.innerHTML = `<img src="${downloadURL}" alt="User Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
            });
            
            alert('Avatar uploaded successfully!');
            
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert(`Failed to upload avatar: ${error.message}. Please try again.`);
            
            // Restore original avatar UI on error
            const initials = (user.displayName || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase();
            profileAvatarContainers.forEach(container => {
                if (container) {
                    container.innerHTML = `
                        <span id="profileAvatarText">${initials}</span>
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                        <input type="file" id="editAvatarUpload" accept="image/*" style="display: none;">
                        <div id="avatarCameraOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--transition-fast);">
                            <i class="fas fa-camera" style="color: var(--white); font-size: 2rem;"></i>
                        </div>
                    `;
                    
                    // Add hover effect back
                    container.addEventListener('mouseenter', function() {
                        const overlay = this.querySelector('#avatarCameraOverlay');
                        if (overlay) overlay.style.opacity = '1';
                    });
                    container.addEventListener('mouseleave', function() {
                        const overlay = this.querySelector('#avatarCameraOverlay');
                        if (overlay) overlay.style.opacity = '0';
                    });
                }
            });
        }
    }
    // --- END AVATAR UPLOAD HANDLER ---

    console.log("Profile.js event listeners attached");
});