// js/create-gig.js - Gig creation related JavaScript for AtMyWorks

console.log("Create Gig module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Create Gig DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db && window.firebaseApp.storage) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services (auth, db, storage) available in create-gig.js");
    } else {
        console.warn("Firebase not initialized in create-gig.js. Gig creation features will not work.");
        // Hide gig creation UI or show an error
        // updateGigCreationUI(null);
        return;
    }

    // --- GIG CREATION LOGIC ---
    // This logic handles the creation of a new gig/service listing

    /**
     * Handles gig creation form submission.
     * @param {Event} event - The form submission event.
     */
    window.handleCreateGigFormSubmit = async function(event) {
        event.preventDefault();
        console.log("Create Gig form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const title = formData.get('title')?.trim();
        const category = formData.get('category');
        const description = formData.get('description')?.trim();
        const deliveryTime = parseInt(formData.get('deliveryTime'));
        const price = parseFloat(formData.get('price'));
        const tags = formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const imageFiles = formData.getAll('images'); // Get all selected image files

        // --- BASIC VALIDATION ---
        if (!title || !category || !description || isNaN(deliveryTime) || deliveryTime <= 0 || isNaN(price) || price <= 0) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        // Validate image files
        if (!imageFiles || imageFiles.length === 0) {
            alert("Please upload at least one image.");
            return;
        }

        const user = window.auth.currentUser;
        if (!user) {
            alert("You must be logged in to create a gig.");
            window.location.href = '/login.html';
            return;
        }

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Gig...';
        }

        try {
            console.log("Preparing gig data for creation:", { title, category, description, deliveryTime, price, tags });

            // --- UPLOAD IMAGES TO FIREBASE STORAGE ---
            const imageUrls = [];
            if (imageFiles && imageFiles.length > 0) {
                for (const file of imageFiles) {
                    if (file && file.size > 0) {
                        // Create a unique path for each image
                        const imagePath = `gigs/${user.uid}/${Date.now()}_${file.name}`;
                        console.log("Uploading image to path:", imagePath);

                        // Upload image and get download URL
                        const downloadURL = await window.uploadFileToStorage(file, imagePath);
                        imageUrls.push(downloadURL);
                        console.log("Image uploaded successfully:", downloadURL);
                    }
                }
            }
            // --- END IMAGE UPLOAD ---

            // --- PREPARE GIG DATA FOR FIRESTORE ---
            const gigData = {
                title: title,
                category: category,
                description: description,
                deliveryTime: deliveryTime,
                startingPrice: price,
                tags: tags,
                imageUrls: imageUrls, // Array of image URLs from Storage
                freelancerId: user.uid, // Explicitly store UID
                freelancerName: user.displayName || user.email?.split('@')[0] || 'Freelancer', // This would ideally come from user profile
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active' // Default status
            };
            // --- END GIG DATA PREPARATION ---

            console.log("Gig data prepared for Firestore:", gigData);

            // --- SAVE GIG DATA TO FIRESTORE ---
            const docRef = await window.db.collection('gigs').add(gigData);
            console.log("Gig created successfully with ID:", docRef.id);
            // --- END GIG SAVE ---

            // Show success message
            alert('Gig created successfully!');

            // Redirect to freelancer dashboard or the new gig page
            window.location.href = '/dashboard-freelancer.html'; // Or /gig-detail.html?id=GIG_ID_HERE

        } catch (error) {
            console.error("Error creating gig:", error);
            alert(`Gig creation failed: ${error.message}. Please try again.`);
        } finally {
            // Re-enable button on completion/error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Gig';
            }
        }
    };

    // --- IMAGE UPLOAD HANDLING ---
    const imageUploadArea = document.getElementById('imageUploadArea');
    const gigImagesInput = document.getElementById('gigImages');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    if (imageUploadArea && gigImagesInput && imagePreviewContainer) {
        console.log("Found image upload area and input, attaching click and change listeners");

        // Handle click on upload area to trigger file input
        imageUploadArea.addEventListener('click', function() {
            gigImagesInput.click();
        });

        // Handle file selection and preview
        gigImagesInput.addEventListener('change', function(e) {
            imagePreviewContainer.innerHTML = ''; // Clear previous previews
            const files = e.target.files;
            if (files) {
                console.log("Selected files for gig images:", files.length);
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            const imgContainer = document.createElement('div');
                            imgContainer.style.position = 'relative';
                            imgContainer.style.width = '100px';
                            imgContainer.style.height = '100px';

                            const img = document.createElement('img');
                            img.src = event.target.result;
                            img.alt = file.name;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'cover';
                            img.style.borderRadius = 'var(--border-radius-md)';
                            img.style.boxShadow = 'var(--shadow-xs)';

                            imgContainer.appendChild(img);
                            imagePreviewContainer.appendChild(imgContainer);
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        });
    } else {
        console.log("Image upload area, input, or preview container not found on create-gig.html");
    }
    // --- END IMAGE UPLOAD HANDLING ---

    // --- ATTACH LISTENER TO GIG CREATION FORM ---
    const createGigForm = document.getElementById('createGigForm');
    if (createGigForm) {
        console.log("Found create gig form, attaching submit listener");
        createGigForm.addEventListener('submit', window.handleCreateGigFormSubmit);
    } else {
        console.log("Create gig form not found on create-gig.html");
    }
    // --- END FORM ATTACHMENT ---
});