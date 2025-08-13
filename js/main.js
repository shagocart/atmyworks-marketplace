// js/main.js - Core JavaScript for AtMyWorks Platform

console.log("Main JS module loaded");

// --- UTILITY FUNCTIONS ---
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

/**
 * Formats a number as currency.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency code (e.g., 'USD', 'PHP').
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number' || isNaN(amount)) {
        // Handle invalid or missing amounts gracefully
        return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Make utility functions globally accessible
window.escapeHtml = escapeHtml;
window.formatCurrency = formatCurrency; // <-- Add this line

console.log("Utility functions (escapeHtml, formatCurrency) attached to window object");
// --- END UTILITY FUNCTIONS ---

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Main JS DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in main.js");
    } else {
        console.warn("Firebase not initialized in main.js. Some features might not work.");
        // Hide auth-dependent UI elements or show an error
        updateAuthUI(null);
        return;
    }

    // --- GENERIC AUTH UI UPDATER ---
    function updateAuthUI(user) {
        const authButtonsNav = document.getElementById('authButtonsNav');
        const userMenuNav = document.getElementById('userMenuNav');
        const logoutBtnNav = document.getElementById('logoutBtnNav');
        const userNameElementNav = document.getElementById('userNameNav');
        const dropdownUserNameElementNav = document.getElementById('dropdownUserNameNav');
        const dropdownUserEmailElementNav = document.getElementById('dropdownUserEmailNav');
        const userAvatarElementsNav = document.querySelectorAll('.user-avatar');

        if (user) {
            // User is signed in
            console.log("User is signed in on main.js:", user.email);
            if (authButtonsNav) authButtonsNav.style.display = 'none';
            if (userMenuNav) {
                userMenuNav.style.display = 'flex'; // Or 'block'

                // Update user name/avatar in menu
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                if (userNameElementNav) {
                    userNameElementNav.textContent = displayName;
                }
                if (dropdownUserNameElementNav) {
                    dropdownUserNameElementNav.textContent = displayName;
                }
                if (dropdownUserEmailElementNav) {
                    dropdownUserEmailElementNav.textContent = user.email || 'No email';
                }

                // Update user avatar initials
                const initials = (displayName || 'U').charAt(0).toUpperCase();
                userAvatarElementsNav.forEach(avatar => {
                    if (avatar) {
                        avatar.textContent = initials;
                    }
                });

                // Determine user role and update dashboard link
                // In a real app, you'd fetch this from Firestore
                // For now, we'll simulate based on email or UID prefix
                let userRole = 'client'; // Default assumption
                if (user.email && (user.email.includes('admin') || user.email.includes('support'))) {
                    userRole = 'admin';
                } else if (user.email && user.email.includes('freelancer')) {
                    userRole = 'freelancer';
                }
                console.log("Simulated user role on main.js:", userRole);

                if (dashboardMenuLinkNav) {
                    if (userRole === 'freelancer') {
                        dashboardMenuLinkNav.href = '/dashboard-freelancer.html';
                        dashboardMenuLinkNav.innerHTML = '<i class="fas fa-briefcase" style="margin-right: 0.75rem; width: 20px; text-align: center;"></i> My Gigs';
                    } else if (userRole === 'admin') {
                        dashboardMenuLinkNav.href = '/dashboard-admin.html';
                        dashboardMenuLinkNav.innerHTML = '<i class="fas fa-cog" style="margin-right: 0.75rem; width: 20px; text-align: center;"></i> Admin Panel';
                    } else {
                        dashboardMenuLinkNav.href = '/dashboard-client.html';
                        dashboardMenuLinkNav.innerHTML = '<i class="fas fa-tachometer-alt" style="margin-right: 0.75rem; width: 20px; text-align: center;"></i> My Projects';
                    }
                }

                if (logoutBtnNav) {
                    // Remove any existing listener to prevent duplicates
                    logoutBtnNav.removeEventListener('click', window.handleFirebaseLogout);
                    logoutBtnNav.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default link behavior if it's an <a> tag
                        window.handleFirebaseLogout();
                    });
                }

            }
        } else {
            // User is signed out
            console.log("User is signed out on main.js");
            if (authButtonsNav) authButtonsNav.style.display = 'flex'; // Or 'block'
            if (userMenuNav) userMenuNav.style.display = 'none';

            // Remove logout listener if it was added previously (good practice)
            if (logoutBtnNav) {
                logoutBtnNav.removeEventListener('click', window.handleFirebaseLogout);
            }
        }
    }

    // --- END GENERIC AUTH UI UPDATER ---

    // --- HERO SEARCH FUNCTIONALITY ---
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
    // --- END HERO SEARCH FUNCTIONALITY ---

    // --- NEWSLETTER FORM (Footer) ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
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

            console.log("Subscribing footer email:", email);
            // In a full implementation, send this to your backend or Firebase
            alert(`Thank you for subscribing with ${email}!`);
            emailInput.value = '';
        });
    }
    // --- END NEWSLETTER FORM ---
});

// js/main.js - Core JavaScript for AtMyWorks Platform

console.log("Main JS module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Main JS DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in main.js");
    } else {
        console.warn("Firebase not initialized in main.js. Some features might not work.");
        // Hide auth-dependent UI elements or show an error
        updateAuthUI(null);
        return;
    }

    // --- GENERIC AUTH UI UPDATER ---
    function updateAuthUI(user) {
        const authButtonsNav = document.getElementById('authButtonsNav');
        const userMenuNav = document.getElementById('userMenuNav');
        const logoutBtnNav = document.getElementById('logoutBtnNav');
        const userNameElementNav = document.getElementById('userNameNav');
        const dropdownUserNameElementNav = document.getElementById('dropdownUserNameNav');
        const dropdownUserEmailElementNav = document.getElementById('dropdownUserEmailNav');
        const userAvatarElementsNav = document.querySelectorAll('.user-avatar');

        if (user) {
            // User is signed in
            console.log("User is signed in on main.js:", user.email);
            if (authButtonsNav) authButtonsNav.style.display = 'none';
            if (userMenuNav) {
                userMenuNav.style.display = 'flex'; // Or 'block'

                // Update user name/avatar in menu
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                if (userNameElementNav) {
                    userNameElementNav.textContent = displayName;
                }
                if (dropdownUserNameElementNav) {
                    dropdownUserNameElementNav.textContent = displayName;
                }
                if (dropdownUserEmailElementNav) {
                    dropdownUserEmailElementNav.textContent = user.email || 'No email';
                }

                // Update user avatar initials
                const initials = (displayName || 'U').charAt(0).toUpperCase();
                userAvatarElementsNav.forEach(avatar => {
                    if (avatar) {
                        avatar.textContent = initials;
                    }
                });

                // Determine user role and update dashboard link
                // In a real app, you'd fetch this from Firestore
                // For now, we'll simulate based on email or UID prefix
                let userRole = 'client'; // Default assumption
                if (user.email && (user.email.includes('admin') || user.email.includes('support'))) {
                    userRole = 'admin';
                } else if (user.email && user.email.includes('freelancer')) {
                    userRole = 'freelancer';
                }
                console.log("Simulated user role on main.js:", userRole);

                if (dashboardMenuLinkNav) {
                    if (userRole === 'freelancer') {
                        dashboardMenuLinkNav.href = '/dashboard-freelancer.html';
                        dashboardMenuLinkNav.innerHTML = '<i class="fas fa-briefcase" style="margin-right: 0.75rem; width: 20px; text-align: center;"></i> My Gigs';
                    } else if (userRole === 'admin') {
                        dashboardMenuLinkNav.href = '/dashboard-admin.html';
                        dashboardMenuLinkNav.innerHTML = '<i class="fas fa-cog" style="margin-right: 0.75rem; width: 20px; text-align: center;"></i> Admin Panel';
                    } else {
                        dashboardMenuLinkNav.href = '/dashboard-client.html';
                        dashboardMenuLinkNav.innerHTML = '<i class="fas fa-tachometer-alt" style="margin-right: 0.75rem; width: 20px; text-align: center;"></i> My Projects';
                    }
                }

                if (logoutBtnNav) {
                    // Remove any existing listener to prevent duplicates
                    logoutBtnNav.removeEventListener('click', window.handleFirebaseLogout);
                    logoutBtnNav.addEventListener('click', function(e) {
                        e.preventDefault(); // Prevent default link behavior if it's an <a> tag
                        window.handleFirebaseLogout();
                    });
                }

            }
        } else {
            // User is signed out
            console.log("User is signed out on main.js");
            if (authButtonsNav) authButtonsNav.style.display = 'flex'; // Or 'block'
            if (userMenuNav) userMenuNav.style.display = 'none';

            // Remove logout listener if it was added previously (good practice)
            if (logoutBtnNav) {
                logoutBtnNav.removeEventListener('click', window.handleFirebaseLogout);
            }
        }
    }

    // --- USER MENU TOGGLE ---
    const userMenuToggleNav = document.getElementById('userMenuToggleNav');
    const userMenuDropdownNav = document.getElementById('userMenuDropdownNav');

    if (userMenuToggleNav && userMenuDropdownNav) {
        userMenuToggleNav.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            userMenuDropdownNav.style.display = isExpanded ? 'none' : 'block';
            console.log("User menu toggled on main.js");
        });

        // Close user menu if clicked outside
        document.addEventListener('click', function(e) {
            if (!userMenuToggleNav.contains(e.target) && !userMenuDropdownNav.contains(e.target)) {
                userMenuToggleNav.setAttribute('aria-expanded', 'false');
                userMenuDropdownNav.style.display = 'none';
            }
        });
    }

    // --- HERO SEARCH FUNCTIONALITY ---
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

    // --- NEWSLETTER FORM (Footer) ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
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

    // --- ENHANCED CATEGORY MANAGEMENT ---
    window.CategoryManagement = {
        /**
         * Loads categories from Firestore and populates the grid.
         */
        async loadCategories() {
            console.log("Loading categories...");
            const categoriesGrid = document.querySelector('.categories-grid');
            if (!categoriesGrid) {
                console.warn("Categories grid not found.");
                return;
            }

            // Show loading state
            categoriesGrid.innerHTML = '<div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;"><div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div><p>Loading categories...</p></div>';

            try {
                // Query Firestore for categories
                const querySnapshot = await window.db.collection('categories').orderBy('name').get();

                if (querySnapshot.empty) {
                    categoriesGrid.innerHTML = '<div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;"><p>No categories available yet.</p></div>';
                    return;
                }

                let categoriesHtml = '';
                querySnapshot.forEach(doc => {
                    const categoryData = doc.data();
                    const categoryId = doc.id;

                    // Determine icon
                    let iconHtml = '<i class="fas fa-tag"></i>'; // Default icon
                    if (categoryData.iconClass) {
                        iconHtml = `<i class="${escapeHtml(categoryData.iconClass)}"></i>`;
                    }

                    // Format services count
                    const servicesCount = categoryData.servicesCount || 0;

                    categoriesHtml += `
                        <a href="/browse.html?category=${escapeHtml(categoryData.slug || categoryId)}" class="category-card-link">
                            <div class="category-card">
                                <div class="category-icon">${iconHtml}</div>
                                <h3 class="category-name">${escapeHtml(categoryData.name || 'Unnamed Category')}</h3>
                                <p class="category-description">${escapeHtml(categoryData.description || 'No description available.')}</p>
                                <!-- Parent Category Indicator -->
                                <div class="category-parent" style="font-size: var(--font-size-xs); color: var(--gray-500); margin-top: var(--spacing-2);">
                                    <i class="fas fa-sitemap" style="margin-right: var(--spacing-1);"></i>
                                    Parent: <span id="categoryParentName">${escapeHtml(categoryData.parentName || 'None')}</span>
                                </div>
                                <!-- Services Count -->
                                <div class="category-services-count" style="font-size: var(--font-size-sm); color: var(--gray-600); margin-top: var(--spacing-3);">
                                    <i class="fas fa-briefcase" style="margin-right: var(--spacing-1);"></i>
                                    <span id="categoryServicesCount">${servicesCount}</span> services
                                </div>
                            </div>
                        </a>
                    `;
                });

                categoriesGrid.innerHTML = categoriesHtml;

            } catch (error) {
                console.error("Error loading categories:", error);
                categoriesGrid.innerHTML = `<div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1; color: var(--danger-500);"><p>Error loading categories: ${error.message}. Please try refreshing the page.</p></div>`;
            }
        },

        /**
         * Opens the category modal for creating or editing a category.
         * @param {string} action - 'create' or 'edit'.
         * @param {Object} categoryData - The category data (for editing).
         */
        openCategoryModal(action, categoryData = null) {
            console.log("Opening category modal for action:", action);
            const modal = document.getElementById('categoryModal');
            const title = document.getElementById('categoryModalTitle');
            const form = document.getElementById('categoryForm');
            const categoryIdInput = document.getElementById('categoryId');
            const nameInput = document.getElementById('categoryName');
            const slugInput = document.getElementById('categorySlug');
            const iconClassInput = document.getElementById('categoryIconClass');
            const parentCategorySelect = document.getElementById('parentCategory'); // New field
            const bannerImageInput = document.getElementById('bannerImage'); // New field
            const coverImageInput = document.getElementById('coverImage'); // New field
            const bannerImagePreview = document.getElementById('bannerImagePreview'); // New preview
            const coverImagePreview = document.getElementById('coverImagePreview'); // New preview

            if (!modal || !title || !form) {
                console.warn("Category modal elements not found.");
                alert("Category modal not found. Please refresh the page.");
                return;
            }

            // Reset form
            if (form) form.reset();
            if (bannerImagePreview) {
                bannerImagePreview.style.display = 'none';
                bannerImagePreview.src = '';
            }
            if (coverImagePreview) {
                coverImagePreview.style.display = 'none';
                coverImagePreview.src = '';
            }

            if (action === 'create') {
                title.textContent = 'Create New Category';
                if (categoryIdInput) categoryIdInput.value = '';
                
                // Populate parent category dropdown
                this.populateParentCategoryDropdown(parentCategorySelect, null);
                
            } else if (action === 'edit' && categoryData) {
                title.textContent = 'Edit Category';
                if (categoryIdInput) categoryIdInput.value = categoryData.id;
                if (nameInput) nameInput.value = categoryData.name || '';
                if (slugInput) slugInput.value = categoryData.slug || '';
                if (iconClassInput) iconClassInput.value = categoryData.iconClass || '';
                
                // Populate parent category dropdown and select current parent
                this.populateParentCategoryDropdown(parentCategorySelect, categoryData.parentId || null);
                
                // Show image previews if URLs exist
                if (categoryData.bannerImageUrl && bannerImagePreview) {
                    bannerImagePreview.src = categoryData.bannerImageUrl;
                    bannerImagePreview.style.display = 'block';
                }
                if (categoryData.coverImageUrl && coverImagePreview) {
                    coverImagePreview.src = categoryData.coverImageUrl;
                    coverImagePreview.style.display = 'block';
                }
            }

            modal.style.display = 'flex';
        },

        /**
         * Populates the parent category dropdown.
         * @param {HTMLElement} dropdownElement - The select element for parent categories.
         * @param {string|null} currentParentId - The ID of the current parent (to exclude from options).
         */
        async populateParentCategoryDropdown(dropdownElement, currentParentId = null) {
            if (!dropdownElement) {
                console.warn("Parent category dropdown element not found.");
                return;
            }

            // Clear existing options except the default
            dropdownElement.innerHTML = '<option value="">None (Top-level category)</option>';

            try {
                // Query Firestore for all categories
                const querySnapshot = await window.db.collection('categories').orderBy('name').get();

                if (!querySnapshot.empty) {
                    querySnapshot.forEach(doc => {
                        const categoryData = doc.data();
                        const categoryId = doc.id;
                        const categoryName = categoryData.name || 'Unnamed Category';

                        // Skip the current category if editing (can't be its own parent)
                        if (currentParentId && categoryId === currentParentId) return;

                        const option = document.createElement('option');
                        option.value = categoryId;
                        option.textContent = categoryName;
                        dropdownElement.appendChild(option);
                    });
                }

                // Set selected value if editing
                if (currentParentId) {
                    dropdownElement.value = currentParentId;
                }

            } catch (error) {
                console.error("Error populating parent category dropdown:", error);
                alert("Failed to load parent categories. Please try again.");
            }
        },

        /**
         * Handles category form submission.
         * @param {Event} event - The form submission event.
         */
        async handleCategoryFormSubmit(event) {
            event.preventDefault();
            console.log("Category form submission triggered");

            const form = event.target;
            const formData = new FormData(form);
            const action = form.getAttribute('data-action');
            const categoryId = formData.get('categoryId');
            const name = formData.get('categoryName')?.trim();
            const slug = formData.get('categorySlug')?.trim();
            const iconClass = formData.get('categoryIconClass')?.trim();
            const parentId = formData.get('parentCategory') || null; // New field
            const bannerImageFile = formData.get('bannerImage'); // New field
            const coverImageFile = formData.get('coverImage'); // New field

            // Basic Validation
            if (!name || !slug) {
                alert("Category name and slug are required.");
                return;
            }

            // Slug validation (basic)
            const slugRegex = /^[a-z0-9-]+$/;
            if (!slugRegex.test(slug)) {
                alert("Slug can only contain lowercase letters, numbers, and hyphens.");
                return;
            }

            const categoryData = {
                name: name,
                slug: slug,
                iconClass: iconClass || 'fas fa-tag',
                parentId: parentId, // New field
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Handle image uploads
            if (bannerImageFile && bannerImageFile.size > 0) {
                try {
                    const bannerImageUrl = await this.uploadImageToStorage(bannerImageFile, `categories/${categoryId || 'new'}/banner_${Date.now()}_${bannerImageFile.name}`);
                    categoryData.bannerImageUrl = bannerImageUrl;
                } catch (uploadError) {
                    console.error("Error uploading banner image:", uploadError);
                    alert("Error uploading banner image. Category saved without banner.");
                }
            }

            if (coverImageFile && coverImageFile.size > 0) {
                try {
                    const coverImageUrl = await this.uploadImageToStorage(coverImageFile, `categories/${categoryId || 'new'}/cover_${Date.now()}_${coverImageFile.name}`);
                    categoryData.coverImageUrl = coverImageUrl;
                } catch (uploadError) {
                    console.error("Error uploading cover image:", uploadError);
                    alert("Error uploading cover image. Category saved without cover.");
                }
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const originalContent = submitButton ? submitButton.innerHTML : '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving Category...';
            }

            try {
                if (action === 'create') {
                    // Add new category to Firestore
                    const docRef = await window.db.collection('categories').add({
                        ...categoryData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log("Category created with ID:", docRef.id);
                    alert("Category created successfully!");
                } else if (action === 'edit' && categoryId) {
                    // Update existing category in Firestore
                    await window.db.collection('categories').doc(categoryId).update(categoryData);
                    console.log("Category updated with ID:", categoryId);
                    alert("Category updated successfully!");
                } else {
                    throw new Error("Invalid action or missing category ID for edit.");
                }

                // Close modal and refresh categories
                this.closeModals();
                this.loadCategories();

            } catch (error) {
                console.error("Error saving category:", error);
                alert(`Failed to save category: ${error.message}. Please try again.`);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalContent || 'Save Category';
                }
            }
        },

        /**
         * Uploads an image to Firebase Storage.
         * @param {File} file - The image file to upload.
         * @param {string} path - The path in Firebase Storage.
         * @returns {Promise<string>} The download URL of the uploaded image.
         */
        async uploadImageToStorage(file, path) {
            try {
                const storageRef = window.storage.ref();
                const imageRef = storageRef.child(path);
                const snapshot = await imageRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                console.log("Image uploaded to Storage:", downloadURL);
                return downloadURL;
            } catch (error) {
                console.error("Error uploading image to Storage:", error);
                throw error;
            }
        },

        /**
         * Closes all modals.
         */
        closeModals() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    };

    // --- ATTACH EVENT LISTENERS ---
    // Handle category form submission
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.CategoryManagement.handleCategoryFormSubmit(e);
        });
    }
    // --- END EVENT LISTENERS ---
});