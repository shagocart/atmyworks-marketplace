// js/main.js - Core JavaScript for AtMyWorks Platform (Updated for Multi-Currency)

console.log("AtMyWorks JavaScript loaded");

// --- GLOBAL VARIABLES ---
// These will be populated after Firebase initialization
window.auth = null;
window.db = null;
window.storage = null;

// Platform settings (including currency)
window.platformSettings = {
    primaryCurrency: 'USD', // Default fallback
    supportedCurrencies: ['USD'], // Default fallback
    exchangeRates: {} // Default fallback
};

// --- FIREBASE INITIALIZATION CHECK ---
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded and parsed");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in main.js");
        
        // Load platform settings (including currency) on DOM load
        loadPlatformSettings();
    } else {
        console.warn("Firebase not initialized in main.js. Some features might not work.");
        // Hide auth-dependent UI elements or show an error
        updateAuthUI(null); 
    }

    // --- MOBILE NAVIGATION TOGGLE (if you add one later) ---
    // ... (keep existing mobile nav logic if present) ...

    // --- AUTHENTICATION BUTTON ACTIONS (Header) ---
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            console.log("Login button clicked");
            window.location.href = '/signup-employer.html'; // Or a dedicated login page
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', function () {
            console.log("Signup button clicked");
            window.location.href = '/signup-jobseeker.html'; // Default to jobseeker
        });
    }

    // --- NEWSLETTER FORM (Footer) ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
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

    // --- GENERAL FORM HANDLING (Example) ---
    // You can add more specific form handlers here or in dedicated files like auth.js
    // For example, handling a contact form:
    /*
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle contact form submission
            console.log("Contact form submitted");
            // ... logic ...
        });
    }
    */

});

// --- PLATFORM SETTINGS LOADER ---
/**
 * Loads platform-wide settings (like primary currency) from Firestore.
 * Updates the global window.platformSettings object.
 */
async function loadPlatformSettings() {
    console.log("Loading platform settings...");
    
    // Ensure Firebase services are available
    if (!window.db) {
        console.warn("Firestore 'db' not available for loading platform settings.");
        return;
    }

    try {
        // Query the 'settings' collection for the 'platform' document
        const settingsDoc = await window.db.collection('settings').doc('platform').get();

        if (settingsDoc.exists) {
            const settingsData = settingsDoc.data();
            console.log("Platform settings loaded:", settingsData);

            // Update global platform settings
            window.platformSettings.primaryCurrency = settingsData.primaryCurrency || 'USD';
            window.platformSettings.supportedCurrencies = settingsData.supportedCurrencies || ['USD'];
            window.platformSettings.exchangeRates = settingsData.exchangeRates || {};
            
            console.log("Global platform settings updated:", window.platformSettings);
            
            // Dispatch a custom event to notify other parts of the app
            window.dispatchEvent(new CustomEvent('platformSettingsLoaded', { detail: window.platformSettings }));
            
        } else {
            console.warn("Platform settings document not found in Firestore. Using defaults.");
            // Dispatch event even with defaults
            window.dispatchEvent(new CustomEvent('platformSettingsLoaded', { detail: window.platformSettings }));
        }
    } catch (error) {
        console.error("Error loading platform settings:", error);
        // Dispatch event even on error (with defaults)
        window.dispatchEvent(new CustomEvent('platformSettingsLoaded', { detail: window.platformSettings }));
    }
}

// --- CURRENCY FORMATTING UTILITY ---
/**
 * Formats a monetary amount according to the platform's primary currency.
 * @param {number} amount - The numerical amount to format.
 * @param {string} [currency] - Optional specific currency code. If omitted, uses platform's primary currency.
 * @param {boolean} [showCurrencyCode=true] - Whether to display the currency code (e.g., USD).
 * @returns {string} The formatted currency string (e.g., "$100.00" or "₱5,750.00").
 */
function formatCurrency(amount, currency = null, showCurrencyCode = true) {
    // Use provided currency or fall back to platform's primary currency
    const currencyCode = currency || window.platformSettings.primaryCurrency || 'USD';
    
    // Format the number according to the currency and locale
    // en-US is used as a base locale, but currency code determines symbol
    try {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            // You can customize minimumFractionDigits, maximumFractionDigits here if needed
        });
        
        let formattedAmount = formatter.format(amount);
        
        // Option to hide currency code (e.g., just show symbol)
        if (!showCurrencyCode) {
            // This is a simple way, might need refinement for complex locales
            // Remove the currency code part (e.g., "USD", "PHP") if it's explicitly shown
            // Intl usually handles this well with the symbol, but let's be safe
            // formattedAmount = formattedAmount.replace(currencyCode, '').trim();
            // A safer approach might be to format without style and prepend symbol manually
            // For now, we'll keep the full formatted string as Intl provides it
        }
        
        return formattedAmount;
    } catch (e) {
        console.error("Error formatting currency:", e);
        // Fallback to a simple format if Intl fails
        return `${currencyCode} ${amount.toFixed(2)}`;
    }
}

// --- CURRENCY CONVERSION UTILITY (Basic) ---
/**
 * Converts an amount from one currency to another using stored exchange rates.
 * This is a basic implementation. For real-time rates, integrate with a currency API.
 * @param {number} amount - The amount to convert.
 * @param {string} fromCurrency - The source currency code (e.g., 'USD').
 * @param {string} toCurrency - The target currency code (e.g., 'PHP').
 * @returns {number|null} The converted amount, or null if conversion is not possible.
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    // Ensure exchange rates are loaded
    if (!window.platformSettings.exchangeRates || Object.keys(window.platformSettings.exchangeRates).length === 0) {
        console.warn("Exchange rates not loaded. Cannot perform conversion.");
        return null;
    }
    
    try {
        // This assumes exchange rates are relative to the primary currency
        const primaryCurrency = window.platformSettings.primaryCurrency;
        
        let convertedAmount = amount;
        
        // Convert to primary currency first if needed
        if (fromCurrency !== primaryCurrency) {
            const fromRate = window.platformSettings.exchangeRates[fromCurrency];
            if (fromRate === undefined || fromRate <= 0) {
                console.warn(`Exchange rate for ${fromCurrency} not found or invalid.`);
                return null;
            }
            // Convert from source to primary (amount / rate)
            convertedAmount = amount / fromRate;
        }
        
        // Convert from primary to target currency if needed
        if (toCurrency !== primaryCurrency) {
            const toRate = window.platformSettings.exchangeRates[toCurrency];
            if (toRate === undefined || toRate <= 0) {
                console.warn(`Exchange rate for ${toCurrency} not found or invalid.`);
                return null;
            }
            // Convert from primary to target (amount * rate)
            convertedAmount = convertedAmount * toRate;
        }
        
        return convertedAmount;
    } catch (error) {
        console.error("Error converting currency:", error);
        return null;
    }
}

// --- UTILITY FUNCTION TO SHOW/HIDE ELEMENTS ---
function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

// --- MAKE FUNCTIONS GLOBALLY AVAILABLE ---
// Export functions for use in other scripts
window.formatCurrency = formatCurrency;
window.convertCurrency = convertCurrency;
window.loadPlatformSettings = loadPlatformSettings;
window.toggleElement = toggleElement;

console.log("Main JS module fully initialized");