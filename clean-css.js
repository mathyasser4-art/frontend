const fs = require('fs');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace blocks of .nav-container, .nav-container img, .nav-right-side img, .nav-btn
    // Ensure we don't accidentally match .nav-btn-signup
    const regex = /\s*\.(?:nav-container(?: img)?|nav-right-side img|nav-btn)\s*\{[^}]*\}/g;
    
    const newContent = content.replace(regex, '');
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Cleaned ${filePath}`);
}

cleanFile('src/pages/question/Question.css');
cleanFile('src/pages/assignment/Assignment.css');
