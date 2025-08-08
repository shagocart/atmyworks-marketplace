// blog.js - JavaScript for blog pages

console.log("Blog module loaded");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Blog DOM loaded");

    // Example: Handle newsletter subscription form
    const newsletterForm = document.querySelector('.newsletter-form'); // Make sure your form has this class
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (!email) {
                alert("Please enter your email address.");
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert("Please enter a valid email address.");
                return;
            }
            
            console.log("Subscribing email:", email);
            // In a full implementation, send this to your backend or Firebase
            alert(`Thank you for subscribing with ${email}!`);
            emailInput.value = ''; // Clear the input
        });
    }

    // Example: Implement simple client-side search/filter for blog posts
    // (This is basic, a full search would likely involve a backend or more complex JS)
    const blogSearchInput = document.getElementById('blogSearch');
    const blogPostCards = document.querySelectorAll('.blog-post-card');
    
    if (blogSearchInput && blogPostCards.length > 0) {
        blogSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            
            blogPostCards.forEach(card => {
                const title = card.querySelector('h2 a').textContent.toLowerCase();
                const excerpt = card.querySelector('p').textContent.toLowerCase();
                const content = title + excerpt; // Combine for search
                
                if (content.includes(searchTerm)) {
                    card.style.display = 'block'; // Show card
                } else {
                    card.style.display = 'none'; // Hide card
                }
            });
        });
    }
});