const fs = require('fs');
const path = 'src/pages/foodbank/FoodbankMessages.jsx';
let c = fs.readFileSync(path, 'utf8');
// Remove conflict markers, keep upstream version (buddy's real implementation)
c = c.replace(
  /<<<<<<< Updated upstream\n([\s\S]*?)=======\n[\s\S]*?>>>>>>> Stashed changes\n/g,
  '$1'
);
fs.writeFileSync(path, c);
console.log('Conflict resolved.');
