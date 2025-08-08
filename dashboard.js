// dashboard.js - JavaScript for dashboard pages

console.log("Dashboard module loaded");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Dashboard DOM loaded");

    // Tab Navigation (if your dashboard uses tabs)
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

    // Example: Handle action buttons in tables (e.g., Message, View Details, Edit)
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
    });

    // Example: Initialize charts or graphs if you add them later
    // initializeDashboardCharts();
});

// Placeholder function for dashboard charts
// function initializeDashboardCharts() {
//     console.log("Initializing dashboard charts");
//     // Use a library like Chart.js to create charts
//     // Example:
//     // const ctx = document.getElementById('earningsChart');
//     // if (ctx) {
//     //   const chart = new Chart(ctx, { ... });
//     // }
// }