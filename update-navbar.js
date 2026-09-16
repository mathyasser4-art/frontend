const fs = require('fs');

const file = 'src/components/navbar/Navbar.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Center Links
const centerLinksRegex = /\{\/\* Desktop Center Links \*\/\}.*?<\/div>/s;
content = content.replace(centerLinksRegex, '{/* Desktop Center Links removed */}');

// 2. Change COMPETITIONS to JOIN A COMPETITION
content = content.replace(
    /\{t\('navbar\.competitionsHub', '🏆 COMPETITIONS'\)\}/g,
    "{t('navbar.competitionsHub', '🏆 JOIN A COMPETITION')}"
);

// 3. Add 3D "Create a Competition" button
const newButton = `
                    {isAuth && (role === 'Teacher' || role === 'School' || role === 'IT') ? (
                        <div 
                            className="nav-btn create-competition-3d-btn"
                            onClick={() => { soundEffects.playClick(); setShowCreateCompetition(true); }}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: '900',
                                fontSize: '13px',
                                padding: '0.45rem 1rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginRight: '6px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 -3px 0 rgba(0,0,0,0.2)',
                                transition: 'transform 0.1s, box-shadow 0.1s',
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translateY(2px)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.35), inset 0 -1px 0 rgba(0,0,0,0.2)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 -3px 0 rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 -3px 0 rgba(0,0,0,0.2)';
                            }}
                        >
                            {t('navbar.createCompetition', '⚔️ CREATE COMPETITION')}
                        </div>
                    ) : null}`;

// Insert the new button right before the Join Competition button check
content = content.replace(
    /\{isAuth && \(role === 'Teacher' \|\| role === 'School' \|\| role === 'IT'\) \? \(\s*<Link\s*to="\/teacher\/competitions-hub"/g,
    newButton + "\n                    {isAuth && (role === 'Teacher' || role === 'School' || role === 'IT') ? (\n                        <Link \n                            to=\"/teacher/competitions-hub\""
);

fs.writeFileSync(file, content);
console.log('Update complete.');
