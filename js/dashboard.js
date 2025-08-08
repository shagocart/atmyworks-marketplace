document.addEventListener('DOMContentLoaded', function () {
    console.log("Dashboard JS loaded");

    // --- Tab Navigation ---
    const tabs = document.querySelectorAll('.tab');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.style.display = 'none');

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
        if (e.target.classList.contains('message-btn')) {
            const sellerName = e.target.getAttribute('data-seller');
            console.log(`Initiating message to ${sellerName}`);
            alert(`Messaging functionality for ${sellerName} would be implemented here.`);
        }

        if (e.target.classList.contains('view-details-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            console.log(`Viewing details for order ${orderId}`);
            alert(`View details for order ${orderId} would be implemented here.`);
        }

        if (e.target.classList.contains('review-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            console.log(`Leaving review for order ${orderId}`);
            alert(`Review functionality for order ${orderId} would be implemented here.`);
        }

        // Example: Approve Payment (Admin)
        if (e.target.classList.contains('approve-payment-btn')) {
            const paymentId = e.target.getAttribute('data-payment-id');
            console.log(`Approving payment ${paymentId}`);
            alert(`Payment ${paymentId} approved for release. (This would trigger backend logic)`);
            // In a real app, this would call a backend function or update Firestore
            // e.g., db.collection('payments').doc(paymentId).update({ status: 'approved_for_release' });
        }
    });

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