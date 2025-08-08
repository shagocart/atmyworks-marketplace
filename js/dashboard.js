// dashboard.js - JavaScript for dashboard pages

console.log("Dashboard module loaded");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Dashboard DOM loaded");

    // --- Tab Navigation ---
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

    // --- Generic Button Handling (Action Buttons in Tables) ---
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

        // Handle "Approve Payment" button (Admin/Escrow Release)
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