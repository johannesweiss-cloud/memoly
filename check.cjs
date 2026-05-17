const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
if (match) {
  match.forEach((script, index) => {
    const code = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    try {
      new Function(code);
      console.log(`Script ${index} is OK.`);
    } catch (e) {
      console.log(`Script ${index} Syntax Error:`, e.message);
    }
  });
}
