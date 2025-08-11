// js/payments.js - Payment processing related JavaScript for AtMyWorks

console.log("Payments module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Payments DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in payments.js");
    } else {
        console.warn("Firebase not initialized in payments.js. Payment features will not work.");
        // Hide payment-dependent UI elements or show an error
        // updatePaymentUI(null);
        return;
    }

    // --- PAYMENT PROCESSING FUNCTIONS ---
    // These functions assume `auth`, `db`, and `storage` are globally available from your Firebase initialization

    /**
     * Initiates a payment using the selected method.
     * This function prepares the payment data and redirects the user to the appropriate payment gateway or shows instructions.
     * @param {string} method - The payment method ('paypal', 'stripe', 'maya', 'gcash').
     * @param {number} amount - The amount to be paid.
     * @param {string} currency - The currency code (e.g., 'USD', 'PHP').
     * @param {string} description - A description of the item being purchased.
     * @param {string} gigId - The ID of the gig being purchased.
     * @param {string} sellerId - The Firebase UID of the seller.
     */
    window.initiatePayment = async function(method, amount, currency, description, gigId, sellerId) {
        console.log("Initiating payment...");
        console.log("Method:", method);
        console.log("Amount:", amount);
        console.log("Currency:", currency);
        console.log("Description:", description);
        console.log("Gig ID:", gigId);
        console.log("Seller ID:", sellerId);

        // Validate inputs
        if (!method || !amount || !currency || !description || !gigId || !sellerId) {
            console.error("Missing required payment parameters:", { method, amount, currency, description, gigId, sellerId });
            alert("Missing required payment information. Please try again.");
            return;
        }

        const user = window.auth.currentUser;
        if (!user) {
            console.log("No user logged in, redirecting to login.");
            alert("Please log in to make a payment.");
            window.location.href = '/login.html';
            return;
        }

        try {
            // --- STEP 1: CREATE ORDER DOCUMENT IN FIRESTORE ---
            // Before redirecting to payment gateway, create an order document
            // This ensures we have a record of the attempted purchase
            const orderData = {
                buyerId: user.uid,
                sellerId: sellerId,
                gigId: gigId,
                amount: parseFloat(amount),
                currency: currency,
                description: description,
                status: 'pending_payment', // Initial status
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save order to Firestore
            const orderRef = await window.db.collection('orders').add(orderData);
            const orderId = orderRef.id;
            console.log("Order created with ID:", orderId);

            // --- STEP 2: REDIRECT BASED ON PAYMENT METHOD ---
            switch (method.toLowerCase()) {
                case 'paypal':
                    await processPayPalPayment(orderId, amount, currency, description, gigId, sellerId);
                    break;
                case 'stripe':
                    await processStripePayment(orderId, amount, currency, description, gigId, sellerId);
                    break;
                case 'maya':
                    await processMayaPayment(orderId, amount, currency, description, gigId, sellerId);
                    break;
                case 'gcash':
                    await processGCashPayment(orderId, amount, currency, description, gigId, sellerId);
                    break;
                default:
                    console.warn("Unsupported payment method:", method);
                    alert(`Unsupported payment method: ${method}. Please choose a different option.`);
                    // Update order status to 'failed' or 'cancelled'
                    await window.db.collection('orders').doc(orderId).update({
                        status: 'payment_failed',
                        errorMessage: `Unsupported payment method: ${method}`,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
            }
            // --- END REDIRECT LOGIC ---

        } catch (error) {
            console.error("Error initiating payment:", error);
            alert(`Payment initiation failed: ${error.message}. Please try again.`);
            // Re-throw the error so the calling function knows it failed
            throw error;
        }
    }

    /**
     * Processes a payment via PayPal.
     * This function redirects the user to PayPal's checkout page.
     * @param {string} orderId - The ID of the order in Firestore.
     * @param {number} amount - The amount to be paid.
     * @param {string} currency - The currency code (e.g., 'USD').
     * @param {string} description - A description of the item being purchased.
     * @param {string} gigId - The ID of the gig being purchased.
     * @param {string} sellerId - The Firebase UID of the seller.
     */
    async function processPayPalPayment(orderId, amount, currency, description, gigId, sellerId) {
        console.log("Processing PayPal payment for order:", orderId);
        try {
            // Ensure PayPal SDK is available
            if (typeof window.paypal === 'undefined') {
                throw new Error("PayPal SDK not loaded. Please check the console for PayPal loading errors.");
            }

            // In a real implementation, you would call YOUR OWN BACKEND SERVER
            // to create a PayPal order and get the approval URL.
            // For now, we'll simulate this by redirecting to a success page
            // with the order ID as a query parameter.

            console.log("Redirecting to PayPal checkout...");
            alert(`Redirecting to PayPal to pay ${currency} ${amount} for "${description}". This is a simulation.`);

            // Simulate successful payment redirect after a short delay
            setTimeout(() => {
                // In a full implementation, you would redirect to the PayPal approval URL
                // window.location.href = paypalApprovalUrl;
                // For simulation, redirect to order success page
                window.location.href = `/order-success.html?method=paypal&orderId=${orderId}&amount=${amount}&gigId=${gigId}&sellerId=${sellerId}`;
            }, 2000); // 2 second delay

        } catch (error) {
            console.error("PayPal payment error:", error);
            alert(`PayPal payment failed: ${error.message}. Please try again.`);
            // Update order status to 'failed' in Firestore
            await window.db.collection('orders').doc(orderId).update({
                status: 'payment_failed',
                errorMessage: error.message,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Re-throw the error so the calling function knows it failed
            throw error;
        }
    }

    /**
     * Processes a payment via Stripe.
     * This function redirects the user to Stripe's checkout page.
     * @param {string} orderId - The ID of the order in Firestore.
     * @param {number} amount - The amount to be paid.
     * @param {string} currency - The currency code (e.g., 'USD').
     * @param {string} description - A description of the item being purchased.
     * @param {string} gigId - The ID of the gig being purchased.
     * @param {string} sellerId - The Firebase UID of the seller.
     */
    async function processStripePayment(orderId, amount, currency, description, gigId, sellerId) {
        console.log("Processing Stripe payment for order:", orderId);
        try {
            // Ensure Stripe.js is available
            if (typeof window.Stripe === 'undefined') {
                throw new Error("Stripe.js library not loaded. Please check the console for Stripe loading errors.");
            }

            // In a real implementation, you would call YOUR OWN BACKEND SERVER
            // to create a Stripe Checkout Session and get the session ID.
            // For now, we'll simulate this by redirecting to a success page
            // with the order ID as a query parameter.

            console.log("Redirecting to Stripe checkout...");
            alert(`Redirecting to Stripe to pay ${currency} ${amount} for "${description}". This is a simulation.`);

            // Simulate successful payment redirect after a short delay
            setTimeout(() => {
                // In a full implementation, you would redirect to the Stripe checkout page
                // window.location.href = `https://checkout.stripe.com/pay/${stripeSessionId}`;
                // For simulation, redirect to order success page
                window.location.href = `/order-success.html?method=stripe&orderId=${orderId}&amount=${amount}&gigId=${gigId}&sellerId=${sellerId}`;
            }, 2000); // 2 second delay

        } catch (error) {
            console.error("Stripe payment error:", error);
            alert(`Stripe payment failed: ${error.message}. Please try again.`);
            // Update order status to 'failed' in Firestore
            await window.db.collection('orders').doc(orderId).update({
                status: 'payment_failed',
                errorMessage: error.message,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Re-throw the error so the calling function knows it failed
            throw error;
        }
    }

    /**
     * Processes a payment via Maya.
     * This function displays instructions for the user to manually send money to a Maya account.
     * @param {string} orderId - The ID of the order in Firestore.
     * @param {number} amount - The amount to be paid.
     * @param {string} currency - The currency code (e.g., 'PHP').
     * @param {string} description - A description of the item being purchased.
     * @param {string} gigId - The ID of the gig being purchased.
     * @param {string} sellerId - The Firebase UID of the seller.
     */
    async function processMayaPayment(orderId, amount, currency, description, gigId, sellerId) {
        console.log("Processing Maya payment for order:", orderId);
        try {
            // In a real implementation, you would display the platform's Maya account details
            // and provide a way for the user to confirm payment (e.g., upload receipt).
            // For now, we'll simulate this with an alert and redirect to a confirmation page.

            console.log("Displaying Maya payment instructions...");
            alert(`Please send ${currency} ${amount} to Maya number: 09123456789\nReference: Order-${orderId}\nAfter payment, click "Payment Completed".`);

            // Simulate successful payment after a short delay
            setTimeout(() => {
                // In a full implementation, you would redirect to a payment confirmation page
                // where the user can upload a receipt or confirm payment.
                // window.location.href = `/payment-confirmation.html?method=maya&orderId=${orderId}`;
                // For simulation, redirect to order success page
                window.location.href = `/order-success.html?method=maya&orderId=${orderId}&amount=${amount}&gigId=${gigId}&sellerId=${sellerId}`;
            }, 2000); // 2 second delay

        } catch (error) {
            console.error("Maya payment error:", error);
            alert(`Maya payment failed: ${error.message}. Please try again.`);
            // Update order status to 'failed' in Firestore
            await window.db.collection('orders').doc(orderId).update({
                status: 'payment_failed',
                errorMessage: error.message,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Re-throw the error so the calling function knows it failed
            throw error;
        }
    }

    /**
     * Processes a payment via GCash.
     * This function displays instructions for the user to manually send money to a GCash account.
     * @param {string} orderId - The ID of the order in Firestore.
     * @param {number} amount - The amount to be paid.
     * @param {string} currency - The currency code (e.g., 'PHP').
     * @param {string} description - A description of the item being purchased.
     * @param {string} gigId - The ID of the gig being purchased.
     * @param {string} sellerId - The Firebase UID of the seller.
     */
    async function processGCashPayment(orderId, amount, currency, description, gigId, sellerId) {
        console.log("Processing GCash payment for order:", orderId);
        try {
            // In a real implementation, you would display the platform's GCash account details
            // and provide a way for the user to confirm payment (e.g., upload receipt).
            // For now, we'll simulate this with an alert and redirect to a confirmation page.

            console.log("Displaying GCash payment instructions...");
            alert(`Please send ${currency} ${amount} to GCash number: 09123456789\nReference: Order-${orderId}\nAfter payment, click "Payment Completed".`);

            // Simulate successful payment after a short delay
            setTimeout(() => {
                // In a full implementation, you would redirect to a payment confirmation page
                // where the user can upload a receipt or confirm payment.
                // window.location.href = `/payment-confirmation.html?method=gcash&orderId=${orderId}`;
                // For simulation, redirect to order success page
                window.location.href = `/order-success.html?method=gcash&orderId=${orderId}&amount=${amount}&gigId=${gigId}&sellerId=${sellerId}`;
            }, 2000); // 2 second delay

        } catch (error) {
            console.error("GCash payment error:", error);
            alert(`GCash payment failed: ${error.message}. Please try again.`);
            // Update order status to 'failed' in Firestore
            await window.db.collection('orders').doc(orderId).update({
                status: 'payment_failed',
                errorMessage: error.message,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Re-throw the error so the calling function knows it failed
            throw error;
        }
    }

    // --- UTILITY FUNCTIONS ---
    /**
     * Displays a temporary message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('success', 'danger', 'warning', 'info').
     * @param {number} duration - How long to show the message in milliseconds (default 5000).
     */
    function showMessage(message, type = 'info', duration = 5000) {
        // Remove any existing messages
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message-toast message-toast-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius-md);
            color: white;
            font-weight: var(--font-weight-semibold);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            cursor: pointer;
            transition: opacity var(--transition-normal), transform var(--transition-normal);
            opacity: 0;
            transform: translateY(-20px);
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = 'var(--success-500)';
                break;
            case 'danger':
                messageElement.style.backgroundColor = 'var(--danger-500)';
                break;
            case 'warning':
                messageElement.style.backgroundColor = 'var(--warning-500)';
                break;
            case 'info':
            default:
                messageElement.style.backgroundColor = 'var(--primary-500)';
        }

        // Append to body
        document.body.appendChild(messageElement);

        // Fade in
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 100);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.remove();
                        }
                    }, 300); // Match transition duration
                }
            }, duration);
        }

        // Remove on click
        messageElement.addEventListener('click', function() {
            this.style.opacity = '0';
            this.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (this.parentNode) {
                    this.remove();
                }
            }, 300); // Match transition duration
        });
    }

    // Make showMessage globally available
    window.showMessage = showMessage;

    // --- FORM SUBMISSION HANDLERS ---
    // These are more robust ways to handle forms, called by page-specific scripts

    /**
     * Generic handler for payment forms.
     * Expects form to have relevant inputs for payment method, amount, currency, description, gigId, sellerId.
     */
    window.handlePaymentFormSubmit = async function(event) {
        event.preventDefault();
        console.log("Payment form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const method = formData.get('paymentMethod'); // e.g., <select name="paymentMethod">
        const amount = parseFloat(formData.get('amount')); // e.g., <input type="hidden" name="amount" value="50.00">
        const currency = formData.get('currency'); // e.g., <input type="hidden" name="currency" value="USD">
        const description = formData.get('description'); // e.g., <input type="hidden" name="description" value="Logo Design Service">
        const gigId = formData.get('gigId'); // e.g., <input type="hidden" name="gigId" value="GIG_ID_HERE">
        const sellerId = formData.get('sellerId'); // e.g., <input type="hidden" name="sellerId" value="SELLER_ID_HERE">

        console.log("Payment attempt with:", { method, amount, currency, description, gigId, sellerId });

        // --- BASIC VALIDATION ---
        if (!method || isNaN(amount) || amount <= 0 || !currency || !description || !gigId || !sellerId) {
            alert("Invalid payment information. Please check the form and try again.");
            return;
        }

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing Payment...';
        }

        try {
            await window.initiatePayment(method, amount, currency, description, gigId, sellerId);
            // If successful, initiatePayment will redirect. No further action needed here.
        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Process Payment';
            }
            // Error message already shown in initiatePayment
            console.error("Payment failed in global handler:", error);
        }
    };

    // --- END FORM SUBMISSION HANDLERS ---
});