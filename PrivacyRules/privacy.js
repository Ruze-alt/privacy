// Function to start the CODAP connection
function startCodapConnection() {
    var config = {
        title: "Privacy Rules Plugin",
        version: "0.1",
        dimensions: {width: 800, height: 800}
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
    const csvURL = 'https://raw.githubusercontent.com/Ruze-alt/privacy/refs/heads/main/data/sample_adult_with_pii.csv';

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
    const csvURL = `https://raw.githubusercontent.com/NianwenDan/codap-privacy/refs/heads/main/data/${datasetName}`;

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

    if (moduleID === 'differentialPrivacyIntro') {
        getTrueCount().then(trueCount => {
            document.getElementById('trueResult').textContent = trueCount;
        });
        //openGraph();
        //highlightQueryData();

        displayOriginalDistribution('Marital Status');
    }
}

// Function to update the epsilon value
function updateEpsilon(epsilonValue) {
    document.getElementById('epsilonValue').textContent = parseFloat(epsilonValue).toFixed(1);
}

// Function to update the sensitivity value
function updateSensitivity(sensitivityValue) {
    document.getElementById('sensitivityValue').textContent = parseFloat(sensitivityValue).toFixed(1);
}

// Function to apply differential privacy to numerical data and display the noisy result
function applyDifferentialPrivacy() {
    const epsilon = parseFloat(document.getElementById('epsilonValue').textContent);
    const sensitivity = parseFloat(document.getElementById('sensitivityValue').textContent);

    getTrueCount().then(trueCount => {
        const noise = laplaceNoise(sensitivity, epsilon);
        const noisyCount = trueCount + noise;

        document.getElementById('noisyResult').textContent = noisyCount.toFixed(2);
    });
}

// Function to open a graph in CODAP
function openGraph() {
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
}

// Function to retrieve the true count of cases
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

// Function to generate laplace noise for a given sensitivity and epsilon
function laplaceNoise(sensitivity, epsilon) {
    const scale = sensitivity / epsilon;
    const u = Math.random() - 0.5;
    return 0.0 - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
} 


// Function to highlight the query data in CODAP
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

// Get Categorical Features (Unique Categories and All Cases)
function getCategoricalFeatures(attribute) {
    return codapInterface.sendRequest({
        action: 'get',
        resource: `dataContext[sample_adult_with_pii].collection[cases].caseFormulaSearch[\"${attribute}\"]`
    }).then(response => {
        if (response.success) {
            const allCases = response.values.map(item => item.values[attribute]); 
            const uniqueCategories = [...new Set(allCases)]; 
            console.log("Categories:", uniqueCategories);
            return [allCases, uniqueCategories]; 
        } else {
            console.error(`Failed to retrieve ${attribute} data.`);
            return [[], []];
        }
    });
}

// Function to display the original distribution for a categorical attribute
function displayOriginalDistribution(attribute) {
    getCategoricalFeatures(attribute).then(caseFeatures => {
        const allCases = caseFeatures[0]; 
        const uniqueCategories = caseFeatures[1]; 

        const originalDistribution = uniqueCategories.reduce((acc, category) => {
            acc[category] = score(allCases, category)*1000;
            return acc;
        }, {});

        const totalCases = allCases.length;
        const normalizedDistribution = {};
        for (const [category, count] of Object.entries(originalDistribution)) {
            normalizedDistribution[category] = ((count / totalCases) * 100).toFixed(1) + '%'; // Convert to percentage
        }

        let originalText = "";
        for (const [category, percentage] of Object.entries(normalizedDistribution)) {
            originalText += `${category}: ${percentage}\n`;
        }
        
        console.log(originalText);
        document.getElementById('originalDistribution').textContent = originalText;
    });
}

// Function to generate a noisy distribution for a categorical attribute and display it
function generateNoisyCategoryDistribution(attribute, iterations = 1000) {
    getCategoricalFeatures(attribute).then(caseFeatures => {
        const allCases = caseFeatures[0]; // All cases for this attribute
        const uniqueCategories = caseFeatures[1]; // Unique categories
        const scores = uniqueCategories.map(category => score(allCases, category));

        const categoryFrequency = {};
        uniqueCategories.forEach(category => categoryFrequency[category] = 0);

        for (let i = 0; i < iterations; i++) {
            const noisyCategory = exponentialMechanism(uniqueCategories, scores);
            if (noisyCategory !== "undefined") {
                categoryFrequency[noisyCategory]++;
            }
        }

        let noisyText = "";
        let totalCount = "";
        for (const [category, count] of Object.entries(categoryFrequency)) {
            noisyText += `${category}: ${(count / iterations * 100).toFixed(1)}%\n`; 
        }
        
        for (const [category, count] of Object.entries(categoryFrequency)) {
            totalCount += `${category}: ${count}\n`;
        }

        console.log(noisyText);
        //console.log(totalCount);
        document.getElementById('noisyCategoryDistribution').textContent = noisyText;
    });
}

// Scoring Function for Categories (Frequency)
function score(data, option) {
    const counts = data.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    return counts[option]/1000 || 0; 
}

// Exponential Mechanism Implementation
function exponentialMechanism(categories, scores) {
    const epsilon = parseFloat(document.getElementById('epsilonValue').textContent);
    const sensitivity = parseFloat(document.getElementById('sensitivityValue').textContent);

    const probabilities = scores.map(score => Math.exp(epsilon * score / (2 * sensitivity)));

    const sumProbabilities = probabilities.reduce((a, b) => a + b, 0);
    const normalizedProbabilities = probabilities.map(p => p / sumProbabilities);

    let cumulativeProbability = 0;
    const randomValue = Math.random();

    for (let i = 0; i < categories.length; i++) {
        cumulativeProbability += normalizedProbabilities[i];
        if (randomValue <= cumulativeProbability) {
            return categories[i];
        }
    }
    return "undefined"; 
}

// L-Diversity Function
function applyLDiversity() {
    const diversityLevel = document.getElementById('diversity-level').value;
    const attributeCount = document.getElementById('attribute-count').value;

    if (!diversityLevel || !attributeCount){
        alert(`Please enter both L-Diversity Level and Attribute Count.`);
        return;
    }

    alert(`Applying L-Diversity with Level: ${diversityLevel} and Attribute Count: ${attributeCount}`)
}