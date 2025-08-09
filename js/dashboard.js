// js/dashboard.js - JavaScript for dashboard pages

console.log("Dashboard module loaded");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Dashboard DOM loaded");

    // --- TAB NAVIGATION ---
    const tabs = document.querySelectorAll('.tab');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                this.classList.add('active');

                // Hide all tab content
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.style.display = 'none');

                // Show content related to the clicked tab
                const targetContentId = this.getAttribute('data-tab');
                const targetContent = document.getElementById(targetContentId);
                if (targetContent) {
                    targetContent.style.display = 'block';
                }

                console.log(`Switched to tab: ${targetContentId}`);
            });
        });
    }

    // --- GENERIC BUTTON HANDLING (Action Buttons in Tables) ---
    document.body.addEventListener('click', function (e) {
        // Handle "Message Seller" button
        if (e.target.classList.contains('message-btn')) {
            const sellerName = e.target.getAttribute('data-seller');
            console.log(`Initiating message to ${sellerName}`);
            alert(`Messaging functionality for ${sellerName} would be implemented here.`);
            // This could open a chat modal or redirect to messages page
        }

        // Handle "View Details" button
        if (e.target.classList.contains('view-details-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            console.log(`Viewing details for order ${orderId}`);
            alert(`View details for order ${orderId} would be implemented here.`);
            // This could open a modal with order details or redirect to an order page
        }

        // Handle "Leave Review" button
        if (e.target.classList.contains('review-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            console.log(`Leaving review for order ${orderId}`);
            alert(`Review functionality for order ${orderId} would be implemented here.`);
            // This could open a review modal
        }

        // Example: Approve Payment (Admin/Escrow Release)
        if (e.target.classList.contains('approve-payment-btn')) {
            const paymentId = e.target.getAttribute('data-payment-id');
            console.log(`Approving payment ${paymentId}`);
            alert(`Payment ${paymentId} approved for release. (This would trigger backend logic)`);
            // In a real app, this would call a backend function or update Firestore
            // e.g., db.collection('payments').doc(paymentId).update({ status: 'approved_for_release' });
        }

        // --- JOB POST RELATED BUTTONS (Client Dashboard) ---
        // Handle "View Applications" button for a job post
        if (e.target.classList.contains('view-applications-btn')) {
            const jobId = e.target.getAttribute('data-job-id');
            console.log(`Viewing applications for job ${jobId}`);
            // Redirect to a job applications page or open a modal
            alert(`Viewing applications for job ${jobId} would be implemented here.`);
            // window.location.href = `/job-applications.html?jobId=${jobId}`;
        }

        // Handle "Delete Job" button for a job post
        if (e.target.classList.contains('delete-job-btn')) {
            const jobId = e.target.getAttribute('data-job-id');
            console.log(`Deleting job ${jobId}`);
            if (confirm("Are you sure you want to delete this job post? This action cannot be undone.")) {
                 // In a real app, this would call a function to delete the job from Firestore
                // Ensure security rules only allow the job poster to delete
                alert(`Job ${jobId} deletion logic would be implemented here.`);
                // deleteJobPost(jobId); // You would implement this function
            }
        }
        // --- END JOB POST BUTTONS ---
    });

    // --- LOAD POSTED JOBS FOR CLIENT DASHBOARD ---
    // Check if we are on the client dashboard page and the table element exists
    const postedJobsTableBody = document.getElementById('postedJobsTableBody');
    if (postedJobsTableBody) {
        console.log("Detected client dashboard job posts section. Loading jobs...");
        loadPostedJobsForClient();
    }

    /**
     * Loads job posts created by the currently logged-in client.
     * Populates the table body with job data.
     */
    async function loadPostedJobsForClient() {
        const user = window.firebaseApp?.auth?.currentUser;
        if (!user) {
            console.warn("No user logged in or Firebase not initialized for job loading.");
            postedJobsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Please log in to see your job posts.</td></tr>';
            return;
        }

        // Show loading state
        postedJobsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading your job posts...</td></tr>';

        try {
            // Query Firestore for job posts where postedById equals the current user's UID
            // Make sure your Firestore security rules allow this read operation for the user
            const querySnapshot = await window.firebaseApp.db
                .collection('job_posts')
                .where('postedById', '==', user.uid)
                .orderBy('createdAt', 'desc') // Show newest first
                .get();

            if (querySnapshot.empty) {
                postedJobsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">You have not posted any jobs yet.</td></tr>';
                return;
            }

            let tableRowsHtml = '';
            // Iterate through the documents returned by the query
            querySnapshot.forEach((doc) => {
                const jobData = doc.data();
                const jobId = doc.id;

                // Format the creation date
                let formattedDate = 'N/A';
                if (jobData.createdAt && jobData.createdAt.toDate) {
                     // toDate() converts Firestore Timestamp to JS Date
                    const dateObj = jobData.createdAt.toDate();
                    formattedDate = dateObj.toLocaleDateString(); // e.g., 10/27/2023
                    // You can customize the format further if needed
                    // formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                }

                // Determine status badge class for visual indication
                let statusBadgeClass = 'badge-secondary'; // Default
                if (jobData.status === 'active') {
                    statusBadgeClass = 'badge-success';
                } else if (jobData.status === 'paused') {
                    statusBadgeClass = 'badge-warning';
                } else if (jobData.status === 'closed' || jobData.status === 'expired') {
                    statusBadgeClass = 'badge-danger';
                }

                // Capitalize status for display
                const displayStatus = jobData.status ? jobData.status.charAt(0).toUpperCase() + jobData.status.slice(1) : 'Unknown';

                // Placeholder for application count - in a real app, you'd query a separate 'job_applications' collection
                const applicationCount = 'N/A (Query job_applications collection)';

                // Construct the HTML for a table row
                tableRowsHtml += `
                    <tr>
                        <td>
                            <a href="/job-detail.html?id=${jobId}" style="font-weight: var(--font-weight-semibold);">${escapeHtml(jobData.title || 'Untitled Job')}</a>
                            <div style="font-size: var(--font-size-sm); color: var(--gray-500);">${escapeHtml(jobData.category || 'Uncategorized')}</div>
                        </td>
                        <td>${applicationCount}</td>
                        <td><span class="badge ${statusBadgeClass}">${displayStatus}</span></td>
                        <td>${formattedDate}</td>
                        <td>
                            <a href="/job-detail.html?id=${jobId}" class="btn btn-outline btn-sm" style="margin-right: 0.5rem;">View</a>
                            <button class="btn btn-primary btn-sm view-applications-btn" data-job-id="${jobId}" style="margin-right: 0.5rem;">Applications</button>
                            <button class="btn btn-danger btn-sm delete-job-btn" data-job-id="${jobId}">Delete</button>
                        </td>
                    </tr>
                `;
            });

            // Inject the generated HTML rows into the table body
            postedJobsTableBody.innerHTML = tableRowsHtml;

        } catch (error) {
            console.error("Error loading posted jobs for client:", error);
            // Display a user-friendly error message in the table
            postedJobsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error loading job posts: ${error.message}. Please try refreshing the page.</td></tr>`;
        }
    }

    /**
     * A simple utility function to escape HTML to prevent XSS vulnerabilities
     * when inserting data from Firestore into the DOM.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHtml(str) {
        if (typeof str !== 'string') return str; // Handle non-string inputs gracefully
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- CURRENCY SETTINGS LOGIC (Admin Dashboard) ---
    const primaryCurrencySelect = document.getElementById('primaryCurrencySelect');
    const supportedCurrenciesSelect = document.getElementById('supportedCurrenciesSelect');
    const saveCurrencySettingsBtn = document.getElementById('saveCurrencySettingsBtn');
    const resetCurrencySettingsBtn = document.getElementById('resetCurrencySettingsBtn');
    const exchangeRatesDisplay = document.getElementById('exchangeRatesDisplay');

    if (primaryCurrencySelect && supportedCurrenciesSelect && saveCurrencySettingsBtn && resetCurrencySettingsBtn) {
        console.log("Currency settings elements found, loading current settings...");

        // Load current currency settings from Firestore
        loadCurrencySettings();

        // Handle Save Button Click
        saveCurrencySettingsBtn.addEventListener('click', async function() {
            console.log("Saving currency settings...");
            
            const primaryCurrency = primaryCurrencySelect.value;
            const selectedOptions = Array.from(supportedCurrenciesSelect.selectedOptions);
            const supportedCurrencies = selectedOptions.map(option => option.value);

            if (!primaryCurrency) {
                alert("Please select a primary currency.");
                return;
            }

            if (supportedCurrencies.length === 0) {
                alert("Please select at least one supported currency.");
                return;
            }

            if (!supportedCurrencies.includes(primaryCurrency)) {
                alert("The primary currency must also be selected in supported currencies.");
                return;
            }

            const settingsData = {
                primaryCurrency: primaryCurrency,
                supportedCurrencies: supportedCurrencies
            };

            console.log("Saving currency settings:", settingsData);

            try {
                // Ensure Firebase services are available
                if (!window.firebaseApp || !window.firebaseApp.db) {
                    throw new Error("Firestore 'db' not available.");
                }

                // Update the 'platform' document in the 'settings' collection
                await window.firebaseApp.db.collection('settings').doc('platform').update(settingsData);
                
                console.log("Currency settings saved successfully!");
                alert("Currency settings saved successfully!");
                
                // Reload platform settings globally
                if (typeof window.loadPlatformSettings === 'function') {
                    await window.loadPlatformSettings();
                }
                
                // Reload the currency settings display
                loadCurrencySettings();
                
            } catch (error) {
                console.error("Error saving currency settings:", error);
                alert("Failed to save currency settings. Please try again.");
            }
        });

        // Handle Reset Button Click
        resetCurrencySettingsBtn.addEventListener('click', function() {
            console.log("Resetting currency settings form...");
            loadCurrencySettings(); // Reload from Firestore
        });
    } else {
        console.log("Currency settings elements not found on this page (not admin dashboard).");
    }

    /**
     * Loads current currency settings from Firestore and populates the form.
     */
    async function loadCurrencySettings() {
        console.log("Loading currency settings from Firestore...");
        
        // Ensure elements exist
        if (!primaryCurrencySelect || !supportedCurrenciesSelect || !exchangeRatesDisplay) {
            console.warn("Currency settings form elements not found.");
            return;
        }

        // Show loading state
        primaryCurrencySelect.innerHTML = '<option value="">Loading...</option>';
        supportedCurrenciesSelect.innerHTML = '<option value="">Loading...</option>';
        exchangeRatesDisplay.textContent = 'Loading exchange rates...';

        try {
            // Ensure Firebase services are available
            if (!window.firebaseApp || !window.firebaseApp.db) {
                throw new Error("Firestore 'db' not available.");
            }

            // Query the 'settings' collection for the 'platform' document
            const settingsDoc = await window.firebaseApp.db.collection('settings').doc('platform').get();

            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                console.log("Currency settings data loaded:", settingsData);

                const primaryCurrency = settingsData.primaryCurrency || 'USD';
                const supportedCurrencies = settingsData.supportedCurrencies || ['USD'];
                const exchangeRates = settingsData.exchangeRates || {};

                // Populate Primary Currency Select
                primaryCurrencySelect.innerHTML = ''; // Clear loading option
                const currencyOptions = [
                    { value: 'USD', label: 'USD - US Dollar' },
                    { value: 'EUR', label: 'EUR - Euro' },
                    { value: 'PHP', label: 'PHP - Philippine Peso' },
                    { value: 'NGN', label: 'NGN - Nigerian Naira' },
                    { value: 'SGD', label: 'SGD - Singapore Dollar' },
                    { value: 'AUD', label: 'AUD - Australian Dollar' },
                    { value: 'INR', label: 'INR - Indian Rupee' }
                ];

                currencyOptions.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    if (option.value === primaryCurrency) {
                        opt.selected = true;
                    }
                    primaryCurrencySelect.appendChild(opt);
                });

                // Populate Supported Currencies Multi-Select
                supportedCurrenciesSelect.innerHTML = ''; // Clear loading option
                currencyOptions.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.label;
                    if (supportedCurrencies.includes(option.value)) {
                        opt.selected = true;
                    }
                    supportedCurrenciesSelect.appendChild(opt);
                });

                // Display Exchange Rates
                let ratesHtml = '<strong>Current Exchange Rates (relative to primary):</strong><br>';
                if (Object.keys(exchangeRates).length > 0) {
                    for (const [currency, rate] of Object.entries(exchangeRates)) {
                        ratesHtml += `${currency}: ${rate}<br>`;
                    }
                } else {
                    ratesHtml += 'No exchange rates configured.';
                }
                exchangeRatesDisplay.innerHTML = ratesHtml;

            } else {
                console.warn("Platform settings document not found in Firestore.");
                primaryCurrencySelect.innerHTML = '<option value="">Select Primary Currency</option>';
                supportedCurrenciesSelect.innerHTML = '<option value="">Select Supported Currencies</option>';
                exchangeRatesDisplay.textContent = 'No exchange rates configured.';
            }
        } catch (error) {
            console.error("Error loading currency settings:", error);
            primaryCurrencySelect.innerHTML = '<option value="">Error loading</option>';
            supportedCurrenciesSelect.innerHTML = '<option value="">Error loading</option>';
            exchangeRatesDisplay.textContent = `Error loading exchange rates: ${error.message}`;
        }
    }
    // --- END CURRENCY SETTINGS LOGIC ---

    // Placeholder for job deletion function (requires Firestore integration and security rules)
    // async function deleteJobPost(jobId) {
    //     const user = window.firebaseApp?.auth?.currentUser;
    //     if (!user) {
    //         alert("You must be logged in to delete a job.");
    //         return;
    //     }
    //
    //     if (!jobId) {
    //         console.error("deleteJobPost called without a jobId");
    //         return;
    //     }
    //
    //     try {
    //         // Firestore security rules should ensure only the job poster can delete
    //         await window.firebaseApp.db.collection('job_posts').doc(jobId).delete();
    //         console.log(`Job post ${jobId} deleted successfully.`);
    //         alert("Job post deleted successfully.");
    //         // Reload the job list to reflect the deletion
    //         loadPostedJobsForClient();
    //     } catch (error) {
    //         console.error("Error deleting job post:", error);
    //         alert("Failed to delete job post. Please try again.");
    //     }
    // }

    // --- Example: Initialize charts or graphs if you add them later ---
    // function initializeDashboardCharts() {
    //     console.log("Initializing dashboard charts");
    //     // Use a library like Chart.js to create charts
    //     // Example:
    //     // const ctx = document.getElementById('earningsChart');
    //     // if (ctx) {
    //     //   const chart = new Chart(ctx, { ... });
    //     // }
    // }
    // initializeDashboardCharts();
});