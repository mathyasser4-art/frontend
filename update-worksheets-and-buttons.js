const fs = require('fs');

// 1. Update Arabic translation.json
let arFile = 'src/locales/ar/translation.json';
let arContent = fs.readFileSync(arFile, 'utf8');
arContent = arContent.replace(/أوراق العمل/g, 'تمارين المنصة');
arContent = arContent.replace(/أوراق عمل/g, 'تمارين منصة');
fs.writeFileSync(arFile, arContent);

// 2. Update English translation.json
let enFile = 'src/locales/en/translation.json';
let enContent = fs.readFileSync(enFile, 'utf8');
enContent = enContent.replace(/"textbookWorksheets": "Textbook Worksheets"/g, '"textbookWorksheets": "Website Exercises"');
fs.writeFileSync(enFile, enContent);

// 3. Update Navbar.js (Remove Classes and Add Students buttons)
let navbarFile = 'src/components/navbar/Navbar.js';
let navbarContent = fs.readFileSync(navbarFile, 'utf8');

const classesRegex = /<Link to=\{'\/dashboard-school\/class'\}.*?<\/Link>/s;
const studentsRegex = /<Link to=\{'\/teacher\/registration'\}.*?<\/Link>/s;

navbarContent = navbarContent.replace(classesRegex, '');
navbarContent = navbarContent.replace(studentsRegex, '');

fs.writeFileSync(navbarFile, navbarContent);

// 4. Update User.js (Add Classes and Add Students buttons)
let userFile = 'src/pages/user/User.js';
let userContent = fs.readFileSync(userFile, 'utf8');

// Need to make sure Link is imported in User.js
if (!userContent.includes('import { Link }')) {
    if (userContent.includes('import { useNavigate }')) {
        userContent = userContent.replace("import { useNavigate }", "import { useNavigate, Link }");
    } else {
        userContent = userContent.replace("import { useTranslation } from 'react-i18next'", "import { useTranslation } from 'react-i18next'\nimport { Link } from 'react-router-dom'");
    }
}

const buttonsToAdd = `
                    {role === 'Teacher' && (
                        <div className="teacher-management-buttons" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', width: '320px', maxWidth: '90%' }}>
                            <Link to={'/dashboard-school/class'} style={{ flex: 1, textDecoration: 'none' }}>
                                <div className="user-btn" style={{ background: 'linear-gradient(-45deg, #3b82f6, #60a5fa, #3b82f6, #60a5fa)', width: '100%', padding: '10px 0' }}>
                                    {isArabic ? 'إدارة الفصول 🏫' : 'Classes 🏫'}
                                </div>
                            </Link>
                            <Link to={'/teacher/registration'} style={{ flex: 1, textDecoration: 'none' }}>
                                <div className="user-btn" style={{ background: 'linear-gradient(-45deg, #10b981, #34d399, #10b981, #34d399)', width: '100%', padding: '10px 0' }}>
                                    {isArabic ? 'إضافة طلاب 👤' : 'Add Students 👤'}
                                </div>
                            </Link>
                        </div>
                    )}
`;

userContent = userContent.replace(
    /<div onClick=\{openEditPopup\} className="user-btn"/g,
    buttonsToAdd + '\n                    <div onClick={openEditPopup} className="user-btn"'
);

fs.writeFileSync(userFile, userContent);

console.log("All updates applied successfully.");
