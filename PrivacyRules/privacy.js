function startCodapConnection() {
    var config = {
        title: "Privacy Rules Plugin",
        version: "0.1",
        dimensions: {width: 750, height: 700}
    };

    codapInterface.init(config).then(() => {
        console.log('CODAP connection established.');
        // loadCSVData();
    }).catch(msg => {
        console.error('CODAP connection error: ' + msg);
    });
}

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

function loadCSVDataIndata(datasetName) {
    const csvURL = `../data/${datasetName}`;

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

function showModule(moduleID) {
    const modules = document.querySelectorAll('.privacyModule, #main');
    modules.forEach(module => module.style.display = 'none');
    document.getElementById(moduleID).style.display = 'block';
}


