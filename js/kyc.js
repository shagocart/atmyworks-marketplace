document.addEventListener('DOMContentLoaded', function() {
    console.log("KYC JS loaded");

    // Check if firebaseApp is available (from firebase-config.js)
    if (typeof window.firebaseApp !== 'undefined') {
        window.auth = window.firebaseApp.auth;
        window.db = window.firebaseApp.db;
        window.storage = window.firebaseApp.storage;
        console.log("Firebase services available in kyc.js");
    } else {
        console.warn("Firebase not initialized in kyc.js. KYC features will not work.");
        return;
    }

    // --- ID Upload Handling ---
    const idUpload = document.getElementById('idUpload');
    const idUploadArea = document.getElementById('idUploadArea');
    const idPreview = document.getElementById('idPreview');

    if (idUploadArea) {
        idUploadArea.addEventListener('click', () => {
            if (idUpload) idUpload.click();
        });
    }

    if (idUpload) {
        idUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (idPreview) {
                        idPreview.src = event.target.result;
                        idPreview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- KYC Form Submission ---
    const kycForm = document.getElementById('kycForm');
    if (kycForm) {
        kycForm.addEventListener('submit', handleKycSubmission);
    }
});

async function handleKycSubmission(e) {
    e.preventDefault();

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please log in to submit KYC verification');
        return;
    }

    const formData = new FormData(e.target);
    const kycData = {
        fullName: formData.get('fullName'),
        dateOfBirth: formData.get('dateOfBirth'),
        idNumber: formData.get('idNumber'),
        emailAddress: formData.get('emailAddress'),
        phoneNumber: formData.get('phoneNumber'),
        idCountry: formData.get('idCountry'),
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    };

    const idUpload = document.getElementById('idUpload');
    if (idUpload.files.length > 0) {
        const file = idUpload.files[0];
        const storageRef = firebase.storage().ref();
        const idImageRef = storageRef.child(`kyc/${user.uid}/id-front.${file.name.split('.').pop()}`);

        try {
            const snapshot = await idImageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            kycData.idImageUrl = downloadURL;
            await saveKycData(user.uid, kycData);
        } catch (error) {
            console.error('Error uploading ID:', error);
            alert('Error uploading ID image. Please try again.');
        }
    } else {
        await saveKycData(user.uid, kycData);
    }
}

async function saveKycData(userId, kycData) {
    try {
        await firebase.firestore().collection('kyc_verifications').doc(userId).set(kycData);
        await firebase.firestore().collection('users').doc(userId).update({
            kycStatus: 'pending'
            // fullName is already in kycData, but you might want to update user profile too
            // fullName: kycData.fullName
        });
        alert('KYC verification submitted successfully! You will be notified once verified.');
        window.location.href = 'dashboard-jobseeker.html'; // Or appropriate dashboard
    } catch (error) {
        console.error('Error saving KYC data:', error);
        alert('Error submitting KYC verification. Please try again.');
    }
}