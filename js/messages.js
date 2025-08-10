// js/messages.js - Messaging related JavaScript for AtMyWorks

console.log("Messages module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Messages DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in messages.js");
    } else {
        console.warn("Firebase not initialized in messages.js. Messaging features will not work.");
        // Hide messaging UI or show an error
        hideMessagingUI();
        return;
    }

    // --- MESSAGING SYSTEM LOGIC ---
    window.MessagingSystem = {
        currentUser: null,
        currentConversationId: null,
        currentRecipientId: null,
        messagesListener: null,
        conversationsListener: null,

        /**
         * Initializes the messaging system.
         * Sets up auth state listener and loads initial conversations.
         */
        async init() {
            console.log("Initializing Messaging System...");
            
            // Listen for auth state changes
            window.auth.onAuthStateChanged(user => {
                if (user) {
                    this.currentUser = user;
                    console.log("User logged in for messaging:", user.uid, user.email);
                    this.loadConversations();
                } else {
                    this.currentUser = null;
                    console.log("User logged out from messaging system");
                    this.clearConversations();
                    this.clearChatWindow();
                    hideMessagingUI(); // Hide UI if user logs out
                }
            });
        },

        /**
         * Loads the list of conversations for the current user using real-time listener.
         */
        loadConversations() {
            if (!this.currentUser) {
                console.warn("No user logged in, cannot load conversations.");
                return;
            }

            const conversationsList = document.getElementById('conversationsList');
            if (!conversationsList) {
                console.warn("Conversations list element not found.");
                return;
            }

            // Show loading state
            conversationsList.innerHTML = '<li style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--gray-500);">Loading conversations...</li>';

            try {
                // Detach previous listener if exists
                if (this.conversationsListener) {
                    this.conversationsListener();
                    console.log("Detached previous conversations listener");
                }

                // Query Firestore for conversations involving the current user
                // Order by lastMessageAt timestamp (descending) to show newest first
                const query = window.db.collection('conversations')
                    .where('participants', 'array-contains', this.currentUser.uid)
                    .orderBy('lastMessageAt', 'desc');

                // Attach a real-time listener
                this.conversationsListener = query.onSnapshot(snapshot => {
                    console.log(`Received ${snapshot.docChanges().length} conversation changes`);
                    
                    if (snapshot.empty) {
                        conversationsList.innerHTML = '<li style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--gray-500);">No conversations yet.</li>';
                        return;
                    }

                    let conversationsHtml = '';
                    snapshot.forEach(doc => {
                        const conversationData = doc.data();
                        const conversationId = doc.id;
                        
                        // Determine the other participant's ID
                        const otherParticipantId = conversationData.participants.find(id => id !== this.currentUser.uid);
                        
                        // For simplicity, we'll use a placeholder name/avatar
                        // In a real app, you'd fetch the other user's data from Firestore
                        const otherParticipantName = otherParticipantId ? `User ${otherParticipantId.substring(0, 6)}` : 'Unknown User';
                        const otherParticipantAvatar = otherParticipantName.charAt(0).toUpperCase();
                        
                        // Format last message time
                        let lastMessageTime = 'Just now';
                        if (conversationData.lastMessageAt) {
                            const lastMsgDate = conversationData.lastMessageAt.toDate();
                            const now = new Date();
                            const diffMs = now - lastMsgDate;
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            
                            if (diffDays > 0) {
                                lastMessageTime = `${diffDays}d ago`;
                            } else if (diffHours > 0) {
                                lastMessageTime = `${diffHours}h ago`;
                            } else if (diffMinutes > 0) {
                                lastMessageTime = `${diffMinutes}m ago`;
                            } else {
                                lastMessageTime = 'Just now';
                            }
                        }
                        
                        // Get last message preview
                        const lastMessagePreview = conversationData.lastMessage?.substring(0, 50) || 'No messages yet';
                        
                        // Check for unread messages (simplified)
                        const isUnread = conversationData.unreadBy?.includes(otherParticipantId) || false;
                        const unreadBadge = isUnread ? `<span class="badge badge-primary" style="float: right;">1</span>` : '';

                        conversationsHtml += `
                            <li style="padding: 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; ${isUnread ? 'background-color: var(--primary-50);' : ''}" 
                                class="conversation-item" 
                                data-conversation-id="${conversationId}" 
                                data-recipient-id="${otherParticipantId}">
                                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                                    <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 1rem; box-shadow: var(--shadow-xs); flex-shrink: 0;">
                                        ${otherParticipantAvatar}
                                    </div>
                                    <div style="flex-grow: 1;">
                                        <div style="font-weight: var(--font-weight-semibold);">${otherParticipantName}</div>
                                        <div style="font-size: var(--font-size-sm); color: var(--gray-500);">${lastMessageTime}</div>
                                    </div>
                                    ${unreadBadge}
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: var(--font-size-sm); color: var(--gray-600);">${lastMessagePreview}</span>
                                </div>
                            </li>
                        `;
                    });

                    conversationsList.innerHTML = conversationsHtml;

                    // Attach click listeners to conversation items
                    this.attachConversationListeners();

                }, error => {
                    console.error("Error listening to conversations:", error);
                    conversationsList.innerHTML = `<li style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--danger-500);">Error loading conversations: ${error.message}</li>`;
                });

            } catch (error) {
                console.error("Error setting up conversations listener:", error);
                conversationsList.innerHTML = `<li style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--danger-500);">Error loading conversations: ${error.message}</li>`;
            }
        },

        /**
         * Attaches click listeners to conversation items.
         */
        attachConversationListeners() {
            const conversationItems = document.querySelectorAll('.conversation-item');
            conversationItems.forEach(item => {
                item.addEventListener('click', () => {
                    const conversationId = item.getAttribute('data-conversation-id');
                    const recipientId = item.getAttribute('data-recipient-id');
                    this.switchConversation(conversationId, recipientId);
                });
            });
        },

        /**
         * Switches to a different conversation.
         * @param {string} conversationId - The ID of the conversation to switch to.
         * @param {string} recipientId - The ID of the recipient in the conversation.
         */
        async switchConversation(conversationId, recipientId) {
            console.log("Switching to conversation:", conversationId, "with recipient:", recipientId);
            
            if (!conversationId || !recipientId) {
                console.warn("Invalid conversation or recipient ID for switch.");
                return;
            }

            // Update current conversation and recipient
            this.currentConversationId = conversationId;
            this.currentRecipientId = recipientId;

            // Highlight the selected conversation in the list
            const conversationItems = document.querySelectorAll('.conversation-item');
            conversationItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-conversation-id') === conversationId) {
                    item.classList.add('active');
                }
            });

            // Load messages for the selected conversation
            await this.loadMessages(conversationId);

            // Update chat header with recipient info
            const chatWithUserName = document.getElementById('chatWithUserName');
            if (chatWithUserName) {
                // In a real app, fetch recipient's name from Firestore
                const recipientName = recipientId ? `User ${recipientId.substring(0, 6)}` : 'Unknown User';
                chatWithUserName.textContent = recipientName;
            }

            // Show chat input area
            const chatInputArea = document.getElementById('chatInputArea');
            if (chatInputArea) {
                chatInputArea.style.display = 'block';
            }
        },

        /**
         * Loads messages for a specific conversation using real-time listener.
         * @param {string} conversationId - The ID of the conversation.
         */
        async loadMessages(conversationId) {
            if (!conversationId) {
                console.warn("No conversation ID provided for loading messages.");
                return;
            }

            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) {
                console.warn("Chat messages container not found.");
                return;
            }

            // Show loading state
            chatMessages.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 2rem;">Loading messages...</p>';

            try {
                // Detach previous listener if exists
                if (this.messagesListener) {
                    this.messagesListener();
                    console.log("Detached previous messages listener");
                }

                // Query Firestore for messages in the conversation, ordered by timestamp
                const query = window.db.collection('messages')
                    .where('conversationId', '==', conversationId)
                    .orderBy('timestamp', 'asc');

                // Attach a real-time listener
                this.messagesListener = query.onSnapshot(snapshot => {
                    console.log(`Received ${snapshot.docChanges().length} message changes for conversation ${conversationId}`);
                    
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const messageData = change.doc.data();
                            this.displayMessage(messageData);
                            
                            // Scroll to bottom of chat
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                        // You can handle 'modified' and 'removed' if needed for message edits/deletes
                    });

                    // If it's the initial load, scroll to bottom
                    if (snapshot.metadata.fromCache === false) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }

                }, error => {
                    console.error("Error listening to messages:", error);
                    chatMessages.innerHTML = `<p style="text-align: center; color: var(--danger-500); padding: 2rem;">Error loading messages: ${error.message}</p>`;
                });

            } catch (error) {
                console.error("Error loading messages:", error);
                chatMessages.innerHTML = `<p style="text-align: center; color: var(--danger-500); padding: 2rem;">Error loading messages: ${error.message}</p>`;
            }
        },

        /**
         * Displays a single message in the chat window.
         * @param {Object} messageData - The message data from Firestore.
         */
        displayMessage(messageData) {
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) return;

            const isCurrentUserSender = messageData.senderId === this.currentUser.uid;
            const senderName = isCurrentUserSender ? 'You' : (messageData.senderId ? `User ${messageData.senderId.substring(0, 6)}` : 'Unknown');
            const senderAvatar = senderName.charAt(0).toUpperCase();

            // Format message timestamp
            let formattedTime = 'Just now';
            if (messageData.timestamp) {
                const msgDate = messageData.timestamp.toDate();
                formattedTime = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            const messageHtml = `
                <div style="display: flex; ${isCurrentUserSender ? 'justify-content: flex-end;' : 'justify-content: flex-start;'} margin-bottom: 1.5rem;">
                    ${!isCurrentUserSender ? `
                        <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-100), var(--secondary-100)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary-800); margin-right: 1rem; box-shadow: var(--shadow-xs); flex-shrink: 0;">
                            ${senderAvatar}
                        </div>
                    ` : ''}
                    <div>
                        <div style="background: ${isCurrentUserSender ? 'var(--primary-500)' : 'white'}; color: ${isCurrentUserSender ? 'white' : 'var(--gray-800)'}; border-radius: 0.5rem; padding: 1rem; box-shadow: var(--shadow-sm); max-width: 80%;">
                            <p style="margin: 0;">${this.escapeHtml(messageData.text)}</p>
                            <div style="font-size: var(--font-size-xs); color: ${isCurrentUserSender ? 'rgba(255, 255, 255, 0.8)' : 'var(--gray-500)'}; text-align: ${isCurrentUserSender ? 'right' : 'left'}; margin-top: 0.5rem;">${formattedTime}</div>
                        </div>
                    </div>
                    ${isCurrentUserSender ? `
                        <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-600), var(--primary-800)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; margin-left: 1rem; box-shadow: var(--shadow-xs); flex-shrink: 0;">
                            ${senderAvatar}
                        </div>
                    ` : ''}
                </div>
            `;

            // Append the new message to the chat container
            chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        },

        /**
         * Sends a new message.
         */
        async sendMessage() {
            const messageInput = document.getElementById('chatMessageInput');
            const messageText = messageInput?.value?.trim();

            if (!messageText) {
                console.log("No message text to send.");
                return;
            }

            if (!this.currentUser || !this.currentConversationId || !this.currentRecipientId) {
                console.warn("Cannot send message: Missing user, conversation, or recipient.");
                alert("Unable to send message. Please select a conversation first.");
                return;
            }

            console.log("Sending message:", messageText);

            try {
                // Create message document
                const messageData = {
                    conversationId: this.currentConversationId,
                    senderId: this.currentUser.uid,
                    recipientId: this.currentRecipientId,
                    text: messageText,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'sent' // Could be 'delivered', 'read' later
                };

                // Add message to 'messages' collection
                const messageRef = await window.db.collection('messages').add(messageData);
                console.log("Message sent with ID:", messageRef.id);

                // Update conversation document with last message info
                await window.db.collection('conversations').doc(this.currentConversationId).update({
                    lastMessage: messageText,
                    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                    // Remove recipient from unreadBy array if they are there
                    unreadBy: firebase.firestore.FieldValue.arrayRemove(this.currentRecipientId)
                });

                // Clear input field
                if (messageInput) {
                    messageInput.value = '';
                }

            } catch (error) {
                console.error("Error sending message:", error);
                alert(`Failed to send message: ${error.message}`);
            }
        },

        /**
         * Clears the conversations list.
         */
        clearConversations() {
            const conversationsList = document.getElementById('conversationsList');
            if (conversationsList) {
                conversationsList.innerHTML = '<li style="padding: 1rem; border-bottom: 1px solid var(--border-color); text-align: center; color: var(--gray-500);">Please log in to see conversations.</li>';
            }
        },

        /**
         * Clears the chat window.
         */
        clearChatWindow() {
            const chatMessages = document.getElementById('chatMessages');
            const chatWithUserName = document.getElementById('chatWithUserName');
            const chatInputArea = document.getElementById('chatInputArea');
            
            if (chatMessages) {
                chatMessages.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 2rem;">Select a conversation to start chatting.</p>';
            }
            if (chatWithUserName) {
                chatWithUserName.textContent = 'Select a conversation';
            }
            if (chatInputArea) {
                chatInputArea.style.display = 'none';
            }
        },

        /**
         * Utility function to escape HTML to prevent XSS.
         * @param {string} str - The string to escape.
         * @returns {string} The escaped string.
         */
        escapeHtml(str) {
            if (typeof str !== 'string') return str;
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "<")
                .replace(/>/g, ">")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    };

    // Initialize the messaging system
    window.MessagingSystem.init();

    // --- ATTACH EVENT LISTENERS ---
    // Handle message input submission
    const chatMessageInput = document.getElementById('chatMessageInput');
    if (chatMessageInput) {
        // Handle Enter key for sending message (without Shift)
        chatMessageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (typeof window.MessagingSystem.sendMessage === 'function') {
                    window.MessagingSystem.sendMessage();
                } else {
                    console.warn("MessagingSystem.sendMessage function not found.");
                }
            }
        });

        // Handle Shift+Enter for new line
        chatMessageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '\n' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 1;
            }
        });
    }

    // Handle send message button click
    const sendMessageButton = document.querySelector('#chatInputArea button');
    if (sendMessageButton) {
        sendMessageButton.addEventListener('click', function() {
            if (typeof window.MessagingSystem.sendMessage === 'function') {
                window.MessagingSystem.sendMessage();
            } else {
                console.warn("MessagingSystem.sendMessage function not found.");
            }
        });
    }

    // --- UTILITY FUNCTIONS ---
    function hideMessagingUI() {
        const messagesMainContent = document.getElementById('messagesMainContent');
        if (messagesMainContent) {
            messagesMainContent.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: white; border-radius: 0.5rem; box-shadow: var(--shadow-md);">
                    <div style="font-size: 3rem; color: var(--gray-300); margin-bottom: 1rem;">
                        <i class="fas fa-comment-slash"></i>
                    </div>
                    <h2 style="margin-bottom: 1rem; color: var(--gray-700);">Messaging Unavailable</h2>
                    <p style="margin-bottom: 1.5rem; color: var(--gray-500);">Please log in to access your messages.</p>
                    <a href="/signup-employer.html" class="btn btn-primary">Log In / Sign Up</a>
                </div>
            `;
        }
    }

    console.log("Messages.js event listeners attached");
});