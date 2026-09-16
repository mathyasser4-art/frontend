const fs = require('fs');

let file = 'src/components/navbar/CreateCompetitionModal.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
content = content.replace(
    "import { safeLocalStorage } from '../../utils/safeStorage';",
    "import { safeLocalStorage } from '../../utils/safeStorage';\nimport { translateCurriculumItem } from '../../utils/itemTranslator';"
);

// 2. Add i18n to useTranslation
content = content.replace(
    "const { t } = useTranslation();",
    "const { t, i18n } = useTranslation();"
);

// 3. Replace translateName
content = content.replace(
    /const translateName = \(name\) => {[\s\S]*?return translated !== key \? translated : name;\n    };/,
    `const translateName = (name) => {
        if (!name) return '';
        const isArabic = i18n.language === 'ar' || document.documentElement.dir === 'rtl';
        return translateCurriculumItem(name, isArabic);
    };`
);

fs.writeFileSync(file, content);
console.log("Replacement successful.");
