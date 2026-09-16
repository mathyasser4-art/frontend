/**
 * Comprehensive Item & Curriculum Name Translator
 * Translates systems, levels, subjects, units, chapters, and table labels
 * between Arabic and English without leaking English into Arabic lists.
 */

export const translateCurriculumItem = (name, isArabic = true) => {
    if (!name) return '';
    const raw = String(name).trim();
    const lower = raw.toLowerCase();

    // 1. Direct Dictionary Mapping
    const dictionary = {
        // Systems & Levels
        'basic level': isArabic ? 'المستوى الأساسي' : 'Basic Level',
        'level 0': isArabic ? 'المستوى 0' : 'Level 0',
        'level 1': isArabic ? 'المستوى 1' : 'Level 1',
        'level 2': isArabic ? 'المستوى 2' : 'Level 2',
        'level 3': isArabic ? 'المستوى 3' : 'Level 3',
        'level 4': isArabic ? 'المستوى 4' : 'Level 4',
        'level 5': isArabic ? 'المستوى 5' : 'Level 5',
        'level 6': isArabic ? 'المستوى 6' : 'Level 6',
        'level 3 (friends of 10)': isArabic ? 'المستوى 3 (أصدقاء 10)' : 'Level 3 (Friends of 10)',
        'level 4 (friends of 10)': isArabic ? 'المستوى 4 (أصدقاء 10)' : 'Level 4 (Friends of 10)',
        'level 3 (friends of 10) +9 +8 .. +1': isArabic ? 'المستوى 3 (أصدقاء 10) +9 +8 .. +1' : 'Level 3 (Friends of 10) +9 +8 .. +1',
        'level 4 (friends of 10) -9 -8 .. -1': isArabic ? 'المستوى 4 (أصدقاء 10) -9 -8 .. -1' : 'Level 4 (Friends of 10) -9 -8 .. -1',

        // Rows (Units)
        '2 rows': isArabic ? 'صفان (2 صفوف)' : '2 Rows',
        '3 rows': isArabic ? '٣ صفوف (3 صفوف)' : '3 Rows',
        '4 rows': isArabic ? '٤ صفوف (4 صفوف)' : '4 Rows',
        '5 rows': isArabic ? '٥ صفوف (5 صفوف)' : '5 Rows',
        '6 rows': isArabic ? '٦ صفوف (6 صفوف)' : '6 Rows',
        '7 rows': isArabic ? '٧ صفوف (7 صفوف)' : '7 Rows',
        '8 rows': isArabic ? '٨ صفوف (8 صفوف)' : '8 Rows',
        '9 rows': isArabic ? '٩ صفوف (9 صفوف)' : '9 Rows',
        '10 rows': isArabic ? '١٠ صفوف (10 صفوف)' : '10 Rows',

        // Questions Count
        '10 questions': isArabic ? '١٠ أسئلة (10 أسئلة)' : '10 Questions',
        '15 questions': isArabic ? '١٥ سؤالاً (15 سؤال)' : '15 Questions',
        '20 questions': isArabic ? '٢٠ سؤالاً (20 سؤال)' : '20 Questions',
        '25 questions': isArabic ? '٢٥ سؤالاً (25 سؤال)' : '25 Questions',
        '30 questions': isArabic ? '٣٠ سؤالاً (30 سؤال)' : '30 Questions',
        '50 questions': isArabic ? '٥٠ سؤالاً (50 سؤال)' : '50 Questions',

        // Subjects & Formulas
        '+- from 1 to 4': isArabic ? 'جمع وطرح من 1 إلى 4' : '+- from 1 to 4',
        '+- from 1 to 9': isArabic ? 'جمع وطرح من 1 إلى 9' : '+- from 1 to 9',
        '+- from 1 to 9 (ones)': isArabic ? 'جمع وطرح من 1 إلى 9 (آحاد)' : '+- from 1 to 9 (Ones)',
        'friends of 5 (ones)': isArabic ? 'أصدقاء العدد 5 (الآحاد)' : 'Friends of 5 (Ones)',
        'friends of 5 (ones and tens)': isArabic ? 'أصدقاء العدد 5 (الآحاد والعشرات)' : 'Friends of 5 (Ones and Tens)',
        'exercises on (ones , tens)': isArabic ? 'تمارين على (الآحاد والعشرات)' : 'Exercises on (Ones, Tens)',
        'exercises on (ones, tens)': isArabic ? 'تمارين على (الآحاد والعشرات)' : 'Exercises on (Ones, Tens)',
        'exercises on (ones , tens , hundreds)': isArabic ? 'تمارين على (الآحاد والعشرات والمئات)' : 'Exercises on (Ones, Tens, Hundreds)',
        'exercises on (ones, tens, hundreds)': isArabic ? 'تمارين على (الآحاد والعشرات والمئات)' : 'Exercises on (Ones, Tens, Hundreds)',
        'ones': isArabic ? 'الآحاد' : 'Ones',
        'ones and tens': isArabic ? 'الآحاد والعشرات' : 'Ones and Tens',
        'ones, tens and hundreds': isArabic ? 'الآحاد والعشرات والمئات' : 'Ones, Tens and Hundreds',
        'easy': isArabic ? 'تدريبات سهلة' : 'Easy Practice',
        'mixed questions': isArabic ? 'أسئلة مختلطة' : 'Mixed Questions',
        'mixed questions from +9 ... +1': isArabic ? 'أسئلة مختلطة من +9 إلى +1' : 'Mixed Questions from +9 ... +1',
        'operations on decimals': isArabic ? 'العمليات على الكسور العشرية' : 'Operations on Decimals',
        'questions will be uploaded soon ....': isArabic ? 'سيتم إضافة الأسئلة قريباً...' : 'Questions will be uploaded soon...',
        'questions will be uploaded soon': isArabic ? 'سيتم إضافة الأسئلة قريباً...' : 'Questions will be uploaded soon...',
        'math': isArabic ? 'الرياضيات' : 'Math',
        'abacus': isArabic ? 'الأباكوس' : 'Abacus',
        'soroban': isArabic ? 'السوروبان' : 'Soroban',
        'general': isArabic ? 'عام' : 'General'
    };

    if (dictionary[lower]) {
        return dictionary[lower];
    }

    // 2. Pattern Matching Rules
    if (isArabic) {
        // Match: X rows
        const rowMatch = lower.match(/^(\d+)\s*rows?$/i);
        if (rowMatch) {
            const n = parseInt(rowMatch[1], 10);
            if (n === 1) return 'صف واحد';
            if (n === 2) return 'صفان (2 صفوف)';
            if (n >= 3 && n <= 10) return `${n} صفوف`;
            return `${n} صفاً`;
        }

        // Match: X questions
        const qMatch = lower.match(/^(\d+)\s*questions?$/i);
        if (qMatch) {
            const n = parseInt(qMatch[1], 10);
            if (n === 1) return 'سؤال واحد';
            if (n === 2) return 'سؤالان';
            if (n >= 3 && n <= 10) return `${n} أسئلة`;
            return `${n} سؤالاً`;
        }

        // Match: Level X
        const levelMatch = lower.match(/^level\s*(\d+)/i);
        if (levelMatch) {
            return raw.replace(/level\s*/i, 'المستوى ');
        }

        // Match: Plus X
        if (lower.startsWith('plus ')) {
            return raw.replace(/plus\s*/i, 'إضافة ');
        }

        // Match: Minus X
        if (lower.startsWith('minus ')) {
            return raw.replace(/minus\s*/i, 'طرح ');
        }

        // Match: Table X
        const tableMatch = lower.match(/^table\s*(\d+)/i);
        if (tableMatch) {
            return `جدول ${tableMatch[1]}`;
        }

        // Match: Page X
        const pageMatch = lower.match(/^page\s*(\d+)/i);
        if (pageMatch) {
            return `صفحة ${pageMatch[1]}`;
        }
    }

    return raw;
};

export default translateCurriculumItem;
