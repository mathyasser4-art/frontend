const fs = require('fs');
const paths = [
    'c:/Users/hp/Downloads/abacusheroes antigravity/frontend-master/src/pages/games/MathRacer.js', 
    'c:/Users/hp/Downloads/abacusheroes antigravity/frontend-master/src/pages/games/TanksGame.js'
]; 
paths.forEach(p => { 
    let c = fs.readFileSync(p, 'utf8'); 
    c = c.replace(/bind\('([^']+)',\s*\(([^)]+)\)\s*=>\s*{/g, (match, event, arg) => {
        return `bind('${event}', (${arg}) => {\n            if (typeof ${arg} === 'string') { try { ${arg} = JSON.parse(${arg}); } catch (e) {} }`;
    }); 
    fs.writeFileSync(p, c); 
}); 
console.log('Done');
