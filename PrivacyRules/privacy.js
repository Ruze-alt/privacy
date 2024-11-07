// Function to start the CODAP connection
function startCodapConnection() {
    var config = {
        title: "Privacy Rules Plugin",
        version: "0.1",
        dimensions: {width: 750, height: 700}
    };

    codapInterface.init(config).then(() => {
        console.log('CODAP connection established.');
        loadCSVData();
    }).catch(msg => {
        console.error('CODAP connection error: ' + msg);
    });
}

// Function to load the CSV data from a URL
function loadCSVData() {
    const csvURL = 'https://raw.githubusercontent.com/Ruze-alt/privacy/refs/heads/main/sample_adult_with_pii.csv';

    codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContextFromURL',
        values: {
            URL: csvURL,
        }
    }).then(response => {
        if (response.success) {
            console.log('CSV data loaded successfully.');
        } else {
            console.error('Failed to load CSV data.');
        }
    }).catch(error => {
        console.error('Error loading CSV:', error);
    });
}

// Function to show a module
function showModule(moduleID) {
    const modules = document.querySelectorAll('.privacyModule, #main');
    modules.forEach(module => module.style.display = 'none');
    document.getElementById(moduleID).style.display = 'block';
}

// Update the displayed K value as the slider changes
function updateKValue(kValue) {
    document.getElementById('kValueDisplay').textContent = kValue;
}

// Apply K-Anonymity based on selected K value and display the result
function applyKAnonymity() {
    const k = parseInt(document.getElementById('kValueDisplay').textContent);

    getOriginalData().then(originalData => {
        document.getElementById('originalData').textContent = JSON.stringify(originalData);

        // Perform K-Anonymization
        const kAnonymizedData = kAnonymizeData(originalData, k);

        // Display K-Anonymized Data
        document.getElementById('kAnonymizedData').textContent = JSON.stringify(kAnonymizedData);
        displayKAnonymizedDistribution(kAnonymizedData);
    });
}

// Mock function to generalize data for K-Anonymity demonstration
function kAnonymizeData(data, k) {
    return data.map(record => {
        // Example generalization: grouping ages in ranges based on K value
        if (record.Age) {
            const age = record.Age;
            record.Age = `${Math.floor(age / (10 * k)) * (10 * k)}-${Math.floor(age / (10 * k)) * (10 * k) + (10 * k - 1)}`;
        }
        return record;
    });
}

// Display distribution of K-Anonymized data
function displayKAnonymizedDistribution(data) {
    const distribution = data.reduce((acc, item) => {
        const ageRange = item.Age;
        acc[ageRange] = (acc[ageRange] || 0) + 1;
        return acc;
    }, {});

    let distributionText = '';
    for (const [range, count] of Object.entries(distribution)) {
        distributionText += `${range}: ${count} records\n`;
    }

    document.getElementById('kAnonymizedDistribution').textContent = distributionText;
}