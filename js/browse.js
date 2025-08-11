// js/browse.js - JavaScript for browse page

console.log("Browse module loaded");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Browse DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db; // Assuming Firestore is initialized in firebase-config.js
        window.storage = window.firebaseApp.storage; // Assuming Storage is initialized
        console.log("Firebase services available in browse.js");
    } else {
        console.warn("Firebase not initialized in browse.js. Some features might not work.");
        // Hide auth-dependent UI elements or show an error
        // updateAuthUI(null); 
        return;
    }

    // --- BROWSE PAGE INITIALIZATION ---
    window.initBrowsePage = function() {
        console.log("Initializing Browse Page...");

        // DOM Elements
        const searchForm = document.getElementById('searchForm');
        const searchQuery = document.getElementById('searchQuery');
        const categoryFilter = document.getElementById('categoryFilter');
        const priceFilter = document.getElementById('priceFilter');
        const sortFilter = document.getElementById('sortFilter');
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        const gigsContainer = document.getElementById('gigsContainer');
        const resultsCount = document.getElementById('resultsCount');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const emptyState = document.getElementById('emptyState');
        const gigsPagination = document.getElementById('gigsPagination');

        // State Variables
        let currentFilters = {
            query: '',
            category: '',
            price: '',
            sort: 'best-selling'
        };
        let currentPage = 1;
        const gigsPerPage = 6; // Adjust as needed
        let totalGigs = 0;
        let gigsListener = null; // For real-time updates (optional)

        // --- EVENT LISTENERS ---
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log("Search form submitted");
                const formData = new FormData(this);
                currentFilters.query = formData.get('searchQuery')?.trim() || '';
                loadGigs();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                console.log("Category filter changed");
                currentFilters.category = this.value;
                loadGigs();
            });
        }

        if (priceFilter) {
            priceFilter.addEventListener('change', function() {
                console.log("Price filter changed");
                currentFilters.price = this.value;
                loadGigs();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', function() {
                console.log("Sort filter changed");
                currentFilters.sort = this.value;
                loadGigs();
            });
        }

        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                console.log("Reset filters button clicked");
                resetFilters();
            });
        }

        // --- MAIN GIG LOADING FUNCTION ---
        async function loadGigs(page = 1) {
            console.log("Loading gigs with filters:", currentFilters, "Page:", page);
            currentPage = page;

            // Show loading state
            showLoadingState();

            try {
                // Hide error and empty states
                if (errorState) errorState.style.display = 'none';
                if (emptyState) emptyState.style.display = 'none';

                // --- BUILD FIRESTORE QUERY ---
                let query = window.db.collection('gigs');

                // Apply search query filter (if you have a search index or text search enabled)
                // For now, we'll do client-side filtering after fetching
                // if (currentFilters.query) {
                //     query = query.where('searchTerms', 'array-contains', currentFilters.query.toLowerCase());
                // }

                // Apply category filter
                if (currentFilters.category) {
                    query = query.where('category', '==', currentFilters.category);
                }

                // Apply price filter
                if (currentFilters.price) {
                    const [min, max] = parsePriceFilter(currentFilters.price);
                    if (min !== null) {
                        query = query.where('startingPrice', '>=', min);
                    }
                    if (max !== null) {
                        query = query.where('startingPrice', '<=', max);
                    }
                }

                // Apply sorting
                switch (currentFilters.sort) {
                    case 'newest':
                        query = query.orderBy('createdAt', 'desc');
                        break;
                    case 'price-low-high':
                        query = query.orderBy('startingPrice', 'asc');
                        break;
                    case 'price-high-low':
                        query = query.orderBy('startingPrice', 'desc');
                        break;
                    case 'best-selling':
                    default:
                        // Assume you have a 'salesCount' field
                        query = query.orderBy('salesCount', 'desc');
                        break;
                }

                // Apply pagination
                const startIndex = (currentPage - 1) * gigsPerPage;
                query = query.limit(gigsPerPage);

                // If not the first page, add startAfter logic
                // This requires keeping track of the last document from the previous page
                // For simplicity in this example, we'll fetch all and slice client-side
                // In a production app, you'd use Firestore's startAfter for better performance
                // const lastVisible = getLastVisibleDocument(); // Implement this
                // if (lastVisible && currentPage > 1) {
                //     query = query.startAfter(lastVisible);
                // }

                // Execute query
                const querySnapshot = await query.get();
                console.log("Query snapshot received:", querySnapshot.size);

                // Update total gigs count
                totalGigs = querySnapshot.size; // This is simplified, you'd need to get total count separately

                // Hide loading state
                hideLoadingState();

                if (querySnapshot.empty) {
                    console.log("No gigs found matching filters.");
                    showEmptyState();
                    updateResultsCount(0);
                    renderPagination(0);
                    return;
                }

                // Generate HTML for gig cards
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

                    // Determine seller info
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
                                <div class="gig-price">${price}</div>
                                <a href="/gig-detail.html?id=${gigId}" class="btn btn-primary mt-3">View Details</a>
                            </div>
                        </div>
                    `;
                });

                // Inject HTML into container
                if (gigsContainer) {
                    gigsContainer.innerHTML = gigsHtml;
                }

                // Update results count
                updateResultsCount(totalGigs);

                // Render pagination
                renderPagination(totalGigs);

            } catch (error) {
                console.error("Error loading gigs:", error);
                hideLoadingState();
                showErrorState(`Failed to load services: ${error.message}. Please try again.`);
            }
        }

        // --- UTILITY FUNCTIONS ---
        function showLoadingState() {
            if (loadingState) {
                loadingState.style.display = 'block';
            }
            if (gigsContainer) {
                gigsContainer.innerHTML = ''; // Clear existing gigs
            }
            if (resultsCount) {
                resultsCount.textContent = 'Loading...';
            }
        }

        function hideLoadingState() {
            if (loadingState) {
                loadingState.style.display = 'none';
            }
        }

        function showErrorState(message) {
            if (errorState) {
                const errorMessageElement = document.getElementById('errorMessage');
                if (errorMessageElement) {
                    errorMessageElement.textContent = message;
                }
                errorState.style.display = 'block';
            }
        }

        function showEmptyState() {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
        }

        function updateResultsCount(count) {
            if (resultsCount) {
                resultsCount.textContent = `Showing ${count} services`;
            }
        }

        function parsePriceFilter(priceFilterValue) {
            let min = null;
            let max = null;
            switch (priceFilterValue) {
                case '0-50':
                    min = 0;
                    max = 50;
                    break;
                case '50-100':
                    min = 50;
                    max = 100;
                    break;
                case '100-500':
                    min = 100;
                    max = 500;
                    break;
                case '500+':
                    min = 500;
                    break;
                default:
                    // No price filter applied
            }
            return [min, max];
        }

        function resetFilters() {
            console.log("Resetting filters");
            if (searchQuery) searchQuery.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (priceFilter) priceFilter.value = '';
            if (sortFilter) sortFilter.value = 'best-selling';
            
            currentFilters = {
                query: '',
                category: '',
                price: '',
                sort: 'best-selling'
            };
            
            loadGigs();
        }

        function resetFiltersAndReload() {
            resetFilters();
            loadGigs();
        }

        function renderPagination(totalGigs) {
            if (!gigsPagination) return;

            const totalPages = Math.ceil(totalGigs / gigsPerPage);
            if (totalPages <= 1) {
                gigsPagination.innerHTML = '';
                return;
            }

            let paginationHtml = '';

            // Previous button
            paginationHtml += `
                <li>
                    <a href="#" class="btn btn-outline" aria-label="Previous" onclick="event.preventDefault(); window.initBrowsePage && window.initBrowsePage.loadGigs(${Math.max(1, currentPage - 1)});">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
            `;

            // Page numbers (simplified)
            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) {
                    paginationHtml += `
                        <li>
                            <a href="#" class="btn btn-primary" aria-label="Page ${i}">${i}</a>
                        </li>
                    `;
                } else {
                    paginationHtml += `
                        <li>
                            <a href="#" class="btn btn-outline" aria-label="Page ${i}" onclick="event.preventDefault(); window.initBrowsePage && window.initBrowsePage.loadGigs(${i});">${i}</a>
                        </li>
                    `;
                }
            }

            // Next button
            paginationHtml += `
                <li>
                    <a href="#" class="btn btn-outline" aria-label="Next" onclick="event.preventDefault(); window.initBrowsePage && window.initBrowsePage.loadGigs(${Math.min(totalPages, currentPage + 1)});">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            `;

            gigsPagination.innerHTML = paginationHtml;
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

        // Make loadGigs available globally for pagination
        window.initBrowsePage = {
            loadGigs: loadGigs,
            resetFilters: resetFilters,
            resetFiltersAndReload: resetFiltersAndReload
        };

        // Initial load
        loadGigs();

        console.log("Browse page initialized successfully");
    };

    // Call initialization if not already called
    if (typeof window.initBrowsePage !== 'function' && typeof window.initBrowsePage !== 'object') {
        window.initBrowsePage();
    }
});