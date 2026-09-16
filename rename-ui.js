const fs = require('fs');
const path = require('path');

const replacements = [
    // Subject -> Skill Tree
    { file: 'src/pages/subject/Subject.js', from: />Create New Subject</g, to: '>Create New Skill Tree<' },
    { file: 'src/pages/subject/Subject.js', from: />Add New Subject</g, to: '>Add New Skill Tree<' },
    { file: 'src/pages/subject/Subject.js', from: />Subject Name</g, to: '>Skill Tree Name<' },
    { file: 'src/pages/subject/Subject.js', from: />Update Subject</g, to: '>Update Skill Tree<' },
    { file: 'src/pages/subject/Subject.js', from: />Remove Subject \(/g, to: '>Remove Skill Tree (<' },
    { file: 'src/pages/subject/Subject.js', from: />Are you sure you want to delete this subject\?</g, to: '>Are you sure you want to delete this skill tree?<' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: />Subject\b/g, to: '>Skill Tree' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: /Select a Subject/g, to: 'Select a Skill Tree' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: /Units in {translateName\(selectedSubject\.subjectName\)}/g, to: 'Topics in {translateName(selectedSubject.subjectName)}' },
    { file: 'src/pages/studentDashboard/StudentDashboard.js', from: />Subject:</g, to: '>Skill Tree:<' },
    { file: 'src/pages/teacher/Teacher.js', from: /'Subject ⌄'/g, to: "'Skill Tree ⌄'" },
    { file: 'src/pages/teacher/Teacher.js', from: /'Select Subject'/g, to: "'Select Skill Tree'" },
    { file: 'src/components/Sidebar.js', from: />Subjects</g, to: '>Skill Trees<' },
    
    // Type -> Practice Style
    { file: 'src/pages/questionType/QuestionType.js', from: />Create New Question Type</g, to: '>Create New Practice Style<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Add New Type</g, to: '>Add New Practice Style<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Type Name</g, to: '>Practice Style Name<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Update Type</g, to: '>Update Practice Style<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Remove Type \(/g, to: '>Remove Practice Style (<' },
    { file: 'src/pages/questionType/QuestionType.js', from: />Are you sure you want to delete this type\?</g, to: '>Are you sure you want to delete this practice style?<' },
    { file: 'src/components/Sidebar.js', from: />Question Type</g, to: '>Practice Style<' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: /Select a worksheet format/g, to: 'Select a practice style' },
    
    // Unit -> Topic
    { file: 'src/pages/unit/Unit.js', from: />Create New Unit</g, to: '>Create New Topic<' },
    { file: 'src/pages/unit/Unit.js', from: />Add New Unit</g, to: '>Add New Topic<' },
    { file: 'src/pages/unit/Unit.js', from: />Unit Name</g, to: '>Topic Name<' },
    { file: 'src/pages/unit/Unit.js', from: />Select Subject</g, to: '>Select Skill Tree<' },
    { file: 'src/pages/unit/Unit.js', from: />Update Unit</g, to: '>Update Topic<' },
    { file: 'src/pages/unit/Unit.js', from: />Remove Unit \(/g, to: '>Remove Topic (<' },
    { file: 'src/pages/unit/Unit.js', from: />Are you sure you want to delete this unit\?</g, to: '>Are you sure you want to delete this topic?<' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: />Unit\b/g, to: '>Topic' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: /expand a Unit/g, to: 'expand a Topic' },
    { file: 'src/components/Sidebar.js', from: />Units</g, to: '>Topics<' },

    // Chapter -> Exercise Set
    { file: 'src/pages/chapter/Chapter.js', from: />Create New Chapter</g, to: '>Create New Exercise Set<' },
    { file: 'src/pages/chapter/Chapter.js', from: />Add New Chapter</g, to: '>Add New Exercise Set<' },
    { file: 'src/pages/chapter/Chapter.js', from: />Chapter Name</g, to: '>Exercise Set Name<' },
    { file: 'src/pages/chapter/Chapter.js', from: />Select Unit</g, to: '>Select Topic<' },
    { file: 'src/pages/chapter/Chapter.js', from: />Update Chapter</g, to: '>Update Exercise Set<' },
    { file: 'src/pages/chapter/Chapter.js', from: />Remove Chapter \(/g, to: '>Remove Exercise Set (<' },
    { file: 'src/pages/chapter/Chapter.js', from: />Are you sure you want to delete this chapter\?</g, to: '>Are you sure you want to delete this exercise set?<' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: />Chapter\b/g, to: '>Exercise Set' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: /choose a Chapter/g, to: 'choose an Exercise Set' },
    { file: 'src/pages/teacherDashboard/TeacherQuestionBank.js', from: /Chapters in {translateName\(selectedUnit\.unitName\)}/g, to: 'Exercise Sets in {translateName(selectedUnit.unitName)}' },
    { file: 'src/components/Sidebar.js', from: />Chapters</g, to: '>Exercise Sets<' },
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
