// js/storage.js - Firebase Storage related JavaScript for AtMyWorks

console.log("Storage module loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("Storage DOM loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined' && window.firebaseApp.storage) {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase Storage services available in storage.js");
    } else {
        console.warn("Firebase Storage not initialized in storage.js. Storage features will not work.");
        // Hide storage-dependent UI elements or show an error
        // updateStorageUI(null);
        return;
    }

    // --- STORAGE HELPER FUNCTIONS ---
    // These functions assume `auth`, `db`, and `storage` are globally available from your Firebase initialization

    /**
     * Uploads a file to Firebase Storage.
     * @param {File} file - The file object to upload.
     * @param {string} path - The path in Firebase Storage where the file should be uploaded.
     * @param {Function} [onProgress] - Optional callback function to track upload progress.
     * @returns {Promise<string>} The download URL of the uploaded file.
     */
    window.uploadFileToStorage = async function(file, path, onProgress = null) {
        console.log("Uploading file to Firebase Storage...");
        console.log("File:", file.name, file.size, file.type);
        console.log("Path:", path);

        // Validate inputs
        if (!file || !path) {
            throw new Error("File and path are required for upload.");
        }

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Invalid file type. Please upload a file of type: ${allowedTypes.join(', ')}.`);
        }

        if (file.size > maxSize) {
            throw new Error(`File size exceeds 5MB limit. Please select a smaller file.`);
        }

        const user = window.auth.currentUser;
        if (!user) {
            throw new Error("User must be logged in to upload files.");
        }

        try {
            // Create a reference to the file in Firebase Storage
            const storageRef = window.storage.ref();
            const fileRef = storageRef.child(path);

            // Upload the file and track progress
            const uploadTask = fileRef.put(file);

            // Listen for state changes, errors, and completion
            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Handle progress updates
                    if (onProgress) {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        onProgress(progress);
                    }
                }, 
                (error) => {
                    // Handle unsuccessful uploads
                    console.error("Storage upload error:", error);
                    throw error;
                }, 
                () => {
                    // Handle successful uploads on complete
                    console.log("Storage upload completed successfully");
                }
            );

            // Wait for the upload to complete
            await uploadTask;

            // Get the download URL
            const downloadURL = await fileRef.getDownloadURL();
            console.log("File uploaded successfully. Download URL:", downloadURL);
            return downloadURL;

        } catch (error) {
            console.error("Error uploading file to Firebase Storage:", error);
            throw error;
        }
    }

    /**
     * Downloads a file from Firebase Storage.
     * @param {string} path - The path in Firebase Storage where the file is located.
     * @param {string} filename - The filename to save the downloaded file as.
     */
    window.downloadFileFromStorage = async function(path, filename) {
        console.log("Downloading file from Firebase Storage...");
        console.log("Path:", path);
        console.log("Filename:", filename);

        // Validate inputs
        if (!path || !filename) {
            throw new Error("Path and filename are required for download.");
        }

        const user = window.auth.currentUser;
        if (!user) {
            throw new Error("User must be logged in to download files.");
        }

        try {
            // Create a reference to the file in Firebase Storage
            const storageRef = window.storage.ref();
            const fileRef = storageRef.child(path);

            // Get the download URL
            const url = await fileRef.getDownloadURL();
            console.log("Download URL retrieved:", url);

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log("File download initiated for:", filename);
            alert(`File download initiated for ${filename}.`);

        } catch (error) {
            console.error("Error downloading file from Firebase Storage:", error);
            if (error.code === 'storage/object-not-found') {
                alert("File not found in storage.");
            } else if (error.code === 'storage/unauthorized') {
                alert("You don't have permission to download this file.");
            } else {
                alert(`Failed to download file: ${error.message}. Please try again.`);
            }
            throw error;
        }
    }

    /**
     * Deletes a file from Firebase Storage.
     * @param {string} path - The path in Firebase Storage where the file is located.
     */
    window.deleteFileFromStorage = async function(path) {
        console.log("Deleting file from Firebase Storage...");
        console.log("Path:", path);

        // Validate inputs
        if (!path) {
            throw new Error("Path is required for deletion.");
        }

        const user = window.auth.currentUser;
        if (!user) {
            throw new Error("User must be logged in to delete files.");
        }

        try {
            // Create a reference to the file in Firebase Storage
            const storageRef = window.storage.ref();
            const fileRef = storageRef.child(path);

            // Delete the file
            await fileRef.delete();
            console.log("File deleted successfully from storage:", path);
            alert("File deleted successfully.");

        } catch (error) {
            console.error("Error deleting file from Firebase Storage:", error);
            if (error.code === 'storage/object-not-found') {
                alert("File not found in storage.");
            } else if (error.code === 'storage/unauthorized') {
                alert("You don't have permission to delete this file.");
            } else {
                alert(`Failed to delete file: ${error.message}. Please try again.`);
            }
            throw error;
        }
    }

    /**
     * Lists files in a Firebase Storage directory.
     * @param {string} path - The path in Firebase Storage to list files from.
     * @returns {Promise<Array>} An array of file metadata objects.
     */
    window.listFilesInStorage = async function(path) {
        console.log("Listing files in Firebase Storage directory...");
        console.log("Path:", path);

        // Validate inputs
        if (!path) {
            throw new Error("Path is required for listing files.");
        }

        const user = window.auth.currentUser;
        if (!user) {
            throw new Error("User must be logged in to list files.");
        }

        try {
            // Create a reference to the directory in Firebase Storage
            const storageRef = window.storage.ref();
            const dirRef = storageRef.child(path);

            // List all files in the directory
            const listResult = await dirRef.listAll();
            console.log("Files listed in directory:", listResult.items.length);

            // Get metadata for each file
            const fileList = [];
            for (const item of listResult.items) {
                const metadata = await item.getMetadata();
                fileList.push(metadata);
            }

            console.log("File metadata retrieved:", fileList);
            return fileList;

        } catch (error) {
            console.error("Error listing files in Firebase Storage:", error);
            if (error.code === 'storage/object-not-found') {
                alert("Directory not found in storage.");
            } else if (error.code === 'storage/unauthorized') {
                alert("You don't have permission to list files in this directory.");
            } else {
                alert(`Failed to list files: ${error.message}. Please try again.`);
            }
            throw error;
        }
    }

    // --- FORM SUBMISSION HANDLERS ---
    // These are more robust ways to handle forms, called by page-specific scripts

    /**
     * Generic handler for file upload forms.
     * Expects form to have a file input and a path input.
     */
    window.handleFileUploadFormSubmit = async function(event) {
         event.preventDefault();
        console.log("File upload form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const fileInput = form.querySelector('input[type="file"]');
        const pathInput = form.querySelector('input[name="path"]');
        const fileNameInput = form.querySelector('input[name="filename"]');

        const file = fileInput?.files[0];
        const path = pathInput?.value?.trim();
        const filename = fileNameInput?.value?.trim() || file?.name;

        // --- BASIC VALIDATION ---
        if (!file || !path) {
            alert("File and path are required.");
            return;
        }

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading File...';
        }

        try {
            await window.uploadFileToStorage(file, path);
            // If successful, uploadFileToStorage will return the download URL
            // You would then typically save this URL to Firestore
            // For now, we'll just show a success message
            alert(`File uploaded successfully to ${path}!`);
            form.reset();
        } catch (error) {
             // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Upload File';
            }
            // Error message already shown in uploadFileToStorage
            console.error("File upload failed in global handler:", error);
        }
    };

    /**
     * Generic handler for file download forms.
     * Expects form to have a path input and a filename input.
     */
    window.handleFileDownloadFormSubmit = async function(event) {
        event.preventDefault();
        console.log("File download form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const pathInput = form.querySelector('input[name="path"]');
        const fileNameInput = form.querySelector('input[name="filename"]');

        const path = pathInput?.value?.trim();
        const filename = fileNameInput?.value?.trim();

        // --- BASIC VALIDATION ---
        if (!path || !filename) {
            alert("Path and filename are required.");
            return;
        }

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Downloading File...';
        }

        try {
            await window.downloadFileFromStorage(path, filename);
            // If successful, downloadFileFromStorage will initiate the download
            // No further action needed here
            alert(`File download initiated for ${filename}!`);
        } catch (error) {
            // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Download File';
            }
            // Error message already shown in downloadFileFromStorage
            console.error("File download failed in global handler:", error);
        }
    };

    /**
     * Generic handler for file deletion forms.
     * Expects form to have a path input.
     */
    window.handleFileDeletionFormSubmit = async function(event) {
        event.preventDefault();
        console.log("File deletion form submission triggered via global handler");

        const form = event.target;
        const formData = new FormData(form);

        // --- CRITICAL: ADAPT FIELD NAMES TO YOUR ACTUAL FORM INPUT NAMES ---
        const pathInput = form.querySelector('input[name="path"]');

        const path = pathInput?.value?.trim();

        // --- BASIC VALIDATION ---
        if (!path) {
            alert("Path is required.");
            return;
        }

        if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
            return;
        }

        // --- HANDLE SUBMISSION UI ---
        const submitButton = form.querySelector('button[type="submit"]');
        const originalContent = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting File...';
        }

        try {
            await window.deleteFileFromStorage(path);
            // If successful, deleteFileFromStorage will show a success message
            // No further action needed here
            alert(`File deleted successfully from ${path}!`);
            form.reset();
        } catch (error) {
            // Re-enable button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalContent || 'Delete File';
            }
            // Error message already shown in deleteFileFromStorage
            console.error("File deletion failed in global handler:", error);
        }
    };
    // --- End Form Submission Handlers ---

    // --- ATTACH LISTENERS TO EXISTING FORMS ON PAGE LOAD ---
    // This part might be redundant now as we are attaching listeners directly in the HTML pages
    // but it's kept for completeness or if you have forms dynamically added
    const fileUploadForm = document.getElementById('fileUploadForm'); // Make sure your file upload form has this ID
    if (fileUploadForm) {
        console.log("Found file upload form, attaching submit listener");
        fileUploadForm.addEventListener('submit', window.handleFileUploadFormSubmit);
    } else {
        console.log("File upload form not found on this page");
    }

    const fileDownloadForm = document.getElementById('fileDownloadForm');
    if (fileDownloadForm) {
        console.log("Found file download form, attaching submit listener");
        fileDownloadForm.addEventListener('submit', window.handleFileDownloadFormSubmit);
    } else {
        console.log("File download form not found on this page");
    }

    const fileDeletionForm = document.getElementById('fileDeletionForm');
    if (fileDeletionForm) {
        console.log("Found file deletion form, attaching submit listener");
        fileDeletionForm.addEventListener('submit', window.handleFileDeletionFormSubmit);
    } else {
        console.log("File deletion form not found on this page");
    }
    // --- End DOMContentLoaded Event Listener ---
});