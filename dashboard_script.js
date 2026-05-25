// document.getElementById('admissionForm').addEventListener('submit', async function(e) {
//     e.preventDefault();

//     const formData = {
//         height: document.getElementById('height').value,
//         weight: document.getElementById('weight').value,
//         age: document.getElementById('age').value,
//         skin_tone: document.getElementById('skinTone').value,
//         gender: document.getElementById('gender').value,
//         distinguishing_marks: document.getElementById('marks').value,
//         storage_unit: document.getElementById('storage').value
//     };

//     const successMsg = document.getElementById('successMessage');
//     const errorMsg = document.getElementById('errorMessage');

//     // Hide messages
//     successMsg.classList.remove('show');
//     errorMsg.classList.remove('show');

//     try {
//         const response = await fetch('http://localhost:5000/api/bodies/all');
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(formData)
//         });

//         const result = await response.json();

//         if (result.success) {
//             successMsg.textContent = '✅ ' + result.message;
//             successMsg.classList.add('show');
//             document.getElementById('admissionForm').reset();

//             // Clear message after 3 seconds
//             setTimeout(() => {
//                 successMsg.classList.remove('show');
//             }, 3000);
//         } else {
//             errorMsg.textContent = '❌ ' + result.message;
//             errorMsg.classList.add('show');
//         }
//     } catch (error) {
//         errorMsg.textContent = '❌ Error: ' + error.message;
//         errorMsg.classList.add('show');
//     }
// });








document.getElementById('admissionForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        caseNumber:         document.getElementById('caseNumber').value,
        deceasedName:       document.getElementById('deceasedName').value,
        admissionDate:      document.getElementById('admissionDate').value,
        admissionTime:      document.getElementById('admissionTime').value,
        height:             document.getElementById('height').value,
        weight:             document.getElementById('weight').value,
        age:                document.getElementById('age').value,
        skinTone:           document.getElementById('skinTone').value,
        gender:             document.getElementById('gender').value,
        causeOfDeath:       document.getElementById('causeOfDeath').value,
        storageUnit:        document.getElementById('storage').value,
        distinguishingMarks: document.getElementById('marks').value,
        additionalNotes:    document.getElementById('additionalNotes').value
    };

    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    successMsg.classList.remove('show');
    errorMsg.classList.remove('show');

    try {
        const response = await fetch('http://localhost:8080/morgue_db/routes/backend/save_admission.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        }); // ← closing bracket was missing here

        const result = await response.json();

        if (result.success) {
            successMsg.textContent = '✅ ' + result.message;
            successMsg.classList.add('show');
            document.getElementById('admissionForm').reset();

            setTimeout(() => {
                successMsg.classList.remove('show');
            }, 3000);
        } else {
            errorMsg.textContent = '❌ ' + result.message;
            errorMsg.classList.add('show');
        }
    } catch (error) {
        errorMsg.textContent = '❌ Error: ' + error.message;
        errorMsg.classList.add('show');
    }
});