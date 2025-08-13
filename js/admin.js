// js/admin.js - Admin related JavaScript for AtMyWorks

console.log("Admin module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Admin DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db && window.firebaseApp.storage) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services (auth, db, storage) available in admin.js");
    } else {
        console.warn("Firebase not initialized in admin.js. Admin features will not work.");
        // Hide admin-dependent UI elements or show an error
        hideAdminUI();
        return;
    }

    // --- ADMIN AUTHORIZATION CHECK ---
    // Ensure the current user is an admin
    checkAdminAuthorization();

    async function checkAdminAuthorization() {
        const user = window.auth.currentUser;
        if (!user) {
            console.log("No user logged in, redirecting to admin login.");
            alert("Please log in as an administrator.");
            window.location.href = '/admin-login.html';
            return;
        }

        try {
            // Use the helper function from js/auth.js to check admin role
            const isAdmin = await window.checkIfUserIsAdmin();
            if (!isAdmin) {
                console.log("User is not an admin, redirecting.");
                alert("Access denied. Administrator privileges required.");
                // Sign out the non-admin user
                await window.auth.signOut();
                window.location.href = '/admin-login.html';
                return;
            }

            console.log("Admin authorization successful for user:", user.uid);
            // If authorized, proceed with loading dashboard content
            loadAdminDashboard();

        } catch (error) {
            console.error("Error during admin authorization check:", error);
            alert("An error occurred during authorization. Please try logging in again.");
            await window.auth.signOut();
            window.location.href = '/admin-login.html';
        }
    }
    // --- END ADMIN AUTHORIZATION CHECK ---

    // --- ADMIN DASHBOARD LOADER ---
    async function loadAdminDashboard() {
        console.log("Loading admin dashboard content...");

        // Load initial data for all sections
        loadDashboardStats();
        loadPendingWithdrawals();
        loadRecentActivity();
        
        // Load data for the initially active section (Overview)
        loadAdminSectionData('overview');
    }
    // --- END ADMIN DASHBOARD LOADER ---

    // --- ADMIN SECTION DATA LOADER ---
    window.loadAdminSectionData = async function(sectionId) {
        console.log(`Loading data for admin section: ${sectionId}`);
        
        switch (sectionId) {
            case 'overview':
                loadDashboardStats();
                loadPendingWithdrawals();
                loadRecentActivity();
                break;
            case 'users':
                loadUsers();
                break;
            case 'kyc':
                loadKycVerifications();
                break;
            case 'categories':
                loadCategories();
                break;
            case 'gigs':
                loadGigs();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'withdrawals':
                loadAllWithdrawals();
                break;
            case 'blog':
                loadBlogPosts();
                break;
            case 'messages':
                loadMessages();
                break;
            case 'notifications':
                loadNotifications();
                break;
            case 'settings':
                loadPlatformSettings();
                break;
            default:
                console.warn(`Unknown admin section: ${sectionId}`);
        }
    };
    // --- END ADMIN SECTION DATA LOADER ---

    // --- SECTION SWITCHER ---
    window.switchSection = async function(sectionId) {
        console.log("Switching to admin section:", sectionId);

        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }

        // Update active nav link
        const navLinks = document.querySelectorAll('.admin-nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });

        // Load data for the section if needed
        if (typeof window.loadAdminSectionData === 'function') {
            await window.loadAdminSectionData(sectionId);
        } else {
            console.warn(`loadAdminSectionData function not found for section ${sectionId}`);
        }
    };
    // --- END SECTION SWITCHER ---

    // --- MODAL HANDLER ---
    window.closeModals = function() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    };
    // --- END MODAL HANDLER ---

    // --- DASHBOARD STATS LOADER ---
    async function loadDashboardStats() {
        console.log("Loading dashboard stats...");
        const dashboardStats = document.querySelector('.dashboard-stats');
        if (!dashboardStats) return;

        // Show loading state
        dashboardStats.innerHTML = `
            <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>Loading dashboard statistics...</p>
            </div>
        `;

        try {
            // Query Firestore for stats (simplified - you'd aggregate these in a real app)
            const usersSnapshot = await window.db.collection('users').get();
            const gigsSnapshot = await window.db.collection('gigs').get();
            const ordersSnapshot = await window.db.collection('orders').get();
            // const revenueSnapshot = await window.db.collection('revenue').get(); // Hypothetical

            // Update UI elements
            const totalUsersCount = document.getElementById('totalUsersCount');
            const totalGigsCount = document.getElementById('totalGigsCount');
            const totalOrdersCount = document.getElementById('totalOrdersCount');
            const totalRevenueAmount = document.getElementById('totalRevenueAmount');

            if (totalUsersCount) totalUsersCount.textContent = usersSnapshot.size;
            if (totalGigsCount) totalGigsCount.textContent = gigsSnapshot.size;
            if (totalOrdersCount) totalOrdersCount.textContent = ordersSnapshot.size;
            // if (totalRevenueAmount) totalRevenueAmount.textContent = `$${revenueSnapshot.size * 100}`; // Simplified

            console.log("Dashboard stats loaded");
        } catch (error) {
            console.error("Error loading dashboard stats:", error);
            dashboardStats.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1; color: var(--danger-500);">
                    <p>Error loading dashboard statistics: ${error.message}. Please try refreshing the page.</p>
                </div>
            `;
        }
    }
    // --- END DASHBOARD STATS LOADER ---

    // --- PENDING WITHDRAWALS LOADER ---
    async function loadPendingWithdrawals() {
        console.log("Loading pending withdrawals...");
        const withdrawalsTableBody = document.getElementById('withdrawalsTableBody');
        if (!withdrawalsTableBody) return;

        // Show loading state
        withdrawalsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading pending withdrawal requests...</td></tr>';

        try {
            // Query Firestore for pending withdrawal requests
            const querySnapshot = await window.db.collection('withdrawal_requests')
                .where('status', '==', 'pending')
                .orderBy('requestedAt', 'desc')
                .limit(5)
                .get();

            if (querySnapshot.empty) {
                withdrawalsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No pending withdrawal requests.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const requestData = doc.data();
                const requestId = doc.id;

                // Format request date
                let formattedDate = 'N/A';
                if (requestData.requestedAt) {
                    const dateObj = requestData.requestedAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine requester info
                let requesterName = requestData.requesterName || 'Unknown Requester';
                let requesterAvatarText = requesterName.charAt(0).toUpperCase();

                // Format amount
                const amount = requestData.amount ? `$${requestData.amount.toFixed(2)}` : 'N/A';

                // Format method
                const method = requestData.method || 'N/A';

                // Format details
                const details = requestData.details || 'N/A';

                tableRowsHtml += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${requesterAvatarText}</div>
                                <span>${escapeHtml(requesterName)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(amount)}</td>
                        <td>${escapeHtml(method)}</td>
                        <td>${escapeHtml(details)}</td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td><span class="badge badge-warning">Pending</span></td>
                        <td>
                            <button class="btn btn-success btn-sm approve-withdrawal-btn" data-request-id="${escapeHtml(requestId)}" style="margin-right: 0.5rem;"><i class="fas fa-check"></i> Approve</button>
                            <button class="btn btn-danger btn-sm reject-withdrawal-btn" data-request-id="${escapeHtml(requestId)}"><i class="fas fa-times"></i> Reject</button>
                        </td>
                    </tr>
                `;
            });

            withdrawalsTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to action buttons
            document.querySelectorAll('.approve-withdrawal-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const requestId = this.getAttribute('data-request-id');
                    approveWithdrawal(requestId);
                });
            });

            document.querySelectorAll('.reject-withdrawal-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const requestId = this.getAttribute('data-request-id');
                    rejectWithdrawal(requestId);
                });
            });

        } catch (error) {
            console.error("Error loading pending withdrawals:", error);
            withdrawalsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading withdrawal requests: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }
    // --- END PENDING WITHDRAWALS LOADER ---

    // --- RECENT ACTIVITY LOADER ---
    async function loadRecentActivity() {
        console.log("Loading recent activity...");
        const recentActivityList = document.getElementById('recentActivityList');
        if (!recentActivityList) return;

        // Show loading state
        recentActivityList.innerHTML = '<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">Loading recent activity...</li>';

        try {
            // Query Firestore for recent activity (simplified)
            // In a real app, you'd query multiple collections and merge results
            const querySnapshot = await window.db.collection('activity_log')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            if (querySnapshot.empty) {
                recentActivityList.innerHTML = '<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">No recent activity.</li>';
                return;
            }

            let activityHtml = '';
            querySnapshot.forEach(doc => {
                const activityData = doc.data();
                const activityId = doc.id;

                // Format activity timestamp
                let formattedTime = 'N/A';
                if (activityData.timestamp) {
                    const dateObj = activityData.timestamp.toDate();
                    formattedTime = dateObj.toLocaleString(); // e.g., 10/27/2023, 10:30:00 AM
                }

                // Determine activity icon and message
                let iconClass = 'fas fa-info-circle';
                let message = activityData.message || 'Unknown activity';
                switch (activityData.type) {
                    case 'user_signup':
                        iconClass = 'fas fa-user-plus';
                        break;
                    case 'gig_created':
                        iconClass = 'fas fa-briefcase';
                        break;
                    case 'order_placed':
                        iconClass = 'fas fa-shopping-cart';
                        break;
                    case 'payment_received':
                        iconClass = 'fas fa-money-bill-wave';
                        break;
                    case 'withdrawal_requested':
                        iconClass = 'fas fa-money-bill-transfer';
                        break;
                    case 'kyc_submitted':
                        iconClass = 'fas fa-id-card';
                        break;
                    case 'message_sent':
                        iconClass = 'fas fa-comment';
                        break;
                    case 'review_left':
                        iconClass = 'fas fa-star';
                        break;
                    default:
                        iconClass = 'fas fa-info-circle';
                }

                activityHtml += `
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: flex-start;">
                            <i class="${iconClass}" style="font-size: 1.5rem; color: var(--primary-500); margin-right: 1rem; flex-shrink: 0;"></i>
                            <div>
                                <div style="font-weight: var(--font-weight-semibold);">${escapeHtml(message)}</div>
                                <div style="font-size: var(--font-size-sm); color: var(--gray-500);">${escapeHtml(formattedTime)}</div>
                            </div>
                        </div>
                    </li>
                `;
            });

            recentActivityList.innerHTML = activityHtml;

        } catch (error) {
            console.error("Error loading recent activity:", error);
            recentActivityList.innerHTML = `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--danger-500);">Error loading recent activity: ${error.message}. Please try refreshing the page.</li>`;
        }
    }
    // --- END RECENT ACTIVITY LOADER ---

    // --- USERS MANAGEMENT ---
    async function loadUsers() {
        console.log("Loading users...");
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        // Show loading state
        usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading users...</td></tr>';

        try {
            // Query Firestore for users
            const querySnapshot = await window.db.collection('users').orderBy('createdAt', 'desc').get();

            if (querySnapshot.empty) {
                usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const userData = doc.data();
                const userId = doc.id;

                // Format creation date
                let formattedDate = 'N/A';
                if (userData.createdAt) {
                    const dateObj = userData.createdAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine user info
                let userName = userData.fullName || userData.username || userData.companyName || 'Unknown User';
                let userEmail = userData.email || 'No email';
                let userRole = userData.role || 'client';
                let userStatus = userData.status || 'active';

                // Capitalize role and status
                userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
                userStatus = userStatus.charAt(0).toUpperCase() + userStatus.slice(1);

                tableRowsHtml += `
                    <tr>
                        <td>${escapeHtml(userId)}</td>
                        <td>${escapeHtml(userName)}</td>
                        <td>${escapeHtml(userEmail)}</td>
                        <td><span class="badge badge-secondary">${escapeHtml(userRole)}</span></td>
                        <td><span class="badge badge-${userStatus === 'Active' ? 'success' : userStatus === 'Suspended' ? 'warning' : 'danger'}">${escapeHtml(userStatus)}</span></td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td>
                            <button class="btn btn-outline btn-sm edit-user-btn" data-user-id="${escapeHtml(userId)}"><i class="fas fa-edit"></i> Edit</button>
                        </td>
                    </tr>
                `;
            });

            usersTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to edit buttons
            document.querySelectorAll('.edit-user-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    openUserModal('edit', userId);
                });
            });

        } catch (error) {
            console.error("Error loading users:", error);
            usersTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading users: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    // Function to open User Modal
    async function openUserModal(action, userId = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        const userIdInput = document.getElementById('userId');
        const emailInput = document.getElementById('userEmail');
        const roleSelect = document.getElementById('userRole');
        const statusSelect = document.getElementById('userStatus');

        if (action === 'create') {
            title.textContent = 'Create New User';
            userIdInput.value = '';
            emailInput.value = '';
            emailInput.readOnly = false;
            roleSelect.value = 'jobseeker';
            statusSelect.value = 'active';
            // Clear other fields if any
        } else if (action === 'edit' && userId) {
            title.textContent = 'Edit User';
            userIdInput.value = userId;
            emailInput.readOnly = true; // Usually don't allow email change
            
            try {
                // Fetch user data from Firestore
                const userDoc = await window.db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    emailInput.value = userData.email || '';
                    roleSelect.value = userData.role || 'jobseeker';
                    statusSelect.value = userData.status || 'active';
                    // Populate other fields if any
                } else {
                    console.warn("User document not found for ID:", userId);
                    alert("User not found.");
                    closeModals();
                    return;
                }
            } catch (error) {
                console.error("Error fetching user ", error);
                alert("Failed to load user data. Please try again.");
                closeModals();
                return;
            }
        }

        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Function to close all modals
    function closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Function to handle user form submission
    async function handleCreateUserFormSubmit(event) {
        event.preventDefault();
        console.log("User form submission triggered via global handler");

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
        console.log("Determined role for user creation:", role);

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

        console.log("Prepared user data for creation:", userData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating User...';
        }

        try {
            await window.handleFirebaseSignup(userData);
            // If successful, handleFirebaseSignup will redirect. No further action needed here.
        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create User';
            }
            // Error message already shown in handleFirebaseSignup
            console.error("User creation failed in global handler:", error);
        }
    }
    // --- END USERS MANAGEMENT ---

    // --- KYC VERIFICATIONS ---
    async function loadKycVerifications() {
        console.log("Loading KYC verifications...");
        const kycTableBody = document.getElementById('kycTableBody');
        if (!kycTableBody) return;

        // Show loading state
        kycTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading KYC requests...</td></tr>';

        try {
            // Query Firestore for KYC verifications
            const querySnapshot = await window.db.collection('kyc_verifications').orderBy('submittedAt', 'desc').get();

            if (querySnapshot.empty) {
                kycTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No KYC requests found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const kycData = doc.data();
                const kycId = doc.id;

                // Format submission date
                let formattedDate = 'N/A';
                if (kycData.submittedAt) {
                    const dateObj = kycData.submittedAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine user info
                let userName = kycData.fullName || 'Unknown User';
                let userEmail = kycData.emailAddress || 'No email';
                let idType = kycData.idType || 'N/A';
                let kycStatus = kycData.status || 'pending';

                // Capitalize status
                kycStatus = kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1);

                tableRowsHtml += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${userName.charAt(0).toUpperCase()}</div>
                                <span>${escapeHtml(userName)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(userEmail)}</td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td>${escapeHtml(idType)}</td>
                        <td><span class="badge badge-${kycStatus === 'Approved' ? 'success' : kycStatus === 'Rejected' ? 'danger' : 'warning'}">${escapeHtml(kycStatus)}</span></td>
                    </tr>
                `;
            });

            kycTableBody.innerHTML = tableRowsHtml;

        } catch (error) {
            console.error("Error loading KYC verifications:", error);
            kycTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger-500);">Error loading KYC requests: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }
    // --- END KYC VERIFICATIONS ---

    // --- CATEGORIES MANAGEMENT ---
    async function loadCategories() {
        console.log("Loading categories...");
        const categoriesTableBody = document.getElementById('categoriesTableBody');
        if (!categoriesTableBody) return;

        // Show loading state
        categoriesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading categories...</td></tr>';

        try {
            // Query Firestore for categories
            const querySnapshot = await window.db.collection('categories').orderBy('name').get();

            if (querySnapshot.empty) {
                categoriesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No categories found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const categoryData = doc.data();
                const categoryId = doc.id;

                // Format services count (placeholder)
                const servicesCount = categoryData.servicesCount || 0;

                // Determine icon
                let iconHtml = '<i class="fas fa-tag"></i>'; // Default icon
                if (categoryData.iconClass) {
                    iconHtml = `<i class="${escapeHtml(categoryData.iconClass)}"></i>`;
                }

                tableRowsHtml += `
                    <tr>
                        <td>${iconHtml}</td>
                        <td>${escapeHtml(categoryData.name || 'Unnamed Category')}</td>
                        <td>${escapeHtml(categoryData.slug || 'no-slug')}</td>
                        <td>${escapeHtml(servicesCount.toString())}</td>
                        <td>
                            <button class="btn btn-outline btn-sm edit-category-btn" data-category-id="${escapeHtml(categoryId)}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="btn btn-danger btn-sm delete-category-btn" data-category-id="${escapeHtml(categoryId)}" style="margin-left: 0.5rem;"><i class="fas fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            });

            categoriesTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to edit/delete buttons
            document.querySelectorAll('.edit-category-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const categoryId = this.getAttribute('data-category-id');
                    openCategoryModal('edit', categoryId);
                });
            });

            document.querySelectorAll('.delete-category-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const categoryId = this.getAttribute('data-category-id');
                    deleteCategory(categoryId);
                });
            });

        } catch (error) {
            console.error("Error loading categories:", error);
            categoriesTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger-500);">Error loading categories: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    // Function to open Category Modal
    async function openCategoryModal(action, categoryId = null) {
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
            categoryIdInput.value = '';
            
            // Populate parent category dropdown
            if (parentCategorySelect) {
                await populateParentCategoryDropdown(parentCategorySelect, null);
            }
            
        } else if (action === 'edit' && categoryId) {
            title.textContent = 'Edit Category';
            categoryIdInput.value = categoryId;
            
            try {
                // Fetch category data from Firestore
                const categoryDoc = await window.db.collection('categories').doc(categoryId).get();
                if (categoryDoc.exists) {
                    const categoryData = categoryDoc.data();
                    nameInput.value = categoryData.name || '';
                    slugInput.value = categoryData.slug || '';
                    iconClassInput.value = categoryData.iconClass || '';
                    
                    // Populate parent category dropdown and select current parent
                    if (parentCategorySelect) {
                        await populateParentCategoryDropdown(parentCategorySelect, categoryData.parentId || null);
                    }
                    
                    // Show image previews if URLs exist
                    if (categoryData.bannerImageUrl && bannerImagePreview) {
                        bannerImagePreview.src = categoryData.bannerImageUrl;
                        bannerImagePreview.style.display = 'block';
                    }
                    if (categoryData.coverImageUrl && coverImagePreview) {
                        coverImagePreview.src = categoryData.coverImageUrl;
                        coverImagePreview.style.display = 'block';
                    }
                    
                } else {
                    console.warn("Category document not found for ID:", categoryId);
                    alert("Category not found.");
                    closeModals();
                    return;
                }
            } catch (error) {
                console.error("Error fetching category data:", error);
                alert("Failed to load category data. Please try again.");
                closeModals();
                return;
            }
        }

        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Function to populate parent category dropdown
    async function populateParentCategoryDropdown(dropdownElement, currentParentId = null) {
        if (!dropdownElement) return;

        // Clear existing options
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
    }

    // Function to delete a category
    async function deleteCategory(categoryId) {
        if (!categoryId) {
            alert("Invalid category ID.");
            return;
        }

        if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete category document from Firestore
            await window.db.collection('categories').doc(categoryId).delete();
            console.log("Category deleted successfully:", categoryId);
            alert("Category deleted successfully!");

            // Reload categories list
            loadCategories();

        } catch (error) {
            console.error("Error deleting category:", error);
            alert(`Failed to delete category: ${error.message}. Please try again.`);
        }
    }

    // Function to handle category form submission
    async function handleCreateCategoryFormSubmit(event) {
         event.preventDefault();
        console.log("Category form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const name = formData.get('name')?.trim();
        const slug = formData.get('slug')?.trim();
        const iconClass = formData.get('iconClass')?.trim();
        const parentId = formData.get('parentCategory') || null; // New field
        const bannerImageFile = formData.get('bannerImage'); // New field
        const coverImageFile = formData.get('coverImage'); // New field

        // --- BASIC VALIDATION ---
        if (!name || !slug) {
            alert("Name and slug are required.");
            return;
        }

        // Slug validation regex (basic)
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            alert("Slug can only contain lowercase letters, numbers, and hyphens.");
            return;
        }

        const categoryData = {
            name,
            slug,
            iconClass: iconClass || 'fas fa-tag',
            parentId: parentId || undefined,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Prepared category data for creation:", categoryData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Category...';
        }

        try {
            // Handle image uploads if files are selected
            if (bannerImageFile && bannerImageFile.size > 0) {
                // Validate file type
                const allowedBannerTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedBannerTypes.includes(bannerImageFile.type)) {
                    throw new Error(`Invalid banner image file type. Please upload a JPEG, PNG, or GIF image.`);
                }

                // Validate file size (e.g., 5MB max)
                const maxBannerSize = 5 * 1024 * 1024; // 5MB in bytes
                if (bannerImageFile.size > maxBannerSize) {
                    throw new Error(`Banner image file size exceeds 5MB limit. Please select a smaller image.`);
                }

                // Upload banner image to Firebase Storage
                const bannerStorageRef = window.storage.ref();
                const bannerImageRef = bannerStorageRef.child(`categories/${name}/${Date.now()}_banner_${bannerImageFile.name}`);
                const bannerSnapshot = await bannerImageRef.put(bannerImageFile);
                const bannerDownloadURL = await bannerSnapshot.ref.getDownloadURL();
                categoryData.bannerImageUrl = bannerDownloadURL;
                console.log("Banner image uploaded successfully:", bannerDownloadURL);
            }

            if (coverImageFile && coverImageFile.size > 0) {
                // Validate file type
                const allowedCoverTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedCoverTypes.includes(coverImageFile.type)) {
                    throw new Error(`Invalid cover image file type. Please upload a JPEG, PNG, or GIF image.`);
                }

                // Validate file size (e.g., 5MB max)
                const maxCoverSize = 5 * 1024 * 1024; // 5MB in bytes
                if (coverImageFile.size > maxCoverSize) {
                    throw new Error(`Cover image file size exceeds 5MB limit. Please select a smaller image.`);
                }

                // Upload cover image to Firebase Storage
                const coverStorageRef = window.storage.ref();
                const coverImageRef = coverStorageRef.child(`categories/${name}/${Date.now()}_cover_${coverImageFile.name}`);
                const coverSnapshot = await coverImageRef.put(coverImageFile);
                const coverDownloadURL = await coverSnapshot.ref.getDownloadURL();
                categoryData.coverImageUrl = coverDownloadURL;
                console.log("Cover image uploaded successfully:", coverDownloadURL);
            }

            // Save category data to Firestore
            await window.db.collection('categories').add(categoryData);
            console.log("Category created successfully!");
            alert("Category created successfully!");

            // Reset form and close modal
            form.reset();
            closeModals();

            // Reload categories list
            loadCategories();

        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Category';
            }
            // Error message already shown in handleCreateCategoryFormSubmit
            console.error("Category creation failed in global handler:", error);
            alert(`Failed to create category: ${error.message}. Please try again.`);
        }
    }
    // --- END CATEGORIES MANAGEMENT ---

    // --- GIGS MANAGEMENT ---
    async function loadGigs() {
        console.log("Loading gigs...");
        const gigsTableBody = document.getElementById('gigsTableBody');
        if (!gigsTableBody) return;

        // Show loading state
        gigsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading services...</td></tr>';

        try {
            // Query Firestore for gigs
            const querySnapshot = await window.db.collection('gigs').orderBy('createdAt', 'desc').get();

            if (querySnapshot.empty) {
                gigsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No services found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
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
                let sellerName = gigData.sellerName || gigData.freelancerName || 'Unknown Seller';
                let sellerAvatarText = sellerName.charAt(0).toUpperCase();

                // Format rating
                const ratingValue = gigData.rating?.toFixed(1) || 'N/A';
                const ratingCount = gigData.reviews?.length || 0; // Simplified count

                // Format price
                const price = gigData.startingPrice ? `From $${gigData.startingPrice}` : 'Price N/A';

                // Format status
                const status = gigData.status || 'N/A';
                let statusBadgeClass = 'badge-secondary'; // Default
                if (status === 'active') {
                    statusBadgeClass = 'badge-success';
                } else if (status === 'pending') {
                    statusBadgeClass = 'badge-warning';
                } else if (status === 'paused' || status === 'deleted') {
                    statusBadgeClass = 'badge-danger';
                }

                tableRowsHtml += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${sellerAvatarText}</div>
                                <span>${escapeHtml(sellerName)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(gigData.title || 'Untitled Gig')}</td>
                        <td>${escapeHtml(gigData.category || 'Uncategorized')}</td>
                        <td>${escapeHtml(price)}</td>
                        <td><span class="badge ${statusBadgeClass}">${escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))}</span></td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td>
                            <button class="btn btn-outline btn-sm view-gig-btn" data-gig-id="${escapeHtml(gigId)}"><i class="fas fa-eye"></i> View</button>
                            <button class="btn btn-danger btn-sm delete-gig-btn" data-gig-id="${escapeHtml(gigId)}" style="margin-left: 0.5rem;"><i class="fas fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            });

            gigsTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to view/delete buttons
            document.querySelectorAll('.view-gig-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const gigId = this.getAttribute('data-gig-id');
                    // Redirect to gig detail page
                    window.location.href = `/gig-detail.html?id=${gigId}`;
                });
            });

            document.querySelectorAll('.delete-gig-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const gigId = this.getAttribute('data-gig-id');
                    deleteGig(gigId);
                });
            });

        } catch (error) {
            console.error("Error loading gigs:", error);
            gigsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading services: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    // Function to delete a gig
    async function deleteGig(gigId) {
        if (!gigId) {
            alert("Invalid gig ID.");
            return;
        }

        if (!confirm("Are you sure you want to delete this gig? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete gig document from Firestore
            await window.db.collection('gigs').doc(gigId).delete();
            console.log("Gig deleted successfully:", gigId);
            alert("Gig deleted successfully!");

            // Reload gigs list
            loadGigs();

        } catch (error) {
            console.error("Error deleting gig:", error);
            alert(`Failed to delete gig: ${error.message}. Please try again.`);
        }
    }

    // Function to handle gig form submission
    async function handleCreateGigFormSubmit(event) {
        event.preventDefault();
        console.log("Gig form submission triggered via global handler");

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

        const gigData = {
            title: title,
            category: category,
            description: description,
            deliveryTime: deliveryTime,
            startingPrice: price,
            tags: tags,
            freelancerId: user.uid,
            freelancerName: user.displayName || user.email?.split('@')[0] || 'Freelancer',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active' // Default status
        };

        console.log("Prepared gig data for creation:", gigData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Gig...';
        }

        try {
            // Handle image uploads
            const imageUrls = [];
            if (imageFiles && imageFiles.length > 0) {
                for (const file of imageFiles) {
                    if (file && file.size > 0) {
                        // Validate file type
                        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                        if (!allowedTypes.includes(file.type)) {
                            throw new Error(`Invalid image file type: ${file.name}. Please upload JPG, PNG, or GIF images.`);
                        }

                        // Validate file size (e.g., 5MB max)
                        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                        if (file.size > maxSize) {
                            throw new Error(`Image file size exceeds 5MB limit: ${file.name}. Please select a smaller image.`);
                        }

                        // Upload image to Firebase Storage
                        const storageRef = window.storage.ref();
                        const imageRef = storageRef.child(`gigs/${user.uid}/${Date.now()}_${file.name}`);
                        const snapshot = await imageRef.put(file);
                        const downloadURL = await snapshot.ref.getDownloadURL();
                        imageUrls.push(downloadURL);
                        console.log("Image uploaded successfully:", downloadURL);
                    }
                }
            }
            gigData.imageUrls = imageUrls;

            // Save gig data to Firestore
            const docRef = await window.db.collection('gigs').add(gigData);
            console.log("Gig created successfully with ID:", docRef.id);
            alert("Gig created successfully!");

            // Reset form and close modal
            form.reset();
            closeModals();

            // Reload gigs list
            loadGigs();

        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Gig';
            }
            // Error message already shown in handleCreateGigFormSubmit
            console.error("Gig creation failed in global handler:", error);
            alert(`Failed to create gig: ${error.message}. Please try again.`);
        }
    }
    // --- END GIGS MANAGEMENT ---

    // --- ORDERS MANAGEMENT ---
    async function loadOrders() {
        console.log("Loading orders...");
        const ordersTableBody = document.getElementById('ordersTableBody');
        if (!ordersTableBody) return;

        // Show loading state
        ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading orders...</td></tr>';

        try {
            // Query Firestore for orders
            const querySnapshot = await window.db.collection('orders').orderBy('createdAt', 'desc').get();

            if (querySnapshot.empty) {
                ordersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No orders found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const orderData = doc.data();
                const orderId = doc.id;

                // Format creation date
                let formattedDate = 'N/A';
                if (orderData.createdAt) {
                    const dateObj = orderData.createdAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine buyer/seller info
                let buyerName = orderData.buyerName || 'Unknown Buyer';
                let sellerName = orderData.sellerName || 'Unknown Seller';
                let buyerAvatarText = buyerName.charAt(0).toUpperCase();
                let sellerAvatarText = sellerName.charAt(0).toUpperCase();

                // Format amount
                const amount = orderData.amount ? `$${orderData.amount.toFixed(2)}` : 'N/A';

                // Format status
                const status = orderData.status || 'N/A';
                let statusBadgeClass = 'badge-secondary'; // Default
                if (status === 'completed') {
                    statusBadgeClass = 'badge-success';
                } else if (status === 'pending') {
                    statusBadgeClass = 'badge-warning';
                } else if (status === 'cancelled' || status === 'refunded') {
                    statusBadgeClass = 'badge-danger';
                }

                tableRowsHtml += `
                    <tr>
                        <td>${escapeHtml(orderId)}</td>
                        <td>${escapeHtml(orderData.gigTitle || 'Untitled Gig')}</td>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${buyerAvatarText}</div>
                                <span>${escapeHtml(buyerName)}</span>
                            </div>
                        </td>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${sellerAvatarText}</div>
                                <span>${escapeHtml(sellerName)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(amount)}</td>
                        <td><span class="badge ${statusBadgeClass}">${escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))}</span></td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td>
                            <button class="btn btn-outline btn-sm view-order-btn" data-order-id="${escapeHtml(orderId)}"><i class="fas fa-eye"></i> View</button>
                        </td>
                    </tr>
                `;
            });

            ordersTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to view buttons
            document.querySelectorAll('.view-order-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    // Redirect to order detail page or open a modal
                    window.location.href = `/order-detail.html?id=${orderId}`;
                });
            });

        } catch (error) {
            console.error("Error loading orders:", error);
            ordersTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger-500);">Error loading orders: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    // Function to handle order form submission
    async function handleCreateOrderFormSubmit(event) {
         event.preventDefault();
        console.log("Order form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const gigId = formData.get('gigId');
        const buyerId = formData.get('buyerId');
        const sellerId = formData.get('sellerId');
        const amount = parseFloat(formData.get('amount'));
        const currency = formData.get('currency');
        const description = formData.get('description')?.trim();
        const status = formData.get('status');

        // --- BASIC VALIDATION ---
        if (!gigId || !buyerId || !sellerId || isNaN(amount) || amount <= 0 || !currency || !description || !status) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        const orderData = {
            gigId: gigId,
            buyerId: buyerId,
            sellerId: sellerId,
            amount: amount,
            currency: currency,
            description: description,
            status: status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Prepared order data for creation:", orderData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Order...';
        }

        try {
            // Save order data to Firestore
            const docRef = await window.db.collection('orders').add(orderData);
            console.log("Order created successfully with ID:", docRef.id);
            alert("Order created successfully!");

            // Reset form and close modal
            form.reset();
            closeModals();

            // Reload orders list
            loadOrders();

        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Order';
            }
            // Error message already shown in handleCreateOrderFormSubmit
            console.error("Order creation failed in global handler:", error);
            alert(`Failed to create order: ${error.message}. Please try again.`);
        }
    }
    // --- END ORDERS MANAGEMENT ---

    // --- WITHDRAWAL REQUESTS MANAGEMENT ---
    async function loadAllWithdrawals() {
        console.log("Loading all withdrawal requests...");
        const withdrawalsTableBody = document.getElementById('withdrawalsTableBody');
        if (!withdrawalsTableBody) return;

        // Show loading state
        withdrawalsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading withdrawal requests...</td></tr>';

        try {
            // Query Firestore for withdrawal requests
            const querySnapshot = await window.db.collection('withdrawal_requests').orderBy('requestedAt', 'desc').get();

            if (querySnapshot.empty) {
                withdrawalsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No withdrawal requests found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const requestData = doc.data();
                const requestId = doc.id;

                // Format request date
                let formattedDate = 'N/A';
                if (requestData.requestedAt) {
                    const dateObj = requestData.requestedAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine requester info
                let requesterName = requestData.requesterName || 'Unknown Requester';
                let requesterAvatarText = requesterName.charAt(0).toUpperCase();

                // Format amount
                const amount = requestData.amount ? `$${requestData.amount.toFixed(2)}` : 'N/A';

                // Format method
                const method = requestData.method || 'N/A';

                // Format details
                const details = requestData.details || 'N/A';

                // Format status
                const status = requestData.status || 'N/A';
                let statusBadgeClass = 'badge-secondary'; // Default
                if (status === 'approved') {
                    statusBadgeClass = 'badge-success';
                } else if (status === 'pending') {
                    statusBadgeClass = 'badge-warning';
                } else if (status === 'rejected') {
                    statusBadgeClass = 'badge-danger';
                }

                tableRowsHtml += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${requesterAvatarText}</div>
                                <span>${escapeHtml(requesterName)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(amount)}</td>
                        <td>${escapeHtml(method)}</td>
                        <td>${escapeHtml(details)}</td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td><span class="badge ${statusBadgeClass}">${escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))}</span></td>
                        <td>
                            <button class="btn btn-success btn-sm approve-withdrawal-btn" data-request-id="${escapeHtml(requestId)}" style="margin-right: 0.5rem;"><i class="fas fa-check"></i> Approve</button>
                            <button class="btn btn-danger btn-sm reject-withdrawal-btn" data-request-id="${escapeHtml(requestId)}"><i class="fas fa-times"></i> Reject</button>
                        </td>
                    </tr>
                `;
            });

            withdrawalsTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to action buttons
            document.querySelectorAll('.approve-withdrawal-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const requestId = this.getAttribute('data-request-id');
                    approveWithdrawal(requestId);
                });
            });

            document.querySelectorAll('.reject-withdrawal-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const requestId = this.getAttribute('data-request-id');
                    rejectWithdrawal(requestId);
                });
            });

        } catch (error) {
            console.error("Error loading withdrawal requests:", error);
            withdrawalsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading withdrawal requests: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    // Function to approve a withdrawal request
    async function approveWithdrawal(requestId) {
        if (!requestId) {
            alert("Invalid request ID.");
            return;
        }

        if (!confirm("Are you sure you want to approve this withdrawal request?")) {
            return;
        }

        try {
            // Update withdrawal request status in Firestore
            await window.db.collection('withdrawal_requests').doc(requestId).update({
                status: 'approved',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Withdrawal request approved:", requestId);
            alert("Withdrawal request approved successfully!");

            // Reload withdrawal requests list
            loadAllWithdrawals();

        } catch (error) {
            console.error("Error approving withdrawal request:", error);
            alert(`Failed to approve withdrawal request: ${error.message}. Please try again.`);
        }
    }

    // Function to reject a withdrawal request
    async function rejectWithdrawal(requestId) {
        if (!requestId) {
            alert("Invalid request ID.");
            return;
        }

        if (!confirm("Are you sure you want to reject this withdrawal request?")) {
            return;
        }

        try {
            // Update withdrawal request status in Firestore
            await window.db.collection('withdrawal_requests').doc(requestId).update({
                status: 'rejected',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("Withdrawal request rejected:", requestId);
            alert("Withdrawal request rejected successfully!");

            // Reload withdrawal requests list
            loadAllWithdrawals();

        } catch (error) {
            console.error("Error rejecting withdrawal request:", error);
            alert(`Failed to reject withdrawal request: ${error.message}. Please try again.`);
        }
    }

    // Function to handle withdrawal request form submission
    async function handleCreateWithdrawalRequestFormSubmit(event) {
        event.preventDefault();
        console.log("Withdrawal request form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const freelancerId = formData.get('freelancerId');
        const amount = parseFloat(formData.get('amount'));
        const method = formData.get('method');
        const details = formData.get('details')?.trim();
        const status = formData.get('status');

        // --- BASIC VALIDATION ---
        if (!freelancerId || isNaN(amount) || amount <= 0 || !method || !details || !status) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        const requestData = {
            freelancerId: freelancerId,
            amount: amount,
            method: method,
            details: details,
            status: status,
            requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Prepared withdrawal request data for creation:", requestData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Request...';
        }

        try {
            // Save withdrawal request data to Firestore
            const docRef = await window.db.collection('withdrawal_requests').add(requestData);
            console.log("Withdrawal request created successfully with ID:", docRef.id);
            alert("Withdrawal request created successfully!");

            // Reset form and close modal
            form.reset();
            closeModals();

            // Reload withdrawal requests list
            loadAllWithdrawals();

        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Request';
            }
            // Error message already shown in handleCreateWithdrawalRequestFormSubmit
            console.error("Withdrawal request creation failed in global handler:", error);
            alert(`Failed to create withdrawal request: ${error.message}. Please try again.`);
        }
    }
    // --- END WITHDRAWAL REQUESTS MANAGEMENT ---

    // --- BLOG MANAGEMENT ---
    async function loadBlogPosts() {
        console.log("Loading blog posts...");
        const blogTableBody = document.getElementById('blogTableBody');
        if (!blogTableBody) return;

        // Show loading state
        blogTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading blog posts...</td></tr>';

        try {
            // Query Firestore for blog posts
            const querySnapshot = await window.db.collection('blog_posts').orderBy('publishedAt', 'desc').get();

            if (querySnapshot.empty) {
                blogTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No blog posts found.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            querySnapshot.forEach(doc => {
                const postData = doc.data();
                const postId = doc.id;

                // Format publication date
                let formattedDate = 'N/A';
                if (postData.publishedAt) {
                    const dateObj = postData.publishedAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                }

                // Determine author info
                let authorName = postData.authorName || 'Unknown Author';
                let authorAvatarText = authorName.charAt(0).toUpperCase();

                // Format title
                const title = postData.title || 'Untitled Post';

                // Format status
                const status = postData.status || 'N/A';
                let statusBadgeClass = 'badge-secondary'; // Default
                if (status === 'published') {
                    statusBadgeClass = 'badge-success';
                } else if (status === 'draft') {
                    statusBadgeClass = 'badge-warning';
                } else if (status === 'archived') {
                    statusBadgeClass = 'badge-danger';
                }

                tableRowsHtml += `
                    <tr>
                        <td>${escapeHtml(title)}</td>
                        <td>
                            <div style="display: flex; align-items: center;">
                                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 0.5rem; box-shadow: var(--shadow-xs);">${authorAvatarText}</div>
                                <span>${escapeHtml(authorName)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(formattedDate)}</td>
                        <td><span class="badge ${statusBadgeClass}">${escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))}</span></td>
                        <td>
                            <button class="btn btn-outline btn-sm edit-blog-post-btn" data-post-id="${escapeHtml(postId)}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="btn btn-danger btn-sm delete-blog-post-btn" data-post-id="${escapeHtml(postId)}" style="margin-left: 0.5rem;"><i class="fas fa-trash"></i> Delete</button>
                        </td>
                    </tr>
                `;
            });

            blogTableBody.innerHTML = tableRowsHtml;

            // Attach event listeners to edit/delete buttons
            document.querySelectorAll('.edit-blog-post-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const postId = this.getAttribute('data-post-id');
                    // Redirect to blog post edit page or open a modal
                    window.location.href = `/blog-post-edit.html?id=${postId}`;
                });
            });

            document.querySelectorAll('.delete-blog-post-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const postId = this.getAttribute('data-post-id');
                    deleteBlogPost(postId);
                });
            });

        } catch (error) {
            console.error("Error loading blog posts:", error);
            blogTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger-500);">Error loading blog posts: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    // Function to delete a blog post
    async function deleteBlogPost(postId) {
        if (!postId) {
            alert("Invalid post ID.");
            return;
        }

        if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete blog post document from Firestore
            await window.db.collection('blog_posts').doc(postId).delete();
            console.log("Blog post deleted successfully:", postId);
            alert("Blog post deleted successfully!");

            // Reload blog posts list
            loadBlogPosts();

        } catch (error) {
            console.error("Error deleting blog post:", error);
            alert(`Failed to delete blog post: ${error.message}. Please try again.`);
        }
    }

    // Function to handle blog post form submission
    async function handleCreateBlogPostFormSubmit(event) {
         event.preventDefault();
        console.log("Blog post form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const title = formData.get('title')?.trim();
        const slug = formData.get('slug')?.trim();
        const excerpt = formData.get('excerpt')?.trim();
        const content = formData.get('content')?.trim();
        const author = formData.get('author')?.trim();
        const status = formData.get('status');
        const featuredImageFile = formData.get('featuredImage'); // Get the featured image file

        // --- BASIC VALIDATION ---
        if (!title || !slug || !content || !author || !status) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        // Validate slug (basic)
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            alert("Slug can only contain lowercase letters, numbers, and hyphens.");
            return;
        }

        const postData = {
            title: title,
            slug: slug,
            excerpt: excerpt || '',
            content: content,
            author: author,
            status: status,
            publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Prepared blog post data for creation:", postData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating Post...';
        }

        try {
            // Handle featured image upload if file is selected
            if (featuredImageFile && featuredImageFile.size > 0) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(featuredImageFile.type)) {
                    throw new Error(`Invalid featured image file type. Please upload a JPEG, PNG, or GIF image.`);
                }

                // Validate file size (e.g., 5MB max)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (featuredImageFile.size > maxSize) {
                    throw new Error(`Featured image file size exceeds 5MB limit. Please select a smaller image.`);
                }

                // Upload featured image to Firebase Storage
                const storageRef = window.storage.ref();
                const imageRef = storageRef.child(`blog/${Date.now()}_${featuredImageFile.name}`);
                const snapshot = await imageRef.put(featuredImageFile);
                const downloadURL = await snapshot.ref.getDownloadURL();
                postData.featuredImageUrl = downloadURL;
                console.log("Featured image uploaded successfully:", downloadURL);
            }

            // Save blog post data to Firestore
            const docRef = await window.db.collection('blog_posts').add(postData);
            console.log("Blog post created successfully with ID:", docRef.id);
            alert("Blog post created successfully!");

            // Reset form and close modal
            form.reset();
            closeModals();

            // Reload blog posts list
            loadBlogPosts();

        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Create Post';
            }
            // Error message already shown in handleCreateBlogPostFormSubmit
            console.error("Blog post creation failed in global handler:", error);
            alert(`Failed to create blog post: ${error.message}. Please try again.`);
        }
    }
    // --- END BLOG MANAGEMENT ---

    // --- MESSAGES MANAGEMENT ---
    async function loadMessages() {
        console.log("Loading messages...");
        // This is a placeholder. In a real app, you'd query conversations from Firestore.
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            conversationsList.innerHTML = `
                <li style="padding: 0.5rem; border-bottom: 1px solid var(--border-color); cursor: pointer;">Loading conversations...</li>
            `;
        }
    }
    // --- END MESSAGES MANAGEMENT ---

    // --- NOTIFICATIONS MANAGEMENT ---
    async function loadNotifications() {
        console.log("Loading notifications...");
        // This is a placeholder. In a real app, you'd query notifications from Firestore.
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            notificationsList.innerHTML = `
                <li style="padding: 0.5rem; border-bottom: 1px solid var(--border-color); cursor: pointer;">Loading notifications...</li>
            `;
        }
    }
    // --- END NOTIFICATIONS MANAGEMENT ---

    // --- PLATFORM SETTINGS MANAGEMENT ---
    async function loadPlatformSettings() {
        console.log("Loading platform settings...");
        // This is a placeholder. In a real app, you'd query platform settings from Firestore.
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                    <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Loading platform settings...</p>
                </div>
            `;
        }
    }
    // --- END PLATFORM SETTINGS MANAGEMENT ---

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

    // Make escapeHtml globally available
    window.escapeHtml = escapeHtml;

    /**
     * Utility function to show/hide elements.
     * @param {string} elementId - The ID of the element to show/hide.
     * @param {boolean} show - True to show, false to hide.
     */
    function toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    // Make toggleElement globally available
    window.toggleElement = toggleElement;

    /**
     * Utility function to switch between admin sections.
     * @param {string} sectionId - The ID of the section to switch to.
     */
    function switchSection(sectionId) {
        console.log("Switching to admin section:", sectionId);

        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }

        // Update active nav link
        const navLinks = document.querySelectorAll('.admin-nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });

        // Load data for the section if needed
        if (typeof window.loadAdminSectionData === 'function') {
            window.loadAdminSectionData(sectionId);
        } else {
            console.warn(`loadAdminSectionData function not found for section ${sectionId}`);
        }
    }

    // Make switchSection globally available
    window.switchSection = switchSection;

    /**
     * Utility function to close all modals.
     */
    function closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Make closeModals globally available
    window.closeModals = closeModals;

    /**
     * Utility function to open User Modal.
     * @param {string} action - The action ('create' or 'edit').
     * @param {string} userId - The Firebase UID of the user (for editing).
     */
    window.openUserModal = async function(action, userId = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        const userIdInput = document.getElementById('userId');
        const emailInput = document.getElementById('userEmail');
        const roleSelect = document.getElementById('userRole');
        const statusSelect = document.getElementById('userStatus');

        if (!modal || !title || !form) {
            console.warn("User modal elements not found.");
            return;
        }

        if (action === 'create') {
            title.textContent = 'Create New User';
            if (userIdInput) userIdInput.value = '';
            if (emailInput) {
                emailInput.value = '';
                emailInput.readOnly = false;
            }
            if (roleSelect) roleSelect.value = 'jobseeker';
            if (statusSelect) statusSelect.value = 'active';
            // Clear other fields if any
        } else if (action === 'edit' && userId) {
            title.textContent = 'Edit User';
            if (userIdInput) userIdInput.value = userId;
            if (emailInput) emailInput.readOnly = true; // Usually don't allow email change
            
            try {
                // Fetch user data from Firestore
                if (window.db) {
                    const userDoc = await window.db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (emailInput) emailInput.value = userData.email || '';
                        if (roleSelect) roleSelect.value = userData.role || 'jobseeker';
                        if (statusSelect) statusSelect.value = userData.status || 'active';
                        // Populate other fields if any
                    } else {
                        console.warn("User document not found for ID:", userId);
                        alert("User not found.");
                        closeModals();
                        return;
                    }
                } else {
                    console.warn("Firestore 'db' object not found. Skipping user data fetch.");
                    alert("Unable to load user data. Please try again.");
                    closeModals();
                    return;
                }
            } catch (error) {
                console.error("Error fetching user data for modal:", error);
                alert("Failed to load user data. Please try again.");
                closeModals();
                return;
            }
        }

        if (modal) {
            modal.style.display = 'flex';
        }
    };

    /**
     * Utility function to open Category Modal.
     * @param {string} action - The action ('create' or 'edit').
     * @param {string} categoryId - The Firebase ID of the category (for editing).
     */
    window.openCategoryModal = async function(action, categoryId = null) {
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
            return;
        }

        // Reset form and previews
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
            if (window.db && parentCategorySelect) {
                await populateParentCategoryDropdown(parentCategorySelect, null);
            }
            
        } else if (action === 'edit' && categoryId) {
            title.textContent = 'Edit Category';
            if (categoryIdInput) categoryIdInput.value = categoryId;
            
            try {
                // Fetch category data from Firestore
                if (window.db) {
                    const categoryDoc = await window.db.collection('categories').doc(categoryId).get();
                    if (categoryDoc.exists) {
                        const categoryData = categoryDoc.data();
                        if (nameInput) nameInput.value = categoryData.name || '';
                        if (slugInput) slugInput.value = categoryData.slug || '';
                        if (iconClassInput) iconClassInput.value = categoryData.iconClass || '';
                        
                        // Populate parent category dropdown and select current parent
                        if (parentCategorySelect) {
                            await populateParentCategoryDropdown(parentCategorySelect, categoryData.parentId || null);
                        }
                        
                        // Show image previews if URLs exist
                        if (categoryData.bannerImageUrl && bannerImagePreview) {
                            bannerImagePreview.src = categoryData.bannerImageUrl;
                            bannerImagePreview.style.display = 'block';
                        }
                        if (categoryData.coverImageUrl && coverImagePreview) {
                            coverImagePreview.src = categoryData.coverImageUrl;
                            coverImagePreview.style.display = 'block';
                        }
                        
                    } else {
                        console.warn("Category document not found for ID:", categoryId);
                        alert("Category not found.");
                        closeModals();
                        return;
                    }
                } else {
                    console.warn("Firestore 'db' object not found. Skipping category data fetch.");
                    alert("Unable to load category data. Please try again.");
                    closeModals();
                    return;
                }
            } catch (error) {
                console.error("Error fetching category data for modal:", error);
                alert("Failed to load category data. Please try again.");
                closeModals();
                return;
            }
        }

        if (modal) {
            modal.style.display = 'flex';
        }
    };

    /**
     * Utility function to populate parent category dropdown.
     * @param {HTMLElement} dropdownElement - The select element for parent categories.
     * @param {string|null} currentParentId - The ID of the current parent (to exclude from options).
     */
    async function populateParentCategoryDropdown(dropdownElement, currentParentId = null) {
        if (!dropdownElement) {
            console.warn("Parent category dropdown element not found.");
            return;
        }

        // Clear existing options except the default
        dropdownElement.innerHTML = '<option value="">None (Top-level category)</option>';

        try {
            // Query Firestore for all categories
            if (window.db) {
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
            } else {
                console.warn("Firestore 'db' object not found. Skipping parent category population.");
            }

            // Set selected value if editing
            if (currentParentId) {
                dropdownElement.value = currentParentId;
            }

        } catch (error) {
            console.error("Error populating parent category dropdown:", error);
            alert("Failed to load parent categories. Please try again.");
        }
    }

    /**
     * Utility function to delete a category.
     * @param {string} categoryId - The Firebase ID of the category to delete.
     */
    async function deleteCategory(categoryId) {
        if (!categoryId) {
            alert("Invalid category ID.");
            return;
        }

        if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete category document from Firestore
            if (window.db) {
                await window.db.collection('categories').doc(categoryId).delete();
                console.log("Category deleted successfully:", categoryId);
                alert("Category deleted successfully!");

                // Reload categories list
                if (typeof window.loadCategories === 'function') {
                    window.loadCategories();
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping category deletion.");
                alert("Unable to delete category. Please try again.");
            }

        } catch (error) {
            console.error("Error deleting category:", error);
            alert(`Failed to delete category: ${error.message}. Please try again.`);
        }
    }

    // Make deleteCategory globally available
    window.deleteCategory = deleteCategory;

    /**
     * Utility function to delete a gig.
     * @param {string} gigId - The Firebase ID of the gig to delete.
     */
    async function deleteGig(gigId) {
        if (!gigId) {
            alert("Invalid gig ID.");
            return;
        }

        if (!confirm("Are you sure you want to delete this gig? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete gig document from Firestore
            if (window.db) {
                await window.db.collection('gigs').doc(gigId).delete();
                console.log("Gig deleted successfully:", gigId);
                alert("Gig deleted successfully!");

                // Reload gigs list
                if (typeof window.loadGigs === 'function') {
                    window.loadGigs();
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping gig deletion.");
                alert("Unable to delete gig. Please try again.");
            }

        } catch (error) {
            console.error("Error deleting gig:", error);
            alert(`Failed to delete gig: ${error.message}. Please try again.`);
        }
    }

    // Make deleteGig globally available
    window.deleteGig = deleteGig;

    /**
     * Utility function to delete a blog post.
     * @param {string} postId - The Firebase ID of the blog post to delete.
     */
    async function deleteBlogPost(postId) {
        if (!postId) {
            alert("Invalid post ID.");
            return;
        }

        if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
            return;
        }

        try {
            // Delete blog post document from Firestore
            if (window.db) {
                await window.db.collection('blog_posts').doc(postId).delete();
                console.log("Blog post deleted successfully:", postId);
                alert("Blog post deleted successfully!");

                // Reload blog posts list
                if (typeof window.loadBlogPosts === 'function') {
                    window.loadBlogPosts();
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping blog post deletion.");
                alert("Unable to delete blog post. Please try again.");
            }

        } catch (error) {
            console.error("Error deleting blog post:", error);
            alert(`Failed to delete blog post: ${error.message}. Please try again.`);
        }
    }

    // Make deleteBlogPost globally available
    window.deleteBlogPost = deleteBlogPost;

    /**
     * Utility function to approve a withdrawal request.
     * @param {string} requestId - The Firebase ID of the withdrawal request to approve.
     */
    async function approveWithdrawal(requestId) {
        if (!requestId) {
            alert("Invalid request ID.");
            return;
        }

        if (!confirm("Are you sure you want to approve this withdrawal request?")) {
            return;
        }

        try {
            // Update withdrawal request status in Firestore
            if (window.db) {
                await window.db.collection('withdrawal_requests').doc(requestId).update({
                    status: 'approved',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("Withdrawal request approved:", requestId);
                alert("Withdrawal request approved successfully!");

                // Reload withdrawal requests list
                if (typeof window.loadAllWithdrawals === 'function') {
                    window.loadAllWithdrawals();
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping withdrawal approval.");
                alert("Unable to approve withdrawal request. Please try again.");
            }

        } catch (error) {
            console.error("Error approving withdrawal request:", error);
            alert(`Failed to approve withdrawal request: ${error.message}. Please try again.`);
        }
    }

    // Make approveWithdrawal globally available
    window.approveWithdrawal = approveWithdrawal;

    /**
     * Utility function to reject a withdrawal request.
     * @param {string} requestId - The Firebase ID of the withdrawal request to reject.
     */
    async function rejectWithdrawal(requestId) {
        if (!requestId) {
            alert("Invalid request ID.");
            return;
        }

        if (!confirm("Are you sure you want to reject this withdrawal request?")) {
            return;
        }

        try {
            // Update withdrawal request status in Firestore
            if (window.db) {
                await window.db.collection('withdrawal_requests').doc(requestId).update({
                    status: 'rejected',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("Withdrawal request rejected:", requestId);
                alert("Withdrawal request rejected successfully!");

                // Reload withdrawal requests list
                if (typeof window.loadAllWithdrawals === 'function') {
                    window.loadAllWithdrawals();
                }
            } else {
                console.warn("Firestore 'db' object not found. Skipping withdrawal rejection.");
                alert("Unable to reject withdrawal request. Please try again.");
            }

        } catch (error) {
            console.error("Error rejecting withdrawal request:", error);
            alert(`Failed to reject withdrawal request: ${error.message}. Please try again.`);
        }
    }

    // Make rejectWithdrawal globally available
    window.rejectWithdrawal = rejectWithdrawal;

    // --- END UTILITY FUNCTIONS ---
});