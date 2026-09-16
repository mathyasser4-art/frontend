const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'src/components/navbar/CreateHomeworkModal.js',
    'src/pages/dashboardSchool/LevelVisibilityManager.js',
    'src/pages/games/CaveRunner.js',
    'src/pages/games/MathRacer.js',
    'src/pages/games/MazeGame.js',
    'src/pages/games/MinigolfGame.js',
    'src/pages/games/SuperMarioGame.js',
    'src/pages/games/TanksGame.js',
    'src/pages/system/System.js',
    'src/pages/teacherDashboard/TeacherQuestionBank.js',
    'src/pages/unit/Unit.js'
];

let successCount = 0;

filesToUpdate.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        
        // 1. Update useTranslation destructuring if needed
        if (content.includes('const { t } = useTranslation();')) {
            content = content.replace('const { t } = useTranslation();', 'const { t, i18n } = useTranslation();');
        } else if (content.includes('const {t} = useTranslation();')) {
            content = content.replace('const {t} = useTranslation();', 'const { t, i18n } = useTranslation();');
        }

        // 2. Add import for translateCurriculumItem if not present
        if (!content.includes('translateCurriculumItem')) {
            // Find the last import
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex);
                
                // Need to compute relative path to src/utils/itemTranslator
                const fileDir = path.dirname(file);
                const utilsDir = 'src/utils';
                let relativePath = path.relative(fileDir, utilsDir).replace(/\\/g, '/');
                if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
                
                const importString = `\nimport { translateCurriculumItem } from '${relativePath}/itemTranslator';`;
                content = content.slice(0, endOfLastImport) + importString + content.slice(endOfLastImport);
            }
        }

        // 3. Replace the translateName block
        const oldBlockRegex = /const translateName = \(name\) => {[\s\S]*?return translated !== key \? translated : name;\s*};/;
        if (oldBlockRegex.test(content)) {
            const newBlock = `const translateName = (name) => {
        if (!name) return '';
        const isArabic = (typeof i18n !== 'undefined' && i18n.language === 'ar') || document.documentElement.dir === 'rtl';
        return translateCurriculumItem(name, isArabic);
    };`;
            content = content.replace(oldBlockRegex, newBlock);
            fs.writeFileSync(file, content);
            console.log(`Updated ${file}`);
            successCount++;
        } else {
            console.log(`Could not find old translateName block in ${file}`);
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
});

console.log(`Successfully updated ${successCount} files.`);
