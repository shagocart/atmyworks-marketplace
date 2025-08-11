// js/ai-assistant.js - AI Assistant related JavaScript for AtMyWorks

console.log("AI Assistant module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("AI Assistant DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in ai-assistant.js");
    } else {
        console.warn("Firebase not initialized in ai-assistant.js. AI features will not work.");
        // Hide AI-dependent UI elements or show an error
        hideAIUI();
        return;
    }

    // --- AI ASSISTANT INTEGRATION ---
    // This assumes you have an AI service API endpoint (e.g., OpenAI, Gemini, or your own backend)
    // For demonstration, we'll use a placeholder function that simulates an AI response
    
    /**
     * Generates content using an AI service.
     * This function simulates calling an AI API.
     * In a real implementation, you would call your backend service which interfaces with the AI model.
     * @param {string} prompt - The prompt to send to the AI.
     * @param {string} context - Additional context for the AI (e.g., 'bio', 'cover_letter', 'resume').
     * @returns {Promise<string>} The generated content from the AI.
     */
    window.generateAIContent = async function(prompt, context = '') {
        console.log("Generating AI content for context:", context, "with prompt:", prompt);
        
        // Show loading state in UI (you'd need to implement this based on your specific form fields)
        // showAILoadingState(context);

        try {
            // --- SIMULATE AI API CALL ---
            // In a real app, you would call your backend API endpoint
            // Example using fetch:
            /*
            const response = await fetch('/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include auth header if needed
                    // 'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ prompt, context })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const generatedContent = data.content; // Assuming your backend returns { content: "..." }
            console.log("AI content generated:", generatedContent);
            return generatedContent;
            */
            
            // --- FOR DEMONSTRATION ONLY ---
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simulate AI-generated content based on context
            let simulatedContent = '';
            switch(context.toLowerCase()) {
                case 'bio':
                    simulatedContent = `I am a skilled professional with [YEARS_OF_EXPERIENCE] years of experience in [INDUSTRY/TYPE_OF_WORK]. I have successfully [ACHIEVEMENT_1] and [ACHIEVEMENT_2]. My expertise lies in [SKILL_1], [SKILL_2], and [SKILL_3]. I am passionate about [PASSION_PROJECT] and strive to [GOAL_OR_VALUE_PROPOSITION].`;
                    break;
                case 'cover_letter':
                    simulatedContent = `Dear Hiring Manager,\n\nI am writing to express my interest in the [JOB_TITLE] position. With my experience in [RELEVANT_SKILLS] and passion for [INDUSTRY/TYPE_OF_WORK], I am confident I can contribute effectively to your team.\n\nIn my previous work, I have successfully [ACHIEVEMENT_1] and [ACHIEVEMENT_2]. I am particularly drawn to this opportunity because [REASON_FOR_INTEREST]. I believe my skills in [SKILL_1], [SKILL_2], and [SKILL_3] align perfectly with the requirements of this role.\n\nI am excited about the possibility of working with you and contributing to [COMPANY_NAME]'s success. Thank you for considering my application. I look forward to the opportunity to discuss how I can add value to your project.\n\nSincerely,\n[Your Name]`;
                    break;
                case 'resume':
                    simulatedContent = `[PROFESSIONAL_TITLE] with [YEARS_OF_EXPERIENCE] years of experience in [INDUSTRY/TYPE_OF_WORK]. Proven track record of [KEY_ACHIEVEMENT_1] and [KEY_ACHIEVEMENT_2]. Skilled in [SKILL_1], [SKILL_2], and [SKILL_3]. Seeking to leverage my expertise to [GOAL_OR_VALUE_PROPOSITION].`;
                    break;
                case 'search_query':
                    simulatedContent = `Try searching for: "logo design", "web developer", "content writer", "social media marketing", "video editing"`;
                    break;
                default:
                    simulatedContent = `AI-generated content based on your prompt: "${prompt}".\n\nThis is a placeholder. In a real implementation, this would be replaced with actual AI-generated text relevant to the context "${context}".`;
            }
            
            console.log("Simulated AI content generated:", simulatedContent);
            return simulatedContent;
            // --- END SIMULATION ---
            
        } catch (error) {
            console.error("AI Content Generation Error:", error);
            // Hide loading state in UI (you'd need to implement this)
            // hideAILoadingState(context);
            
            // Provide user-friendly error messages
            let userMessage = `AI content generation failed: ${error.message}. Please try again.`;
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                userMessage = "AI request timed out. Please try again.";
            } else if (error.name === 'NetworkError' || error.name === 'TypeError') {
                 userMessage = "Network error. Please check your internet connection.";
            }
            alert(userMessage);
            
            // Re-throw the error so the calling function knows it failed
            throw error; 
        } finally {
            // Hide loading state in UI (you'd need to implement this)
            // hideAILoadingState(context);
        }
    };

    /**
     * Enhances content using an AI service.
     * This function simulates calling an AI API to improve existing text.
     * In a real implementation, you would call your backend service which interfaces with the AI model.
     * @param {string} existingContent - The existing content to enhance.
     * @param {string} enhancementType - Type of enhancement (e.g., 'grammar', 'clarity', 'tone').
     * @returns {Promise<string>} The enhanced content from the AI.
     */
    window.enhanceAIContent = async function(existingContent, enhancementType = 'clarity') {
        console.log("Enhancing AI content of type:", enhancementType, "for content:", existingContent.substring(0, 50) + '...');
        
        // Show loading state in UI (you'd need to implement this)
        // showAIEnhancementLoadingState(enhancementType);

        try {
            // --- SIMULATE AI ENHANCEMENT API CALL ---
            // In a real app, you would call your backend API endpoint
            // Example using fetch:
            /*
            const response = await fetch('/api/enhance-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include auth header if needed
                    // 'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ content: existingContent, type: enhancementType })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const enhancedContent = data.enhancedContent; // Assuming your backend returns { enhancedContent: "..." }
            console.log("AI content enhanced:", enhancedContent);
            return enhancedContent;
            */
            
            // --- FOR DEMONSTRATION ONLY ---
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simulate AI-enhanced content based on type
            let simulatedEnhancedContent = '';
            switch(enhancementType.toLowerCase()) {
                case 'grammar':
                    simulatedEnhancedContent = existingContent.replace(/\b(i|I)\b/g, 'I').replace(/Hello/g, 'Greetings');
                    break;
                case 'clarity':
                    simulatedEnhancedContent = existingContent.replace(/\b(this|This)\b/g, 'This particular').replace(/\b(is|are)\b/g, 'constitutes');
                    break;
                case 'tone':
                    simulatedEnhancedContent = existingContent.replace(/\b(good|great)\b/g, 'exceptional').replace(/\b(nice|fine)\b/g, 'superb');
                    break;
                default:
                    simulatedEnhancedContent = existingContent + `\n\n[Enhanced with AI (${enhancementType})]`;
            }
            
            console.log("Simulated AI content enhanced:", simulatedEnhancedContent);
            return simulatedEnhancedContent;
            // --- END SIMULATION ---
            
        } catch (error) {
            console.error("AI Content Enhancement Error:", error);
            // Hide loading state in UI (you'd need to implement this)
            // hideAIEnhancementLoadingState(enhancementType);
            
            // Provide user-friendly error messages
            let userMessage = `AI content enhancement failed: ${error.message}. Please try again.`;
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                userMessage = "AI enhancement request timed out. Please try again.";
            } else if (error.name === 'NetworkError' || error.name === 'TypeError') {
                 userMessage = "Network error. Please check your internet connection.";
            }
            alert(userMessage);
            
            // Re-throw the error so the calling function knows it failed
            throw error; 
        } finally {
            // Hide loading state in UI (you'd need to implement this)
            // hideAIEnhancementLoadingState(enhancementType);
        }
    };

    // --- FORM INTEGRATION LOGIC ---
    // These functions integrate AI assistance directly into your forms
    
    /**
     * Integrates AI assistance into a form field.
     * Adds a button next to the field to trigger AI generation.
     * @param {string} fieldId - The ID of the form field to assist.
     * @param {string} context - The context for AI generation (e.g., 'bio').
     * @param {string} prompt - The prompt to send to the AI.
     */
    window.integrateAIAssistant = function(fieldId, context, prompt) {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.warn(`Field with ID '${fieldId}' not found for AI integration.`);
            return;
        }
        
        // Create AI assistant button
        const aiButton = document.createElement('button');
        aiButton.type = 'button';
        aiButton.className = 'btn btn-outline btn-sm ai-assistant-btn';
        aiButton.id = `ai-assistant-btn-${fieldId}`;
        aiButton.innerHTML = '<i class="fas fa-robot"></i> AI Assist';
        aiButton.setAttribute('aria-label', `Get AI assistance for ${field.name || fieldId}`);
        aiButton.style.marginLeft = '0.5rem';
        
        // Add click listener to the AI button
        aiButton.addEventListener('click', async function() {
            console.log(`AI assistant button clicked for field: ${fieldId}`);
            
            // Disable button and show loading state
            this.disabled = true;
            const originalContent = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
            
            try {
                // Get current value of the field to use as a seed for AI
                const currentValue = field.value.trim();
                const aiPrompt = prompt || currentValue || `Generate content for ${context} based on the user's input.`;
                
                // Call the AI generation function
                const generatedContent = await window.generateAIContent(aiPrompt, context);
                
                // Update the field with the generated content
                field.value = generatedContent;
                
                // Show success message
                alert(`AI content generated for ${context}! Please review and edit as needed.`);
                
            } catch (error) {
                console.error("Error integrating AI assistant:", error);
                alert("Failed to generate AI content. Please try again.");
            } finally {
                // Re-enable button and restore original content
                this.disabled = false;
                this.innerHTML = originalContent || 'AI Assist';
            }
        });
        
        // Insert the AI button after the field
        field.parentNode.insertBefore(aiButton, field.nextSibling);
    };
    
    /**
     * Integrates AI enhancement into a form field.
     * Adds a button next to the field to trigger AI enhancement of existing content.
     * @param {string} fieldId - The ID of the form field to enhance.
     * @param {string} enhancementType - The type of enhancement (e.g., 'grammar', 'clarity').
     */
    window.integrateAIEnhancer = function(fieldId, enhancementType = 'clarity') {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.warn(`Field with ID '${fieldId}' not found for AI enhancement.`);
            return;
        }
        
        // Create AI enhancer button
        const aiEnhanceButton = document.createElement('button');
        aiEnhanceButton.type = 'button';
        aiEnhanceButton.className = 'btn btn-outline btn-sm ai-enhance-btn';
        aiEnhanceButton.id = `ai-enhance-btn-${fieldId}`;
        aiEnhanceButton.innerHTML = '<i class="fas fa-sparkles"></i> Enhance';
        aiEnhanceButton.setAttribute('aria-label', `Enhance ${field.name || fieldId} with AI`);
        aiEnhanceButton.style.marginLeft = '0.5rem';
        
        // Add click listener to the AI enhancer button
        aiEnhanceButton.addEventListener('click', async function() {
            console.log(`AI enhancer button clicked for field: ${fieldId}`);
            
            // Disable button and show loading state
            this.disabled = true;
            const originalContent = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enhancing...';
            
            try {
                // Get current value of the field
                const currentValue = field.value.trim();
                
                if (!currentValue) {
                    alert("Please enter some content to enhance.");
                    return;
                }
                
                // Call the AI enhancement function
                const enhancedContent = await window.enhanceAIContent(currentValue, enhancementType);
                
                // Update the field with the enhanced content
                field.value = enhancedContent;
                
                // Show success message
                alert(`Content enhanced with AI (${enhancementType})! Please review and edit as needed.`);
                
            } catch (error) {
                console.error("Error integrating AI enhancer:", error);
                alert("Failed to enhance content with AI. Please try again.");
            } finally {
                // Re-enable button and restore original content
                this.disabled = false;
                this.innerHTML = originalContent || 'Enhance';
            }
        });
        
        // Insert the AI enhancer button after the field
        field.parentNode.insertBefore(aiEnhanceButton, field.nextSibling);
    };

    // --- ATTACH AI ASSISTANCE TO FORMS ---
    // This part attaches AI assistance to specific forms on page load
    
    // Profile Bio Form (profile.html)
    const profileBioField = document.getElementById('profileBio');
    if (profileBioField) {
        console.log("Found profile bio field, attaching AI assistance");
        
        // Integrate AI assistant for profile bio
        window.integrateAIAssistant('profileBio', 'bio', 'Suggest a compelling bio for a freelance professional');
        
        // Integrate AI enhancer for profile bio
        window.integrateAIEnhancer('profileBio', 'clarity');
    } else {
        console.log("Profile bio field not found on this page");
    }
    
    // Resume/CV Form (profile.html or dedicated resume page)
    const resumeForm = document.getElementById('resumeForm'); // Make sure your form has this ID
    if (resumeForm) {
        console.log("Found resume form, attaching AI assistance");
        
        // Integrate AI assistant for resume summary
        window.integrateAIAssistant('resumeSummary', 'resume_summary', 'Generate a professional summary for a web developer with 5 years of experience');
        
        // Integrate AI enhancer for resume summary
        window.integrateAIEnhancer('resumeSummary', 'clarity');
    } else {
        console.log("Resume form not found on this page");
    }
    
    // Cover Letter Form (job application page)
    const coverLetterForm = document.getElementById('coverLetterForm'); // Make sure your form has this ID
    if (coverLetterForm) {
        console.log("Found cover letter form, attaching AI assistance");
        
        // Integrate AI assistant for cover letter
        window.integrateAIAssistant('coverLetterText', 'cover_letter', 'Generate a cover letter for a web developer position at a tech startup');
        
        // Integrate AI enhancer for cover letter
        window.integrateAIEnhancer('coverLetterText', 'clarity');
    } else {
        console.log("Cover letter form not found on this page");
    }
    
    // Hero Search Form (index.html)
    const heroSearchForm = document.getElementById('heroSearchForm');
    if (heroSearchForm) {
        console.log("Found hero search form, attaching AI assistance");
        
        // Integrate AI assistant for hero search input
        window.integrateAIAssistant('heroSearchInput', 'search_query', 'Suggest popular search queries for freelance services');
    } else {
        console.log("Hero search form not found on this page");
    }
    
    // Blog Post Form (admin dashboard or dedicated blog post page)
    const blogPostForm = document.getElementById('blogPostForm'); // Make sure your form has this ID
    if (blogPostForm) {
        console.log("Found blog post form, attaching AI assistance");
        
        // Integrate AI assistant for blog post title
        window.integrateAIAssistant('postTitle', 'blog_post_title', 'Suggest a compelling blog post title for a freelance career guide');
        
        // Integrate AI enhancer for blog post content
        window.integrateAIEnhancer('postContent', 'clarity');
    } else {
        console.log("Blog post form not found on this page");
    }
    
    // Gig Creation Form (create-gig.html)
    const gigCreationForm = document.getElementById('gigCreationForm'); // Make sure your form has this ID
    if (gigCreationForm) {
        console.log("Found gig creation form, attaching AI assistance");
        
        // Integrate AI assistant for gig title
        window.integrateAIAssistant('gigTitle', 'gig_title', 'Suggest a compelling gig title for a logo design service');
        
        // Integrate AI assistant for gig description
        window.integrateAIAssistant('gigDescription', 'gig_description', 'Generate a detailed gig description for a logo design service with features and benefits');
        
        // Integrate AI enhancer for gig description
        window.integrateAIEnhancer('gigDescription', 'clarity');
    } else {
        console.log("Gig creation form not found on this page");
    }
    
    // Job Post Form (create-job-post.html)
    const jobPostForm = document.getElementById('jobPostForm'); // Make sure your form has this ID
    if (jobPostForm) {
        console.log("Found job post form, attaching AI assistance");
        
        // Integrate AI assistant for job title
        window.integrateAIAssistant('jobTitle', 'job_title', 'Suggest a compelling job title for a web developer position');
        
        // Integrate AI assistant for job description
        window.integrateAIAssistant('jobDescription', 'job_description', 'Generate a detailed job description for a web developer role with responsibilities and requirements');
        
        // Integrate AI enhancer for job description
        window.integrateAIEnhancer('jobDescription', 'clarity');
    } else {
        console.log("Job post form not found on this page");
    }
    
    // --- END AI ASSISTANCE ATTACHMENT ---
});

// Utility function to hide AI-dependent UI elements
function hideAIUI() {
    const aiButtons = document.querySelectorAll('.ai-assistant-btn, .ai-enhance-btn');
    aiButtons.forEach(button => {
        button.style.display = 'none';
    });
    
    console.log("AI-dependent UI elements hidden due to Firebase initialization error");
}