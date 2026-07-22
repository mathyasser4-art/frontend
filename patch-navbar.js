const fs = require('fs');
const p = 'c:/Users/hp/Downloads/abacusheroes antigravity/frontend-master/src/components/navbar/Navbar.js'; 
let c = fs.readFileSync(p, 'utf8'); 
c = c.replace(
    `                const myTeacherId = localStorage.getItem('teacher_id');
                // Allow notification if student was created by this teacher, OR student was created by the teacher's school (common in Topsoroban)
                if (myTeacherId && data.teacherId) {
                    const matchesTeacher = String(myTeacherId) === String(data.teacherId);
                    const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                    
                    if (!matchesTeacher && !matchesSchool) {`,
    `                const myTeacherId = localStorage.getItem('teacher_id');
                const mySchoolName = localStorage.getItem('school_name');
                // Allow notification if student was created by this teacher, OR student was created by the teacher's school (common in Topsoroban)
                if (myTeacherId && data.teacherId) {
                    const matchesTeacher = String(myTeacherId) === String(data.teacherId);
                    const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                    const matchesSchoolName = mySchoolName && data.schoolName && mySchoolName.toLowerCase() === data.schoolName.toLowerCase();
                    
                    if (!matchesTeacher && !matchesSchool && !matchesSchoolName) {`
);
// Fix the second occurrence for auto-dismiss timer
c = c.replace(
    `            channel.bind('battle-created', (data) => {
                if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                const myTeacherId = localStorage.getItem('teacher_id');
                if (myTeacherId && data.teacherId) {
                    const matchesTeacher = String(myTeacherId) === String(data.teacherId);
                    const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                    
                    if (!matchesTeacher && !matchesSchool) return;`,
    `            channel.bind('battle-created', (data) => {
                if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                const myTeacherId = localStorage.getItem('teacher_id');
                const mySchoolName = localStorage.getItem('school_name');
                if (myTeacherId && data.teacherId) {
                    const matchesTeacher = String(myTeacherId) === String(data.teacherId);
                    const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                    const matchesSchoolName = mySchoolName && data.schoolName && mySchoolName.toLowerCase() === data.schoolName.toLowerCase();
                    
                    if (!matchesTeacher && !matchesSchool && !matchesSchoolName) return;`
);

fs.writeFileSync(p, c); 
console.log('Patched Navbar.js completely');
