// Function to start the CODAP connection
function startCodapConnection() {
    var config = {
        title: "Privacy Rules Plugin",
        version: "0.1",
        dimensions: {width: 800, height: 800}
    };

    codapInterface.init(config).then(() => {
        console.log('CODAP connection established.');
        loadCSVDataInData('lite_adult_with_pii.csv');
    }).catch(msg => {
        console.error('CODAP connection error: ' + msg);
    });
}

// Function to load the CSV data from a URL
function loadCSVDataInData(datasetName) {
    const csvURL = `https://raw.githubusercontent.com/Ruze-alt/privacy/refs/heads/main/data/${datasetName}`;

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
        const attributeName = 'Marital Status';

        // Step 1: Get true count and display it
        getTrueCount().then(trueCount => {
            document.getElementById('originalResult').textContent = trueCount;
            document.getElementById('noisyResult').textContent = trueCount;
            document.getElementById('originalResult').style.color = "#00509e";
            document.getElementById('noisyResult').style.color = "#00509e";
        });

        // Step 2: Initialize Noise and NoisyAge attributes, then open numerical graph
        initializeNoisyNumerical().then(() => {
            return initializeNoisyAgeAttribute();
        }).then(() => {
            openGraph('Differential Privacy Graph - Numerical', 'Age', 'NoisyAge', 'lite_adult_with_pii'); // Open numerical graph after both attributes are initialized
        }).then(() => {
            // Step 3: Display original distribution and generate noisy categorical data
            displayOriginalDistribution(attributeName);
            return initializeNoisyCategorical(attributeName); 
        }).then(() => {
            // Step 4: Get sorted categories and open both original and noisy categorical graphs with consistent ordering
            getCategoricalFeatures(attributeName).then(caseFeatures => {
                const uniqueCategories = caseFeatures[1]; // Unique categories
                const sortedCategories = uniqueCategories.sort(); // Sort alphabetically or by frequency

                // Open both original and noisy categorical graphs with sorted categories
                openCategoricalGraph(attributeName, sortedCategories);
            });
        }).catch(error => {
            console.error('Error during initialization:', error);
        });
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

// Function to apply differential privacy and update only the Noise column
function generateNumericalNoise() {
    const epsilon = parseFloat(document.getElementById('epsilonValue').textContent);
    const sensitivity = parseFloat(document.getElementById('sensitivityValue').textContent);

    getTrueCount().then(trueCount => { // Get the true count
        const noisyCount = trueCount + laplaceNoise(sensitivity, epsilon); // Add noise to the true count
        document.getElementById('noisyResult').textContent = noisyCount.toFixed(2); // Display the noisy count
        document.getElementById('noisyResult').style.color = "red";
    });

    // Retrieve all cases and update only the Noise column
    getAllCases().then(cases => {
        const updatedCases = cases.map(item => {
            const noise = laplaceNoise(sensitivity, epsilon);
            return {
                id: item.case.id,
                values: { Noise: noise.toFixed(2) }
            };
        });
        
        // Update Noise values
        codapInterface.sendRequest({
            action: 'update',
            resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
            values: updatedCases
        }).then(response => {
            if (response.success) {
                console.log('Noise values updated successfully.');

                codapInterface.sendRequest({
                    action: 'notify',
                    resource: 'component[NumericalGraph]',  
                    values: {
                        request: 'autoScale'
                    }
                }).then(response => {
                    if (response.success) {
                        console.log('Graph autoscaled successfully.');
                    } else {
                        console.error('Failed to autoscale graph.');
                    }
                });
            } else {
                console.error('Failed to update Noise values.');
            }
        });
    });
}

// Function to get all cases 
function getAllCases() {
    return codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].allCases'
    }).then(response => {
        if (response.success) {
            const cases = response.values.cases;  // Access the 'cases' array inside 'values'
            //console.log(cases);
            return cases;  // Return the cases array
        } else {
            console.error('Failed to retrieve cases.');
            return [];  // Return an empty array in case of failure
        }
    });
}

// Function to initialize Noise column
function initializeNoisyNumerical() {
    return codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].attribute',
        values: {
            name: 'Noise',
            type: 'numeric',
            precision: 2,
            description: 'Noise Generated'
        }
    }).then(response => {
        if (response.success) {
            console.log('Noise attribute created successfully.');
            
            // Get all cases asynchronously and then update them
            return getAllCases().then(cases => {
                const updatedCases = cases.map(item => ({
                    id: item.case.id,
                    values: { Noise: 0 }
                }));

                // Update dataset with Noise values set to 0
                return codapInterface.sendRequest({
                    action: 'update',
                    resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
                    values: updatedCases
                }).then(response => {
                    if (response.success) {
                        console.log('All Noise values initialized to 0.');
                    } else {
                        console.error('Failed to initialize Noise values.');
                    }
                });
            })
        } else {
            console.error('Failed to create Noise attribute.');
        }
    });
}

// Function to initialize NoisyAge column (returns a Promise)
function initializeNoisyAgeAttribute() {
    return codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].attribute',
        values: {
            name: 'NoisyAge',
            type: 'numeric',
            precision: 2,
            formula: 'Age + Noise', // Formula that automatically updates NoisyAge
            description: 'Noisy Age'
        }
    }).then(response => {
        if (response.success) {
            console.log('Noisy Age attribute created successfully.');
        } else {
            console.error('Failed to create Noisy Age attribute.');
        }
    });
}

// Function to initialize the noisy version of a categorical attribute with original values
function initializeNoisyCategorical(attribute) {
    return codapInterface.sendRequest({
        action: 'create',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].attribute',
        values: {
            name: `Noisy ${attribute}`,
            type: 'categorical',
            description: `Noisy version of ${attribute}`
        }
    }).then(response => {
        if (response.success) {
            console.log(`Noisy ${attribute} attribute created successfully.`);

            // Step 2: Fill initial values of Noisy [attribute] with original values of the categorical attribute
            getAllCases().then(cases => {
                const updatedCases = cases.map(item => ({
                    id: item.case.id,
                    values: { [`Noisy ${attribute}`]: item.case.values[attribute] } // Set Noisy [attribute] to original value
                }));

                // Update dataset with initial noisy values (which are just copies of the original)
                return codapInterface.sendRequest({
                    action: 'update',
                    resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
                    values: updatedCases
                }).then(response => {
                    if (response.success) {
                        console.log(`Noisy ${attribute} initialized with original values.`);
                    } else {
                        console.error(`Failed to initialize Noisy ${attribute} with original values.`);
                    }
                });
            });
        } else {
            console.error(`Failed to create Noisy ${attribute} attribute.`);
        }
    });
}

// Function to apply differential privacy, update Noisy [attribute] using Exponential Mechanism, and update noisy column in the table
function generateCategoricalNoise(attribute, iterations = 1000) {
    getCategoricalFeatures(attribute).then(caseFeatures => {
        const allCases = caseFeatures[0]; // All cases for this attribute
        const uniqueCategories = caseFeatures[1]; // Unique categories

        // Calculate scores (frequencies) for each unique category
        const scores = uniqueCategories.map(category => score(allCases, category));

        // Initialize a map to store frequency of each category (for display)
        const categoryFrequency = {};
        uniqueCategories.forEach(category => categoryFrequency[category] = 0);

        // Apply Exponential Mechanism to generate noisy categories for each case
        getAllCases().then(cases => {
            const updatedCases = cases.map(item => {
                const noisyCategory = exponentialMechanism(uniqueCategories, scores);
                
                // Increment frequency count for display purposes
                if (noisyCategory !== "undefined") {
                    categoryFrequency[noisyCategory]++;
                }

                // Update each case with its corresponding noisy category
                return {
                    id: item.case.id,
                    values: { [`Noisy ${attribute}`]: noisyCategory }
                };
            });

            // Update dataset with noisy categories
            codapInterface.sendRequest({
                action: 'update',
                resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
                values: updatedCases
            }).then(response => {
                if (response.success) {
                    console.log(`Noisy ${attribute} data updated successfully.`);

                    // Update only the noisy column in the table with new percentages
                    for (const [category, count] of Object.entries(categoryFrequency)) {
                        const percentage = ((count / iterations) * 100).toFixed(1) + '%';
                        document.getElementById(`noisy-${category}`).textContent = percentage; // Update noisy column in table
                        document.getElementById(`noisy-${category}`).style.color = "red";
                    }
                } else {
                    console.error(`Failed to update Noisy ${attribute} data.`);
                }
            });
        });
    });
}

// Function to reset everything in the module
function resetModule(attribute) {
    // Step 1: Reset Noise column values back to 0 and NoisyCategorical back to original values
    getAllCases().then(cases => {
        getCategoricalFeatures(attribute).then(caseFeatures => {
            const allCases = caseFeatures[0]; // All cases for this attribute

            // Combine Noise = 0 and reset NoisyCategorical to original values
            const updatedCases = cases.map(item => ({
                id: item.case.id,
                values: { Noise: 0, // Reset Noise values
                        [`Noisy ${attribute}`]: item.case.values[attribute] } // Set Noisy [attribute] to original value
            }));

            // Update dataset with combined Noise and NoisyCategorical reset
            codapInterface.sendRequest({
                action: 'update',
                resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
                values: updatedCases
            }).then(response => {
                if (response.success) {
                    console.log('Noise and Noisy categorical values reset successfully.');

                    // Step 2: Reset colors in table (both original and noisy columns back to blue)
                    const uniqueCategories = caseFeatures[1]; 
                    uniqueCategories.forEach(category => {
                        document.getElementById(`noisy-${category}`).style.color = "#00509e"; 
                    });
                    
                    getTrueCount().then(trueCount => {
                        document.getElementById('noisyResult').textContent = trueCount;
                        document.getElementById('noisyResult').style.color = "#00509e";
                    });

                    codapInterface.sendRequest({
                        action: 'notify',
                        resource: 'component[NumericalGraph]',  
                        values: {
                            request: 'autoScale'
                        }
                    }).then(response => {
                        if (response.success) {
                            console.log('Graph autoscaled successfully.');
                        } else {
                            console.error('Failed to autoscale graph.');
                        }
                    });

                } else {
                    console.error('Failed to reset Noise and Noisy categorical values.');
                }
            });
        });
    }); 
}

// Function to reset everything in the module
function resetModule(attribute) {
    // Step 1: Reset Noise column values back to 0 and NoisyCategorical back to original values
    getAllCases().then(cases => {
        getCategoricalFeatures(attribute).then(caseFeatures => {
            const allCases = caseFeatures[0]; // All cases for this attribute
            const uniqueCategories = caseFeatures[1]; // Unique categories

            // Combine Noise = 0 and reset NoisyCategorical to original values
            const updatedCases = cases.map(item => ({
                id: item.case.id,
                values: { 
                    Noise: 0, // Reset Noise values
                    [`Noisy ${attribute}`]: item.case.values[attribute] // Set Noisy [attribute] back to original value
                }
            }));

            // Update dataset with combined Noise and NoisyCategorical reset
            codapInterface.sendRequest({
                action: 'update',
                resource: 'dataContext[lite_adult_with_pii].collection[cases].case',
                values: updatedCases
            }).then(response => {
                if (response.success) {
                    console.log('Noise and Noisy categorical values reset successfully.');

                    // Autosscale after resetting numerical graph
                    codapInterface.sendRequest({
                        action: 'notify',
                        resource: 'component[NumericalGraph]',  
                        values: {
                            request: 'autoScale'
                        }
                    }).then(response => {
                        if (response.success) {
                            console.log('Graph autoscaled successfully.');
                        } else {
                            console.error('Failed to autoscale graph.');
                        }
                    });
                } else {
                    console.error('Failed to reset Noise and Noisy categorical values.');
                }
            });

            // Step 2: Reset colors in table and numerical results(both original and noisy columns back to blue)
            const normalizedOriginalDistribution = {};
            const totalCases = allCases.length;

            // Calculate original distribution percentages again
            uniqueCategories.forEach(category => {
                const originalCount = score(allCases, category)*1000;
                normalizedOriginalDistribution[category] = ((originalCount / totalCases) * 100).toFixed(1) + '%';
            });

            // Update table with original percentages and reset colors
            uniqueCategories.forEach(category => {
                document.getElementById(`noisy-${category}`).textContent = normalizedOriginalDistribution[category]; 
                document.getElementById(`noisy-${category}`).style.color = "#00509e"; 
            });

            // Reset NoisyResult
            getTrueCount().then(trueCount => {
                document.getElementById('noisyResult').textContent = trueCount;
                document.getElementById('noisyResult').style.color = "#00509e";
            });

            // Step 3: Reset sliders (Epsilon and Sensitivity) back to initial values
            document.getElementById('epsilonSlider').value = 0.1; // Reset slider position for epsilon
            document.getElementById('epsilonValue').textContent = '0.1'; // Reset displayed value for epsilon
            document.getElementById('sensitivitySlider').value = 1.0; // Reset slider position for sensitivity
            document.getElementById('sensitivityValue').textContent = '1.0'; // Reset displayed value for sensitivity
        });
    }); 
}

// Function to open a graph in CODAP
function openGraph(title, xAttributeName, yAttributeName, dataContext) {
    const graphConfig = {
        type: 'graph',
        name: "NumericalGraph",
        title: title,
        dimensions: {width: 500, height: 400},
        xAttributeName : xAttributeName,
        yAttributeName :  yAttributeName,
        dataContext : dataContext
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

// Function to open a graph comparing Original and Noisy Category Distributions in CODAP with sorted categories
function openCategoricalGraph(attribute, sortedCategories) {
    // Create graph for original distribution
    const graphConfigOriginal = {
        type: 'graph',
        name: "OriginalDistributionGraph",
        title: `Original ${attribute} Distribution`,
        dimensions: { width: 500, height: 400 },
        xAttributeName: attribute,      // X-axis is Original Category (e.g., Marital Status)
        yAttributeName: 'percentage',   // Y-axis will show percentages
        dataContext: 'lite_adult_with_pii',
        xAxisCategories: sortedCategories // Ensure consistent category order
    };

    // Create graph for noisy distribution
    const graphConfigNoisy = {
        type: 'graph',  
        name: "NoisyDistributionGraph",
        title: `Noisy ${attribute} Distribution`,
        dimensions: { width: 500, height: 400 },
        xAttributeName: `Noisy ${attribute}`,      // X-axis is Noisy Category (e.g., Noisy Marital Status)
        yAttributeName: 'percentage',   // Y-axis will show percentages
        dataContext: 'lite_adult_with_pii',
        xAxisCategories: sortedCategories // Ensure consistent category order
    };

    // Create original distribution graph
    codapInterface.sendRequest({
        action: 'create',
        resource: 'component',
        values: graphConfigOriginal
    }).then(response => {
        if (response.success) {
            console.log(`${attribute} Original Distribution graph created successfully.`);
            
            // After creating original graph, create noisy distribution graph
            return codapInterface.sendRequest({
                action: 'create',
                resource: 'component',
                values: graphConfigNoisy
            });
            
        } else {
            console.error(`Failed to create ${attribute} Original Distribution graph.`);
        }
    }).then(response => {
        if (response.success) {
            console.log(`${attribute} Noisy Distribution graph created successfully.`);
        } else {
            console.error(`Failed to create ${attribute} Noisy Distribution graph.`);
        }
    });
}

// Function to retrieve the true count of cases
function getTrueCount() {
    return codapInterface.sendRequest({
        action: 'get',
        resource: 'dataContext[lite_adult_with_pii].collection[cases].caseFormulaSearch[Age >= 40]'
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

// Get Categorical Features (Unique Categories and All Cases)
function getCategoricalFeatures(attribute) {
    return codapInterface.sendRequest({
        action: 'get',
        resource: `dataContext[lite_adult_with_pii].collection[cases].caseFormulaSearch[\"${attribute}\"]`
    }).then(response => {
        if (response.success) {
            const allCases = response.values.map(item => item.values[attribute]); 
            const uniqueCategories = [...new Set(allCases)]; 
            return [allCases, uniqueCategories]; 
        } else {
            console.error(`Failed to retrieve ${attribute} data.`);
            return [[], []];
        }
    });
}

// Function to display the original distribution for a categorical attribute in a table with both original and noisy columns
function displayOriginalDistribution(attribute) {
    getCategoricalFeatures(attribute).then(caseFeatures => {
        const allCases = caseFeatures[0]; 
        const uniqueCategories = caseFeatures[1];

        // Calculate original distribution
        const originalDistribution = uniqueCategories.reduce((acc, category) => {
            acc[category] = score(allCases, category)*1000; // Get frequency of each category
            return acc;
        }, {});

        const totalCases = allCases.length;

        // Normalize frequencies to percentages for original distribution
        const normalizedOriginalDistribution = {};
        for (const [category, count] of Object.entries(originalDistribution)) {
            normalizedOriginalDistribution[category] = ((count / totalCases) * 100).toFixed(1) + '%'; // Convert to percentage
        }

        const sortedCategoriesAlphabetically = Object.keys(normalizedOriginalDistribution).sort();

        // Initially, set noisy distribution to be the same as original
        let tableHTML = "<table class='distribution-table'><tr><th>Category</th><th>Original %</th><th>Noisy %</th></tr>";
        sortedCategoriesAlphabetically.forEach(category => {
            const percentage = normalizedOriginalDistribution[category];
            tableHTML += `<tr><td>${category}</td><td style="color: #00509e;">${percentage}</td><td id="noisy-${category}" style="color: #00509e;">${percentage}</td></tr>`;
        });
        tableHTML += "</table>";

        // Display the table in the HTML
        document.getElementById('distributionTable').innerHTML = tableHTML;
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