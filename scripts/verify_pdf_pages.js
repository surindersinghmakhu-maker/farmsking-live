const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
const scriptDir = __dirname;
const artifactDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\1cfdce65-90cd-440e-b456-b9e71e355fb3';

const genScript = fs.readFileSync(path.join(scriptDir, 'generate_executive_dossier_pdf.js'), 'utf8');
const startTag = 'const htmlContent = `';
const endTag = '`;\n\nfs.writeFileSync';

const startIndex = genScript.indexOf(startTag) + startTag.length;
const endIndex = genScript.indexOf(endTag);
const fullHtml = genScript.substring(startIndex, endIndex);

const style = fullHtml.substring(fullHtml.indexOf('<style>') + 7, fullHtml.indexOf('</style>'));

const rawPages = fullHtml.split(/<!-- ==================== PAGE \d+[^>]*==================== -->/);
// rawPages[0] is preamble before page 1
console.log('Pages found via split:', rawPages.length - 1);

for (let i = 1; i < rawPages.length; i++) {
  let pageContent = rawPages[i].trim();
  // If it contains trailing </body></html>, remove it
  pageContent = pageContent.replace(/<\/body>\s*<\/html>/i, '').trim();

  const pageHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${style}
  body { margin: 0; padding: 12mm 14mm; background: #ffffff; width: 210mm; height: 297mm; box-sizing: border-box; }
  .page { height: 271mm; max-height: 271mm; }
</style>
</head>
<body>
${pageContent}
</body>
</html>`;

  const tempHtml = path.join(scriptDir, `_preview_clean_p${i}.html`);
  const outPng = path.join(artifactDir, `dossier_page_${i}.png`);
  fs.writeFileSync(tempHtml, pageHtml, 'utf8');

  try {
    execSync(`${chromePath} --headless=new --disable-gpu --window-size=992,1403 --screenshot="${outPng}" "${tempHtml}"`, { stdio: 'ignore' });
    console.log(`Rendered Page ${i} to ${outPng}`);
  } catch (err) {
    console.error(`Error rendering page ${i}:`, err.message);
  } finally {
    if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
  }
}

console.log('Successfully completed rendering all 5 pages.');
