// js/profile.js - Profile related JavaScript for AtMyWorks (Updated for Avatar Upload)

console.log("Profile module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Profile DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db && window.firebaseApp.storage) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services (auth, db, storage) available in profile.js");
    } else {
        console.warn("Firebase not initialized in profile.js. Profile features will not work.");
        // Hide profile-dependent UI elements or show an error
        updateProfileUI(null);
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
                    updateProfileUI(null);
                    window.location.href = '/login.html'; // Redirect to login
                }
            });
        },

        /**
         * Loads the current user's profile data from Firestore.
         */
        async loadUserProfile() {
            if (!this.currentUser || !this.currentUserId) {
                console.warn("No user logged in, cannot load profile.");
                updateProfileUI(null);
                return;
            }

            // Show loading state
            updateProfileUI({ loading: true });

            try {
                console.log(`Loading profile for user: ${this.currentUserId}`);
                // Query Firestore for the user's document in the 'users' collection
                const userDoc = await window.db.collection('users').doc(this.currentUserId).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log("User data loaded:", userData);
                    
                    // Update UI with user data
                    updateProfileUI(userData);
                    
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
                    updateProfileUI(defaultData);
                    
                    // Optionally, create the user document
                    // await window.db.collection('users').doc(this.currentUserId).set(defaultData);
                }

            } catch (error) {
                console.error("Error loading user profile:", error);
                alert('Failed to load profile. Please try again.');
                updateProfileUI(null);
            }
        },

        /**
         * Saves changes made in the profile edit form to Firestore.
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

            const formData = new FormData(profileEditForm);
            const updatedData = {
                fullName: formData.get('fullName')?.trim(),
                username: formData.get('username')?.trim(),
                email: formData.get('email')?.trim(),
                phoneNumber: formData.get('phoneNumber')?.trim(),
                location: formData.get('location')?.trim(),
                bio: formData.get('bio')?.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Basic validation
            if (!updatedData.fullName || !updatedData.username) {
                alert("Full Name and Username are required.");
                return;
            }

            const submitButton = profileEditForm.querySelector('button[type="submit"]');
            const originalContent = submitButton ? submitButton.innerHTML : '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving Changes...';
            }

            try {
                console.log("Saving profile changes for user:", user.uid, updatedData);
                
                // --- HANDLE AVATAR UPLOAD ---
                const avatarUploadInput = document.getElementById('avatarUpload');
                if (avatarUploadInput && avatarUploadInput.files.length > 0) {
                    const file = avatarUploadInput.files[0];
                    if (file) {
                        console.log("Avatar file selected for upload:", file.name);
                        
                        // Validate file type and size
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
                        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
                        
                        if (!allowedTypes.includes(file.type)) {
                            throw new Error(`Invalid avatar file type. Please upload an image file (${allowedTypes.join(', ')}).`);
                        }
                        
                        if (file.size > maxSize) {
                            throw new Error(`Avatar file size exceeds 2MB limit. Please select a smaller image.`);
                        }
                        
                        // Upload avatar to Firebase Storage
                        const storageRef = window.storage.ref();
                        const avatarPath = `avatars/${user.uid}/${Date.now()}_${file.name}`;
                        const avatarRef = storageRef.child(avatarPath);
                        
                        const snapshot = await avatarRef.put(file);
                        const downloadURL = await snapshot.ref.getDownloadURL();
                        console.log("Avatar uploaded successfully:", downloadURL);
                        
                        // Add avatar URL to updated data
                        updatedData.avatarUrl = downloadURL;
                    }
                }
                // --- END AVATAR UPLOAD ---

                // Update user document in Firestore
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
                console.error("Error saving profile changes:", error);
                alert(`Failed to update profile: ${error.message}. Please try again.`);
            } finally {
                // Re-enable button on completion/error
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
            button.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default link behavior if it's an <a> tag
                window.handleFirebaseLogout();
            });
        });
    } else {
        console.log("No logout buttons found on this page");
    }
    
    // Handle Avatar Upload in Edit Mode
    const editAvatarContainer = document.getElementById('editAvatarContainer');
    const avatarUploadInput = document.getElementById('avatarUpload');
    if (editAvatarContainer && avatarUploadInput) {
        editAvatarContainer.addEventListener('click', function() {
            avatarUploadInput.click();
        });
        
        avatarUploadInput.addEventListener('change', function(e) {
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

        // Validate file size (e.g., 2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            alert('File size exceeds 2MB limit. Please select a smaller image.');
            return;
        }

        try {
            console.log("Uploading avatar for user:", user.uid);
            
            // Show loading state
            const editAvatarContainer = document.getElementById('editAvatarContainer');
            const editAvatarText = document.getElementById('editAvatarText');
            if (editAvatarContainer && editAvatarText) {
                editAvatarContainer.innerHTML = `
                    <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                `;
                editAvatarText.style.display = 'none';
            }

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
            if (editAvatarContainer) {
                editAvatarContainer.innerHTML = `
                    <img src="${downloadURL}" alt="User Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    <div style="position: absolute; bottom: 0; right: 0; background: var(--primary-500); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-camera"></i>
                    </div>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                `;
            }
            
            alert('Avatar uploaded successfully!');
            
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert(`Failed to upload avatar: ${error.message}. Please try again.`);
            
            // Restore original avatar UI on error
            const initials = (user.displayName || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase();
            if (editAvatarContainer) {
                editAvatarContainer.innerHTML = `
                    <span id="editAvatarText">${initials}</span>
                    <div style="position: absolute; bottom: 0; right: 0; background: var(--primary-500); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-camera"></i>
                    </div>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                `;
            }
        }
    }
    // --- END AVATAR UPLOAD HANDLER ---

    // --- UTILITY FUNCTIONS ---
    /**
     * Updates the profile UI based on user data or auth state.
     * @param {Object|null} userData - The user data from Firestore or null if not logged in.
     */
    function updateProfileUI(userData) {
        const profileView = document.getElementById('profileView');
        const profileEdit = document.getElementById('profileEdit');
        const authButtonsNav = document.getElementById('authButtonsNav');
        const userMenuNav = document.getElementById('userMenuNav');
        const logoutBtnNav = document.getElementById('logoutBtnNav');
        const userNameElementNav = document.getElementById('userNameNav');
        const dropdownUserNameElementNav = document.getElementById('dropdownUserNameNav');
        const dropdownUserEmailElementNav = document.getElementById('dropdownUserEmailNav');
        const userAvatarElementsNav = document.querySelectorAll('.user-avatar');

        if (userData && userData.loading) {
            // Show loading state
            console.log("Showing profile loading state");
            if (profileView) profileView.style.display = 'block';
            if (profileEdit) profileEdit.style.display = 'none';
            if (authButtonsNav) authButtonsNav.style.display = 'none';
            if (userMenuNav) userMenuNav.style.display = 'flex'; // Or 'block'

            // Update user name/avatar in menu with loading indicators
            const displayName = 'Loading...';
            const initials = (displayName || 'L').charAt(0).toUpperCase();
            
            if (userNameElementNav) {
                userNameElementNav.textContent = displayName;
            }
            if (dropdownUserNameElementNav) {
                dropdownUserNameElementNav.textContent = displayName;
            }
            if (dropdownUserEmailElementNav) {
                dropdownUserEmailElementNav.textContent = 'Loading email...';
            }

            userAvatarElementsNav.forEach(avatar => {
                if (avatar) {
                    avatar.textContent = initials;
                }
            });

            // Update profile view with loading indicators
            const profileNameElement = document.getElementById('profileName');
            const profileEmailElement = document.getElementById('profileEmail');
            const profileFullNameElement = document.getElementById('profileFullName');
            const profileUsernameElement = document.getElementById('profileUsername');
            const profileMemberSinceElement = document.getElementById('profileMemberSince');
            const profileLastSeenElement = document.getElementById('profileLastSeen');
            const profilePhoneElement = document.getElementById('profilePhone');
            const profileLocationElement = document.getElementById('profileLocation');
            const profileBioElement = document.getElementById('profileBio');

            if (profileNameElement) profileNameElement.textContent = 'Loading...';
            if (profileEmailElement) profileEmailElement.textContent = 'Loading email...';
            if (profileFullNameElement) profileFullNameElement.textContent = '...';
            if (profileUsernameElement) profileUsernameElement.textContent = '...';
            if (profileMemberSinceElement) profileMemberSinceElement.textContent = '...';
            if (profileLastSeenElement) profileLastSeenElement.textContent = '...';
            if (profilePhoneElement) profilePhoneElement.textContent = '...';
            if (profileLocationElement) profileLocationElement.textContent = '...';
            if (profileBioElement) profileBioElement.textContent = 'Loading profile information...';

        } else if (userData) {
            // User is signed in and data is loaded
            console.log("User is signed in, updating profile UI with data:", userData);
            if (authButtonsNav) authButtonsNav.style.display = 'none';
            if (userMenuNav) userMenuNav.style.display = 'flex'; // Or 'block'

            // Update user name/avatar in menu
            const displayName = userData.fullName || userData.username || userData.email?.split('@')[0] || 'User';
            const initials = (displayName || 'U').charAt(0).toUpperCase();
            
            if (userNameElementNav) {
                userNameElementNav.textContent = displayName;
            }
            if (dropdownUserNameElementNav) {
                dropdownUserNameElementNav.textContent = displayName;
            }
            if (dropdownUserEmailElementNav) {
                dropdownUserEmailElementNav.textContent = userData.email || 'No email';
            }

            userAvatarElementsNav.forEach(avatar => {
                if (avatar) {
                    avatar.textContent = initials;
                }
            });

            // Update profile view with user data
            const profileNameElement = document.getElementById('profileName');
            const profileEmailElement = document.getElementById('profileEmail');
            const profileFullNameElement = document.getElementById('profileFullName');
            const profileUsernameElement = document.getElementById('profileUsername');
            const profileMemberSinceElement = document.getElementById('profileMemberSince');
            const profileLastSeenElement = document.getElementById('profileLastSeen');
            const profilePhoneElement = document.getElementById('profilePhone');
            const profileLocationElement = document.getElementById('profileLocation');
            const profileBioElement = document.getElementById('profileBio');

            if (profileNameElement) {
                profileNameElement.textContent = displayName;
            }
            if (profileEmailElement) {
                profileEmailElement.textContent = userData.email || 'No email';
            }
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

            // Update profile edit form with user data
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
                const initials = (userData.fullName || userData.username || userData.email?.split('@')[0] || 'U').charAt(0).toUpperCase();
                editAvatarTextElement.textContent = initials;
            }

        } else {
            // User is signed out
            console.log("User is signed out, updating profile UI");
            if (authButtonsNav) authButtonsNav.style.display = 'flex'; // Or 'block'
            if (userMenuNav) userMenuNav.style.display = 'none';

            // Hide profile sections
            if (profileView) profileView.style.display = 'none';
            if (profileEdit) profileEdit.style.display = 'none';
        }
    }

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

    // --- END UTILITY FUNCTIONS ---
});