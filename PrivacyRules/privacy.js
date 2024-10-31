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

function showModule(moduleID) {
    const modules = document.querySelectorAll('.privacyModule, #main');
    modules.forEach(module => module.style.display = 'none');
    document.getElementById(moduleID).style.display = 'block';

    if (moduleID === 'differentialPrivacyModule') {
        getTrueCount().then(trueCount => {
            document.getElementById('trueResult').textContent = trueCount;
        });

        const graphConfig = {
            type: 'graph',
            title: 'Differential Privacy Graph',
            dimensions: {width: 800, height: 500},
            xAttributeName : 'Age',
            dataContext : 'sample_adult_with_pii'
        };

        codapInterface.sendRequest({
            action : 'create',
            resource : 'component',
            values : graphConfig
        }).then(response => {
            if (response.success) {
                console.log('Differential Privacy graph created successfully.');
            } else {
                console.error('Failed to create Differential Privacy graph.');
            }
        });

        highlightQueryData();
    }
}

function updateEpsilon(epsilonValue) {
    document.getElementById('epsilonValue').textContent = parseFloat(epsilonValue).toFixed(1);
}

function updateSensitivity(sensitivityValue) {
    document.getElementById('sensitivityValue').textContent = parseFloat(sensitivityValue).toFixed(1);
}

function applyDifferentialPrivacy() {
    const epsilon = parseFloat(document.getElementById('epsilonValue').textContent);
    const sensitivity = parseFloat(document.getElementById('sensitivityValue').textContent);

    getTrueCount().then(trueCount => {
        const noise = laplaceNoise(sensitivity, epsilon);
        const noisyCount = trueCount + noise;

        document.getElementById('noisyResult').textContent = noisyCount.toFixed(2);
        document.getElementById('difference').textContent = (noisyCount - trueCount).toFixed(2);
    });
}

function getTrueCount() {
    return codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[sample_adult_with_pii].collection[cases].caseFormulaSearch[Age >= 40]'
    }).then(response => {
        if (response.success) {
            return response.values.length;
        } else {
            console.error('Failed to retrieve true count.');
            return 0;
        }
    });
}

function laplaceNoise(sensitivity, epsilon) {
    const scale = sensitivity / epsilon;
    const u = Math.random() - 0.5;
    return 0.0 - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
} 


function highlightQueryData() {
    codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[sample_adult_with_pii].collection[cases].caseFormulaSearch[Age >= 40]'
    }).then(response => {
        if (response.success) {
            const caseIDs = response.values.map(item => item.id); 
            codapInterface.sendRequest({
                action: 'create',
                resource: 'dataContext[sample_adult_with_pii].selectionList',
                values: caseIDs 
            }).then(response => {
                if (response.success) {
                    console.log("Noisy data highlighted in CODAP.");
                } else {
                    console.error("Failed to highlight noisy data.");
                }
            });
        } else {
            console.error('Failed to retrieve cases for highlighting.');
        }
    });
}
