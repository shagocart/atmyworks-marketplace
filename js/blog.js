document.addEventListener('DOMContentLoaded', function () {
    console.log("Blog JS loaded");

    // --- Newsletter Subscription Form ---
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
            alert(`Thank you for subscribing with ${email}!`);
            emailInput.value = '';
        });
    }

    // --- Client-Side Blog Post Search/Filter ---
    const blogSearchInput = document.getElementById('blogSearch');
    const blogPostCards = document.querySelectorAll('.blog-post-card');

    if (blogSearchInput && blogPostCards.length > 0) {
        blogSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();

            blogPostCards.forEach(card => {
                const title = card.querySelector('h2 a').textContent.toLowerCase();
                const excerpt = card.querySelector('p').textContent.toLowerCase();
                const content = title + excerpt;

                if (content.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});