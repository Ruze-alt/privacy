function applyLDiversity() {
    const diversityLevel = document.getElementById('diversity-level').value;
    const attributeCount = document.getElementById('attribute-count').value;

    if (!diversityLevel || !attributeCount){
        alert(`Please enter both L-Diversity Level and Attribute Count.`);
        return;
    }

    alert(`Applying L-Diversity with Level: ${diversityLevel} and Attribute Count: ${attributeCount}`)
}