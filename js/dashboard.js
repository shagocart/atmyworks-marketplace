// js/dashboard.js - Enhanced JavaScript for dashboard pages (client, freelancer, admin)

console.log("Enhanced Dashboard module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Enhanced Dashboard DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.auth && window.firebaseApp.db) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services (auth, db, storage) available in dashboard.js");
    } else {
        console.warn("Firebase not initialized in dashboard.js. Dashboard features will not work.");
        // Hide dashboard-dependent UI elements or show an error
        hideDashboardUI();
        return;
    }

    // --- DASHBOARD SYSTEM LOGIC ---
    window.DashboardSystem = {
        currentUser: null,
        currentUserId: null,
        currentUserRole: null,

        /**
         * Initializes the dashboard system.
         * Sets up auth state listener and loads initial dashboard data.
         */
        async init() {
            console.log("Initializing Dashboard System...");

            // Listen for auth state changes (login/logout)
            window.auth.onAuthStateChanged(user => {
                if (user) {
                    this.currentUser = user;
                    this.currentUserId = user.uid;
                    console.log("User logged in for dashboard:", user.uid, user.email);
                    this.loadDashboardData();
                } else {
                    this.currentUser = null;
                    this.currentUserId = null;
                    console.log("User logged out from dashboard system");
                    hideDashboardUI();
                    window.location.href = '/login.html'; // Redirect to login
                }
            });
        },

        /**
         * Loads initial dashboard data based on user role.
         */
        async loadDashboardData() {
            if (!this.currentUser || !this.currentUserId) {
                console.warn("No user logged in, cannot load dashboard data.");
                hideDashboardUI();
                return;
            }

            // Show loading state
            showDashboardLoadingState();

            try {
                console.log(`Loading dashboard data for user: ${this.currentUserId}`);
                // Query Firestore for the user's document in the 'users' collection
                const userDoc = await window.db.collection('users').doc(this.currentUserId).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log("User data loaded for dashboard:", userData);
                    this.currentUserRole = userData.role || 'client'; // Default to client
                    
                    // Update dashboard UI based on role
                    this.updateDashboardUI(userData);
                    
                    // Load role-specific data
                    await this.loadRoleSpecificData();
                    
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
                    
                    // Update dashboard UI with default data
                    this.updateDashboardUI(defaultData);
                    
                    // Optionally, create the user document
                    // await window.db.collection('users').doc(this.currentUserId).set(defaultData);
                }

            } catch (error) {
                console.error("Error loading dashboard data:", error);
                alert('Failed to load dashboard data. Please try again.');
                hideDashboardUI();
            }
        },

        /**
         * Updates the dashboard UI based on user data and role.
         * @param {Object} userData - The user data from Firestore.
         */
        updateDashboardUI(userData) {
            const dashboardHeader = document.querySelector('.dashboard-header');
            const userAvatarElements = document.querySelectorAll('.user-avatar');
            const userNameElements = document.querySelectorAll('#userName, #dropdownUserName');
            const userEmailElements = document.querySelectorAll('#userEmail, #dropdownUserEmail');
            const userRoleElements = document.querySelectorAll('#userRole, #dropdownUserRole');

            if (dashboardHeader) {
                dashboardHeader.style.display = 'block';
                
                // Update user name/avatar in header
                const displayName = userData.fullName || userData.username || userData.email?.split('@')[0] || 'User';
                const initials = (displayName || 'U').charAt(0).toUpperCase();
                
                userAvatarElements.forEach(avatar => {
                    if (avatar) {
                        avatar.textContent = initials;
                    }
                });
                
                userNameElements.forEach(nameElement => {
                    if (nameElement) {
                        nameElement.textContent = displayName;
                    }
                });
                
                userEmailElements.forEach(emailElement => {
                    if (emailElement) {
                        emailElement.textContent = userData.email || 'No email';
                    }
                });
                
                userRoleElements.forEach(roleElement => {
                    if (roleElement) {
                        roleElement.textContent = userData.role || 'client';
                    }
                });
                
                console.log("Dashboard UI updated with user data");
            }
        },

        /**
         * Loads role-specific dashboard data.
         */
        async loadRoleSpecificData() {
            console.log("Loading role-specific dashboard data for role:", this.currentUserRole);
            
            switch(this.currentUserRole) {
                case 'jobseeker':
                    await this.loadJobseekerDashboardData();
                    break;
                case 'employer':
                    await this.loadEmployerDashboardData();
                    break;
                case 'admin':
                    await this.loadAdminDashboardData();
                    break;
                default:
                    console.warn(`Unknown role '${this.currentUserRole}', loading default dashboard data.`);
                    await this.loadClientDashboardData();
            }
        },

        /**
         * Loads jobseeker-specific dashboard data.
         */
        async loadJobseekerDashboardData() {
            console.log("Loading jobseeker dashboard data...");
            
            // Load dashboard stats
            await this.loadDashboardStats('jobseeker');
            
            // Load gigs created by the jobseeker
            await this.loadJobseekerGigs();
            
            // Load recent activity (applications, messages, reviews)
            await this.loadRecentActivity('jobseeker');
        },

        /**
         * Loads employer-specific dashboard data.
         */
        async loadEmployerDashboardData() {
            console.log("Loading employer dashboard data...");
            
            // Load dashboard stats
            await this.loadDashboardStats('employer');
            
            // Load jobs posted by the employer
            await this.loadEmployerJobs();
            
            // Load recent activity (job applications, messages, reviews)
            await this.loadRecentActivity('employer');
        },

        /**
         * Loads admin-specific dashboard data.
         */
        async loadAdminDashboardData() {
            console.log("Loading admin dashboard data...");
            
            // Load dashboard stats
            await this.loadDashboardStats('admin');
            
            // Load pending KYC verifications
            await this.loadPendingKycVerifications();
            
            // Load pending withdrawal requests
            await this.loadPendingWithdrawalRequests();
            
            // Load recent activity (new users, new jobs, new gigs, support tickets)
            await this.loadRecentActivity('admin');
        },

        /**
         * Loads dashboard statistics for the specified role.
         * @param {string} role - The user's role ('jobseeker', 'employer', 'admin').
         */
        async loadDashboardStats(role) {
            console.log(`Loading dashboard stats for role: ${role}`);
            
            const dashboardStats = document.querySelector('.dashboard-stats');
            if (!dashboardStats) {
                console.warn("Dashboard stats container not found.");
                return;
            }

            // Show loading state
            dashboardStats.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                    <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Loading dashboard statistics...</p>
                </div>
            `;

            try {
                // In a real app, you would fetch these stats from Firestore or your backend
                // For now, we'll simulate with placeholder data
                let statsData = {};
                switch(role) {
                    case 'jobseeker':
                        statsData = {
                            totalGigs: 5,
                            totalOrders: 12,
                            totalEarnings: 1250.75,
                            totalReviews: 8
                        };
                        break;
                    case 'employer':
                        statsData = {
                            totalJobs: 3,
                            totalApplications: 28,
                            totalSpent: 450.50,
                            totalReviews: 2
                        };
                        break;
                    case 'admin':
                        statsData = {
                            totalUsers: 1248,
                            totalGigs: 856,
                            totalJobs: 2103,
                            totalOrders: 3567,
                            totalRevenue: 42560.25
                        };
                        break;
                    default:
                        statsData = {
                            totalItems: 0,
                            totalOrders: 0,
                            totalEarnings: 0,
                            totalReviews: 0
                        };
                }

                console.log("Stats data loaded:", statsData);

                // Update dashboard stats UI
                this.updateDashboardStats(statsData, role);

            } catch (error) {
                console.error("Error loading dashboard stats:", error);
                dashboardStats.innerHTML = `
                    <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1; color: var(--danger-500);">
                        <p>Error loading dashboard statistics: ${error.message}. Please try refreshing the page.</p>
                    </div>
                `;
            }
        },

        /**
         * Updates the dashboard statistics UI with loaded data.
         * @param {Object} statsData - The statistics data.
         * @param {string} role - The user's role.
         */
        updateDashboardStats(statsData, role) {
            const dashboardStats = document.querySelector('.dashboard-stats');
            if (!dashboardStats) return;

            let statsHtml = '';
            switch(role) {
                case 'jobseeker':
                    statsHtml = `
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <div class="stat-card-value" id="totalGigsCount">${statsData.totalGigs || 0}</div>
                            <div class="stat-card-label">Total Gigs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="stat-card-value" id="totalOrdersCount">${statsData.totalOrders || 0}</div>
                            <div class="stat-card-label">Total Orders</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-wallet"></i>
                            </div>
                            <div class="stat-card-value" id="totalEarningsAmount">${formatCurrency(statsData.totalEarnings || 0)}</div>
                            <div class="stat-card-label">Total Earnings</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="stat-card-value" id="totalReviewsCount">${statsData.totalReviews || 0}</div>
                            <div class="stat-card-label">Total Reviews</div>
                        </div>
                    `;
                    break;
                case 'employer':
                    statsHtml = `
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <div class="stat-card-value" id="totalJobsCount">${statsData.totalJobs || 0}</div>
                            <div class="stat-card-label">Total Jobs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-card-value" id="totalApplicationsCount">${statsData.totalApplications || 0}</div>
                            <div class="stat-card-label">Total Applications</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="stat-card-value" id="totalSpentAmount">${formatCurrency(statsData.totalSpent || 0)}</div>
                            <div class="stat-card-label">Total Spent</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="stat-card-value" id="totalReviewsCount">${statsData.totalReviews || 0}</div>
                            <div class="stat-card-label">Total Reviews</div>
                        </div>
                    `;
                    break;
                case 'admin':
                    statsHtml = `
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-card-value" id="totalUsersCount">${statsData.totalUsers || 0}</div>
                            <div class="stat-card-label">Total Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <div class="stat-card-value" id="totalGigsCount">${statsData.totalGigs || 0}</div>
                            <div class="stat-card-label">Total Gigs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="stat-card-value" id="totalJobsCount">${statsData.totalJobs || 0}</div>
                            <div class="stat-card-label">Total Jobs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="stat-card-value" id="totalOrdersCount">${statsData.totalOrders || 0}</div>
                            <div class="stat-card-label">Total Orders</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-card-value" id="totalRevenueAmount">${formatCurrency(statsData.totalRevenue || 0)}</div>
                            <div class="stat-card-label">Platform Revenue</div>
                        </div>
                    `;
                    break;
                default:
                    statsHtml = `
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="stat-card-value" id="totalItemsCount">${statsData.totalItems || 0}</div>
                            <div class="stat-card-label">Total Items</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="stat-card-value" id="totalOrdersCount">${statsData.totalOrders || 0}</div>
                            <div class="stat-card-label">Total Orders</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-dollar-sign"></i>
                            </div>
                            <div class="stat-card-value" id="totalEarningsAmount">${formatCurrency(statsData.totalEarnings || 0)}</div>
                            <div class="stat-card-label">Total Earnings</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="stat-card-value" id="totalReviewsCount">${statsData.totalReviews || 0}</div>
                            <div class="stat-card-label">Total Reviews</div>
                        </div>
                    `;
            }

            dashboardStats.innerHTML = statsHtml;
        },

        /**
         * Loads gigs created by the current jobseeker.
         */
        async loadJobseekerGigs() {
            console.log("Loading gigs for jobseeker:", this.currentUserId);
            
            const gigsTableBody = document.getElementById('gigsTableBody');
            if (!gigsTableBody) {
                console.warn("Gigs table body not found for jobseeker dashboard.");
                return;
            }

            // Show loading state
            gigsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading your gigs...</td></tr>';

            try {
                // Query Firestore for gigs where freelancerId equals the current user's UID
                // Make sure your Firestore security rules allow this read operation for the user
                const querySnapshot = await window.db.collection('gigs')
                    .where('freelancerId', '==', this.currentUserId)
                    .orderBy('createdAt', 'desc') // Show newest first
                    .get();

                if (querySnapshot.empty) {
                    gigsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">You have not created any gigs yet.</td></tr>';
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
                    let sellerName = gigData.sellerName || gigData.freelancerName || 'Unknown Seller';
                    let sellerAvatarText = sellerName.charAt(0).toUpperCase();
                    
                    // Format rating
                    const ratingValue = gigData.rating?.toFixed(1) || 'N/A';
                    const ratingCount = gigData.reviews?.length || 0; // Simplified count
                    
                    // Format price
                    const price = gigData.startingPrice ? `From $${gigData.startingPrice}` : 'Price N/A';

                    gigsHtml += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center;">
                                    <div class="gig-seller-avatar">${sellerAvatarText}</div>
                                    <span class="gig-seller-name">${escapeHtml(sellerName)}</span>
                                </div>
                            </td>
                            <td>${escapeHtml(gigData.title || 'Untitled Gig')}</td>
                            <td>${escapeHtml(gigData.category || 'Uncategorized')}</td>
                            <td>${escapeHtml(price)}</td>
                            <td><span class="badge badge-${gigData.status === 'active' ? 'success' : gigData.status === 'paused' ? 'warning' : 'danger'}">${gigData.status?.charAt(0).toUpperCase() + gigData.status?.slice(1) || 'Unknown'}</span></td>
                            <td>${formattedDate}</td>
                            <td>
                                <button class="btn btn-outline btn-sm edit-gig-btn" data-gig-id="${gigId}" style="margin-right: 0.5rem;"><i class="fas fa-edit"></i> Edit</button>
                                <button class="btn btn-danger btn-sm delete-gig-btn" data-gig-id="${gigId}"><i class="fas fa-trash"></i> Delete</button>
                            </td>
                        </tr>
                    `;
                });

                gigsTableBody.innerHTML = gigsHtml;

                // Attach event listeners to gig action buttons
                document.querySelectorAll('.edit-gig-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const gigId = this.getAttribute('data-gig-id');
                        console.log(`Edit gig button clicked for ID: ${gigId}`);
                        // Redirect to edit gig page or open modal
                        window.location.href = `/edit-gig.html?id=${gigId}`;
                    });
                });

                document.querySelectorAll('.delete-gig-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const gigId = this.getAttribute('data-gig-id');
                        console.log(`Delete gig button clicked for ID: ${gigId}`);
                        if (confirm("Are you sure you want to delete this gig? This action cannot be undone.")) {
                             // In a real app, this would call a function to delete the gig from Firestore
                            // Ensure security rules only allow the gig creator to delete
                            alert(`Gig ${gigId} deletion logic would be implemented here.`);
                            // deleteGig(gigId); // You would implement this function
                        }
                    });
                });

            } catch (error) {
                console.error("Error loading jobseeker gigs:", error);
                gigsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading gigs: ${error.message}. Please try refreshing the page.</td></tr>`;
            }
        },

        /**
         * Loads jobs posted by the current employer.
         */
        async loadEmployerJobs() {
            console.log("Loading jobs for employer:", this.currentUserId);
            
            const jobsTableBody = document.getElementById('jobsTableBody');
            if (!jobsTableBody) {
                console.warn("Jobs table body not found for employer dashboard.");
                return;
            }

            // Show loading state
            jobsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading your jobs...</td></tr>';

            try {
                // Query Firestore for jobs where postedById equals the current user's UID
                // Make sure your Firestore security rules allow this read operation for the user
                const querySnapshot = await window.db.collection('job_posts')
                    .where('postedById', '==', this.currentUserId)
                    .orderBy('createdAt', 'desc') // Show newest first
                    .get();

                if (querySnapshot.empty) {
                    jobsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">You have not posted any jobs yet.</td></tr>';
                    return;
                }

                let jobsHtml = '';
                querySnapshot.forEach(doc => {
                    const jobData = doc.data();
                    const jobId = doc.id;

                    // Format creation date
                    let formattedDate = 'N/A';
                    if (jobData.createdAt) {
                        const dateObj = jobData.createdAt.toDate();
                        formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                    }

                    // Determine employer info (could be company name or contact person's name)
                    let employerName = jobData.companyName || jobData.postedByName || 'Unknown Employer';
                    let employerAvatarText = employerName.charAt(0).toUpperCase();
                    
                    // Format budget
                    const budget = jobData.budget ? `$${jobData.budget}` : 'Budget N/A';

                    jobsHtml += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center;">
                                    <div class="job-poster-avatar">${employerAvatarText}</div>
                                    <span class="job-poster-name">${escapeHtml(employerName)}</span>
                                </div>
                            </td>
                            <td>${escapeHtml(jobData.title || 'Untitled Job')}</td>
                            <td>${escapeHtml(jobData.category || 'Uncategorized')}</td>
                            <td>${escapeHtml(budget)}</td>
                            <td><span class="badge badge-${jobData.status === 'active' ? 'success' : jobData.status === 'paused' ? 'warning' : 'danger'}">${jobData.status?.charAt(0).toUpperCase() + jobData.status?.slice(1) || 'Unknown'}</span></td>
                            <td>${formattedDate}</td>
                            <td>
                                <button class="btn btn-outline btn-sm edit-job-btn" data-job-id="${jobId}" style="margin-right: 0.5rem;"><i class="fas fa-edit"></i> Edit</button>
                                <button class="btn btn-danger btn-sm delete-job-btn" data-job-id="${jobId}"><i class="fas fa-trash"></i> Delete</button>
                            </td>
                        </tr>
                    `;
                });

                jobsTableBody.innerHTML = jobsHtml;

                // Attach event listeners to job action buttons
                document.querySelectorAll('.edit-job-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const jobId = this.getAttribute('data-job-id');
                        console.log(`Edit job button clicked for ID: ${jobId}`);
                        // Redirect to edit job page or open modal
                        window.location.href = `/edit-job-post.html?id=${jobId}`;
                    });
                });

                document.querySelectorAll('.delete-job-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const jobId = this.getAttribute('data-job-id');
                        console.log(`Delete job button clicked for ID: ${jobId}`);
                        if (confirm("Are you sure you want to delete this job post? This action cannot be undone.")) {
                             // In a real app, this would call a function to delete the job from Firestore
                            // Ensure security rules only allow the job poster to delete
                            alert(`Job ${jobId} deletion logic would be implemented here.`);
                            // deleteJobPost(jobId); // You would implement this function
                        }
                    });
                });

            } catch (error) {
                console.error("Error loading employer jobs:", error);
                jobsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading jobs: ${error.message}. Please try refreshing the page.</td></tr>`;
            }
        },

        /**
         * Loads pending KYC verifications for admin dashboard.
         */
        async loadPendingKycVerifications() {
            console.log("Loading pending KYC verifications for admin...");
            
            const kycTableBody = document.getElementById('kycTableBody');
            if (!kycTableBody) {
                console.warn("KYC table body not found for admin dashboard.");
                return;
            }

            // Show loading state
            kycTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading pending KYC verifications...</td></tr>';

            try {
                // Query Firestore for KYC verifications where status is 'pending'
                // Make sure your Firestore security rules allow admins to read this collection
                const querySnapshot = await window.db.collection('kyc_verifications')
                    .where('status', '==', 'pending')
                    .orderBy('submittedAt', 'desc') // Show newest first
                    .get();

                if (querySnapshot.empty) {
                    kycTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No pending KYC verifications.</td></tr>';
                    return;
                }

                let kycHtml = '';
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
                    let userName = kycData.fullName || kycData.username || 'Unknown User';
                    let userEmail = kycData.emailAddress || 'No email';
                    let userAvatarText = userName.charAt(0).toUpperCase();
                    
                    // Format ID type
                    const idType = kycData.idType || 'N/A';

                    kycHtml += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center;">
                                    <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 1rem; box-shadow: var(--shadow-xs); flex-shrink: 0;">${userAvatarText}</div>
                                    <div>
                                        <div style="font-weight: var(--font-weight-semibold);">${escapeHtml(userName)}</div>
                                        <div style="font-size: var(--font-size-sm); color: var(--gray-500);">${escapeHtml(userEmail)}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${formattedDate}</td>
                            <td>${escapeHtml(idType)}</td>
                            <td><span class="badge badge-warning">Pending</span></td>
                            <td>
                                <button class="btn btn-outline btn-sm view-kyc-btn" data-kyc-id="${kycId}" style="margin-right: 0.5rem;"><i class="fas fa-eye"></i> View</button>
                                <button class="btn btn-success btn-sm approve-kyc-btn" data-kyc-id="${kycId}" style="margin-right: 0.5rem;"><i class="fas fa-check"></i> Approve</button>
                                <button class="btn btn-danger btn-sm reject-kyc-btn" data-kyc-id="${kycId}"><i class="fas fa-times"></i> Reject</button>
                            </td>
                        </tr>
                    `;
                });

                kycTableBody.innerHTML = kycHtml;

                // Attach event listeners to KYC action buttons
                document.querySelectorAll('.view-kyc-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const kycId = this.getAttribute('data-kyc-id');
                        console.log(`View KYC button clicked for ID: ${kycId}`);
                        // Redirect to KYC detail page or open modal
                        window.location.href = `/kyc-detail.html?id=${kycId}`;
                    });
                });

                document.querySelectorAll('.approve-kyc-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const kycId = this.getAttribute('data-kyc-id');
                        console.log(`Approve KYC button clicked for ID: ${kycId}`);
                        if (confirm("Are you sure you want to approve this KYC verification?")) {
                             // In a real app, this would call a function to approve the KYC in Firestore
                            // Ensure security rules only allow admins to update
                            alert(`KYC ${kycId} approval logic would be implemented here.`);
                            // approveKyc(kycId); // You would implement this function
                        }
                    });
                });

                document.querySelectorAll('.reject-kyc-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const kycId = this.getAttribute('data-kyc-id');
                        console.log(`Reject KYC button clicked for ID: ${kycId}`);
                        if (confirm("Are you sure you want to reject this KYC verification?")) {
                             // In a real app, this would call a function to reject the KYC in Firestore
                            // Ensure security rules only allow admins to update
                            alert(`KYC ${kycId} rejection logic would be implemented here.`);
                            // rejectKyc(kycId); // You would implement this function
                        }
                    });
                });

            } catch (error) {
                console.error("Error loading pending KYC verifications:", error);
                kycTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger-500);">Error loading KYC verifications: ${error.message}. Please try refreshing the page.</td></tr>`;
            }
        },

        /**
         * Loads pending withdrawal requests for admin dashboard.
         */
        async loadPendingWithdrawalRequests() {
            console.log("Loading pending withdrawal requests for admin...");
            
            const withdrawalsTableBody = document.getElementById('withdrawalsTableBody');
            if (!withdrawalsTableBody) {
                console.warn("Withdrawals table body not found for admin dashboard.");
                return;
            }

            // Show loading state
            withdrawalsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading pending withdrawal requests...</td></tr>';

            try {
                // Query Firestore for withdrawal requests where status is 'pending'
                // Make sure your Firestore security rules allow admins to read this collection
                const querySnapshot = await window.db.collection('withdrawal_requests')
                    .where('status', '==', 'pending')
                    .orderBy('requestedAt', 'desc') // Show newest first
                    .get();

                if (querySnapshot.empty) {
                    withdrawalsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No pending withdrawal requests.</td></tr>';
                    return;
                }

                let withdrawalsHtml = '';
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

                    withdrawalsHtml += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center;">
                                    <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 1rem; box-shadow: var(--shadow-xs); flex-shrink: 0;">${requesterAvatarText}</div>
                                    <div>
                                        <div style="font-weight: var(--font-weight-semibold);">${escapeHtml(requesterName)}</div>
                                        <div style="font-size: var(--font-size-sm); color: var(--gray-500);">${escapeHtml(requestData.requesterEmail || 'No email')}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${escapeHtml(amount)}</td>
                            <td>${escapeHtml(method)}</td>
                            <td>${escapeHtml(details)}</td>
                            <td>${formattedDate}</td>
                            <td><span class="badge badge-warning">Pending</span></td>
                            <td>
                                <button class="btn btn-success btn-sm approve-withdrawal-btn" data-request-id="${requestId}" style="margin-right: 0.5rem;"><i class="fas fa-check"></i> Approve</button>
                                <button class="btn btn-danger btn-sm reject-withdrawal-btn" data-request-id="${requestId}"><i class="fas fa-times"></i> Reject</button>
                            </td>
                        </tr>
                    `;
                });

                withdrawalsTableBody.innerHTML = withdrawalsHtml;

                // Attach event listeners to withdrawal action buttons
                document.querySelectorAll('.approve-withdrawal-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const requestId = this.getAttribute('data-request-id');
                        console.log(`Approve withdrawal button clicked for ID: ${requestId}`);
                        if (confirm("Are you sure you want to approve this withdrawal request?")) {
                             // In a real app, this would call a function to approve the request in Firestore
                            // Ensure security rules only allow admins to update
                            alert(`Withdrawal request ${requestId} approval logic would be implemented here.`);
                            // approveWithdrawalRequest(requestId); // You would implement this function
                        }
                    });
                });

                document.querySelectorAll('.reject-withdrawal-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const requestId = this.getAttribute('data-request-id');
                        console.log(`Reject withdrawal button clicked for ID: ${requestId}`);
                        if (confirm("Are you sure you want to reject this withdrawal request?")) {
                             // In a real app, this would call a function to reject the request in Firestore
                            // Ensure security rules only allow admins to update
                            alert(`Withdrawal request ${requestId} rejection logic would be implemented here.`);
                            // rejectWithdrawalRequest(requestId); // You would implement this function
                        }
                    });
                });

            } catch (error) {
                console.error("Error loading pending withdrawal requests:", error);
                withdrawalsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-500);">Error loading withdrawal requests: ${error.message}. Please try refreshing the page.</td></tr>`;
            }
        },

        /**
         * Loads recent activity for the specified role.
         * @param {string} role - The user's role ('jobseeker', 'employer', 'admin').
         */
        async loadRecentActivity(role) {
            console.log(`Loading recent activity for role: ${role}`);
            
            const recentActivityList = document.getElementById('recentActivityList');
            if (!recentActivityList) {
                console.warn("Recent activity list not found.");
                return;
            }

            // Show loading state
            recentActivityList.innerHTML = '<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">Loading recent activity...</li>';

            try {
                // In a real app, you would fetch recent activity from Firestore based on role
                // For now, we'll simulate with placeholder data
                let activityData = [];
                switch(role) {
                    case 'jobseeker':
                        activityData = [
                            { type: 'order', message: 'New order received for "Logo Design"', timestamp: new Date(Date.now() - 3600000) }, // 1 hour ago
                            { type: 'message', message: 'New message from client "Tech Solutions"', timestamp: new Date(Date.now() - 7200000) }, // 2 hours ago
                            { type: 'review', message: 'New review received for "Website Development"', timestamp: new Date(Date.now() - 86400000) } // 1 day ago
                        ];
                        break;
                    case 'employer':
                        activityData = [
                            { type: 'application', message: 'New application for "Web Developer Needed"', timestamp: new Date(Date.now() - 1800000) }, // 30 minutes ago
                            { type: 'message', message: 'New message from freelancer "Alex Johnson"', timestamp: new Date(Date.now() - 3600000) }, // 1 hour ago
                            { type: 'order', message: 'Order completed for "Social Media Marketing"', timestamp: new Date(Date.now() - 172800000) } // 2 days ago
                        ];
                        break;
                    case 'admin':
                        activityData = [
                            { type: 'user', message: 'New user registered: "Sarah Williams"', timestamp: new Date(Date.now() - 900000) }, // 15 minutes ago
                            { type: 'kyc', message: 'New KYC verification request', timestamp: new Date(Date.now() - 1800000) }, // 30 minutes ago
                            { type: 'withdrawal', message: 'New withdrawal request from "Tech Solutions"', timestamp: new Date(Date.now() - 3600000) }, // 1 hour ago
                            { type: 'job', message: 'New job post: "Content Writer Needed"', timestamp: new Date(Date.now() - 7200000) }, // 2 hours ago
                            { type: 'gig', message: 'New gig: "I will design a logo"', timestamp: new Date(Date.now() - 10800000) } // 3 hours ago
                        ];
                        break;
                    default:
                        activityData = [
                            { type: 'general', message: 'Welcome to your dashboard!', timestamp: new Date() }
                        ];
                }

                console.log("Activity data loaded:", activityData);

                // Update recent activity UI
                this.updateRecentActivity(activityData);

            } catch (error) {
                console.error("Error loading recent activity:", error);
                recentActivityList.innerHTML = `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); color: var(--danger-500);">Error loading recent activity: ${error.message}</li>`;
            }
        },

        /**
         * Updates the recent activity UI with loaded data.
         * @param {Array} activityData - The recent activity data.
         */
        updateRecentActivity(activityData) {
            const recentActivityList = document.getElementById('recentActivityList');
            if (!recentActivityList) return;

            if (activityData.length === 0) {
                recentActivityList.innerHTML = '<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">No recent activity.</li>';
                return;
            }

            let activityHtml = '';
            activityData.forEach(activity => {
                // Format timestamp
                let formattedTime = 'Just now';
                if (activity.timestamp) {
                    const diffMs = Date.now() - activity.timestamp.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (diffDays > 0) {
                        formattedTime = `${diffDays}d ago`;
                    } else if (diffHours > 0) {
                        formattedTime = `${diffHours}h ago`;
                    } else if (diffMinutes > 0) {
                        formattedTime = `${diffMinutes}m ago`;
                    } else {
                        formattedTime = 'Just now';
                    }
                }

                // Determine icon based on activity type
                let iconClass = 'fas fa-info-circle';
                switch(activity.type) {
                    case 'order':
                        iconClass = 'fas fa-shopping-cart';
                        break;
                    case 'message':
                        iconClass = 'fas fa-comments';
                        break;
                    case 'review':
                        iconClass = 'fas fa-star';
                        break;
                    case 'application':
                        iconClass = 'fas fa-file-alt';
                        break;
                    case 'user':
                        iconClass = 'fas fa-user-plus';
                        break;
                    case 'kyc':
                        iconClass = 'fas fa-id-card';
                        break;
                    case 'withdrawal':
                        iconClass = 'fas fa-money-bill-transfer';
                        break;
                    case 'job':
                        iconClass = 'fas fa-briefcase';
                        break;
                    case 'gig':
                        iconClass = 'fas fa-laptop-code';
                        break;
                    default:
                        iconClass = 'fas fa-info-circle';
                }

                activityHtml += `
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: flex-start;">
                            <i class="${iconClass}" style="font-size: 1.5rem; color: var(--primary-500); margin-right: 1rem; flex-shrink: 0;"></i>
                            <div>
                                <div style="font-weight: var(--font-weight-semibold);">${escapeHtml(activity.message)}</div>
                                <div style="font-size: var(--font-size-sm); color: var(--gray-500);">${formattedTime}</div>
                            </div>
                        </div>
                    </li>
                `;
            });

            recentActivityList.innerHTML = activityHtml;
        }
    };

    // Initialize the dashboard system
    window.DashboardSystem.init();

    // --- UTILITY FUNCTIONS ---
    /**
     * Shows a loading state for the dashboard.
     */
    function showDashboardLoadingState() {
        const dashboardHeader = document.querySelector('.dashboard-header');
        const dashboardStats = document.querySelector('.dashboard-stats');
        const recentActivityList = document.getElementById('recentActivityList');

        if (dashboardHeader) {
            dashboardHeader.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                    <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Loading dashboard...</p>
                </div>
            `;
        }

        if (dashboardStats) {
            dashboardStats.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1;">
                    <div class="spinner" style="width: 3rem; height: 3rem; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: var(--primary-600); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Loading dashboard statistics...</p>
                </div>
            `;
        }

        if (recentActivityList) {
            recentActivityList.innerHTML = '<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">Loading recent activity...</li>';
        }
    }

    /**
     * Hides the dashboard UI and shows an error message.
     */
    function hideDashboardUI() {
        const dashboardSections = document.querySelectorAll('.dashboard-section');
        dashboardSections.forEach(section => {
            section.style.display = 'none';
        });

        const dashboardHeader = document.querySelector('.dashboard-header');
        if (dashboardHeader) {
            dashboardHeader.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-10); grid-column: 1 / -1; color: var(--danger-500);">
                    <p>Unable to load dashboard. Please log in or refresh the page.</p>
                </div>
            `;
        }

        console.log("Dashboard UI hidden due to auth state or error");
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

    // Make utility functions globally available
    window.showDashboardLoadingState = showDashboardLoadingState;
    window.hideDashboardUI = hideDashboardUI;
    window.escapeHtml = escapeHtml;

    // --- FORM SUBMISSION HANDLERS ---
    // These are more robust ways to handle forms, called by page-specific scripts

    /**
     * Generic handler for dashboard forms.
     * Expects form to have relevant inputs and a hidden 'role' input or determined logic.
     */
    window.handleDashboardFormSubmit = async function(event) {
         event.preventDefault();
        console.log("Dashboard form submission triggered via global handler");

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
        if (form.id === 'jobseekerDashboardForm' || username) {
            role = 'jobseeker';
        } else if (form.id === 'employerDashboardForm' || companyName) {
            role = 'employer';
        }
        console.log("Determined role for dashboard form:", role);

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

        console.log("Prepared user data for dashboard form:", userData);

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving Changes...';
        }

        try {
            await window.handleFirebaseDashboardFormSubmit(userData);
            // If successful, handleFirebaseDashboardFormSubmit will redirect. No further action needed here.
        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Save Changes';
            }
            // Error message already shown in handleFirebaseDashboardFormSubmit
            console.error("Dashboard form failed in global handler:", error);
        }
    };
    // --- End Form Submission Handlers ---

    // --- ATTACH LISTENERS TO EXISTING FORMS ON PAGE LOAD ---
    // This part might be redundant now as we are attaching listeners directly in the HTML pages
    // but it's kept for completeness or if you have forms dynamically added
    const dashboardForm = document.getElementById('dashboardForm'); // Make sure your dashboard form has this ID
    if (dashboardForm) {
        console.log("Found dashboard form, attaching submit listener");
        dashboardForm.addEventListener('submit', window.handleDashboardFormSubmit);
    } else {
        console.log("Dashboard form not found on this page");
    }

    const jobseekerDashboardForm = document.getElementById('jobseekerDashboardForm');
    if (jobseekerDashboardForm) {
        console.log("Found jobseeker dashboard form, attaching submit listener");
        jobseekerDashboardForm.addEventListener('submit', window.handleDashboardFormSubmit);
    } else {
        console.log("Jobseeker dashboard form not found on this page");
    }

    const employerDashboardForm = document.getElementById('employerDashboardForm');
    if (employerDashboardForm) {
        console.log("Found employer dashboard form, attaching submit listener");
        employerDashboardForm.addEventListener('submit', window.handleDashboardFormSubmit);
    } else {
        console.log("Employer dashboard form not found on this page");
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