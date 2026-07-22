const fs = require('fs');
const p = 'c:/Users/hp/Downloads/abacusheroes antigravity/frontend-master/src/components/navbar/Navbar.js'; 
let c = fs.readFileSync(p, 'utf8'); 
c = c.replace(/bind\('([^']+)',\s*\(([^)]+)\)\s*=>\s*{/g, (match, event, arg) => {
    return `bind('${event}', (${arg}) => {\n            if (typeof ${arg} === 'string') { try { ${arg} = JSON.parse(${arg}); } catch (e) {} }`;
}); 
fs.writeFileSync(p, c); 
console.log('Done Navbar');
