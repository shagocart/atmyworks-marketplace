// js/main.js - Core JavaScript for AtMyWorks Platform

console.log("Main JS module loaded");

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

    // --- DYNAMIC CONTENT LOADING ---
    // Load featured gigs on index.html
    if (document.body.dataset.page === 'home') {
        loadFeaturedGigs();
    }

    // Load all gigs on browse.html
    if (document.body.dataset.page === 'browse') {
        loadAllGigs();
    }

    // --- FEATURED GIGS LOADER (for index.html) ---
    async function loadFeaturedGigs() {
        const gigsContainer = document.getElementById('featuredGigsContainer');
        if (!gigsContainer) return;

        // Show loading state
        gigsContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>Loading featured services...</p>
            </div>
        `;

        try {
            // Query Firestore for featured gigs
            // For now, we'll just load the first 3 gigs ordered by creation date
            // In a real app, you'd have a 'featured' boolean field or similar
            const querySnapshot = await window.db.collection('gigs')
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();

            if (querySnapshot.empty) {
                gigsContainer.innerHTML = `
                    <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                        <p>No featured services available yet.</p>
                    </div>
                `;
                return;
            }

            let gigsHtml = '';
            querySnapshot.forEach(doc => {
                const gigData = doc.data();
                const gigId = doc.id;

                // Format creation date
                let formattedDate = 'N/A';
                if (gigData.createdAt) {
                    const dateObj = gigData.createdAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine seller info (could be username or company name)
                let sellerName = gigData.sellerName || 'Unknown Seller';
                let sellerAvatarText = sellerName.charAt(0).toUpperCase();

                // Format rating
                const ratingValue = gigData.rating?.toFixed(1) || 'N/A';
                const ratingCount = gigData.reviews?.length || 0; // Simplified count

                // Format price
                const price = gigData.startingPrice ? `From $${gigData.startingPrice}` : 'Price N/A';

                gigsHtml += `
                    <div class="gig-card">
                        <div class="gig-image">
                            <img src="${gigData.imageUrl || 'https://placehold.co/600x400/3b82f6/white?text=Service+Image'}" alt="${escapeHtml(gigData.title || 'Service Title')}">
                        </div>
                        <div class="gig-content">
                            <div class="gig-seller">
                                <div class="gig-seller-avatar">${sellerAvatarText}</div>
                                <span class="gig-seller-name">${escapeHtml(sellerName)}</span>
                            </div>
                            <h3 class="gig-title card-title"><a href="/gig-detail.html?id=${gigId}" style="text-decoration: none; color: inherit;">${escapeHtml(gigData.title || 'Untitled Gig')}</a></h3>
                            <div class="gig-rating">
                                <i class="fas fa-star gig-rating-icon"></i>
                                <span class="gig-rating-value">${ratingValue}</span>
                                <span>(${ratingCount})</span>
                            </div>
                            <div class="gig-price">From $${price}</div>
                            <a href="/gig-detail.html?id=${gigId}" class="btn btn-primary mt-3">View Details</a>
                        </div>
                    </div>
                `;
            });

            gigsContainer.innerHTML = gigsHtml;

        } catch (error) {
            console.error("Error loading featured gigs:", error);
            gigsContainer.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1; color: var(--danger-500);">
                    <p>Error loading featured services: ${error.message}. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    // --- ALL GIGS LOADER (for browse.html) ---
    async function loadAllGigs() {
         const gigsContainer = document.getElementById('gigsContainer');
        if (!gigsContainer) return;

        // Show loading state
        gigsContainer.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>Loading services...</p>
            </div>
        `;

        try {
            // Query Firestore for all gigs, ordered by creation date
            const querySnapshot = await window.db.collection('gigs')
                .orderBy('createdAt', 'desc')
                .get();

            if (querySnapshot.empty) {
                gigsContainer.innerHTML = `
                    <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                        <p>No services available yet.</p>
                    </div>
                `;
                return;
            }

            let gigsHtml = '';
            querySnapshot.forEach(doc => {
                const gigData = doc.data();
                const gigId = doc.id;

                // Format creation date
                let formattedDate = 'N/A';
                if (gigData.createdAt) {
                    const dateObj = gigData.createdAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine seller info (could be username or company name)
                let sellerName = gigData.sellerName || 'Unknown Seller';
                let sellerAvatarText = sellerName.charAt(0).toUpperCase();

                // Format rating
                const ratingValue = gigData.rating?.toFixed(1) || 'N/A';
                const ratingCount = gigData.reviews?.length || 0; // Simplified count

                // Format price
                const price = gigData.startingPrice ? `From $${gigData.startingPrice}` : 'Price N/A';

                gigsHtml += `
                    <div class="gig-card">
                        <div class="gig-image">
                            <img src="${gigData.imageUrl || 'https://placehold.co/600x400/3b82f6/white?text=Service+Image'}" alt="${escapeHtml(gigData.title || 'Service Title')}">
                        </div>
                        <div class="gig-content">
                            <div class="gig-seller">
                                <div class="gig-seller-avatar">${sellerAvatarText}</div>
                                <span class="gig-seller-name">${escapeHtml(sellerName)}</span>
                            </div>
                            <h3 class="gig-title card-title"><a href="/gig-detail.html?id=${gigId}" style="text-decoration: none; color: inherit;">${escapeHtml(gigData.title || 'Untitled Gig')}</a></h3>
                            <div class="gig-rating">
                                <i class="fas fa-star gig-rating-icon"></i>
                                <span class="gig-rating-value">${ratingValue}</span>
                                <span>(${ratingCount})</span>
                            </div>
                            <div class="gig-price">From $${price}</div>
                            <a href="/gig-detail.html?id=${gigId}" class="btn btn-primary mt-3">View Details</a>
                        </div>
                    </div>
                `;
            });

            gigsContainer.innerHTML = gigsHtml;

        } catch (error) {
            console.error("Error loading all gigs:", error);
            gigsContainer.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1; color: var(--danger-500);">
                    <p>Error loading services: ${error.message}. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    // Utility function to escape HTML to prevent XSS
    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Add spinner animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spinner {
             animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
});