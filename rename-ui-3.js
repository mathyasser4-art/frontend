const fs = require('fs');
const path = require('path');

const replacements = [
    // Unit -> Topic
    { file: 'src/pages/unit/Unit.js', from: />Create New Unit</g, to: '>Create New Topic<' },
    { file: 'src/pages/unit/Unit.js', from: />Add New Unit</g, to: '>Add New Topic<' },
    { file: 'src/pages/unit/Unit.js', from: />Unit Name</g, to: '>Topic Name<' },
    { file: 'src/pages/unit/Unit.js', from: />Select Subject</g, to: '>Select Skill Tree<' },
    { file: 'src/pages/unit/Unit.js', from: />Update Unit</g, to: '>Update Topic<' },
    { file: 'src/pages/unit/Unit.js', from: />Remove Unit \(/g, to: '>Remove Topic (<' },
    { file: 'src/pages/unit/Unit.js', from: />Are you sure you want to delete this unit\?</g, to: '>Are you sure you want to delete this topic?<' },

    // Class -> Exercise Set (these were called Chapter in UI but file is Class.js)
    { file: 'src/pages/class/Class.js', from: />Create New Chapter</g, to: '>Create New Exercise Set<' },
    { file: 'src/pages/class/Class.js', from: />Add New Chapter</g, to: '>Add New Exercise Set<' },
    { file: 'src/pages/class/Class.js', from: />Chapter Name</g, to: '>Exercise Set Name<' },
    { file: 'src/pages/class/Class.js', from: />Select Unit</g, to: '>Select Topic<' },
    { file: 'src/pages/class/Class.js', from: />Update Chapter</g, to: '>Update Exercise Set<' },
    { file: 'src/pages/class/Class.js', from: />Remove Chapter \(/g, to: '>Remove Exercise Set (<' },
    { file: 'src/pages/class/Class.js', from: />Are you sure you want to delete this chapter\?</g, to: '>Are you sure you want to delete this exercise set?<' },

    // QuestionType -> Practice Style
    { file: 'src/pages/questionType/QuestionType.js', from: />Create New Question Type</g, to: '>Create New Practice Style<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Add New Type</g, to: '>Add New Practice Style<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Type Name</g, to: '>Practice Style Name<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Update Type</g, to: '>Update Practice Style<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Remove Type \(/g, to: '>Remove Practice Style (<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Are you sure you want to delete this type\?</g, to: '>Are you sure you want to delete this practice style?<' },
];

let changedCount = 0;
let errors = 0;

for (const rule of replacements) {
    const fullPath = path.join(__dirname, rule.file);
    try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const beforeLen = content.length;
        content = content.replace(rule.from, rule.to);
        if (content.length !== beforeLen || content !== fs.readFileSync(fullPath, 'utf8')) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Updated ${rule.file}: matched ${rule.from}`);
            changedCount++;
        }
    } catch (e) {
        console.log(`Failed to process ${rule.file}: ${e.message}`);
        errors++;
    }
}

console.log(`Done! Made ${changedCount} replacements with ${errors} errors.`);
