/**
 * Combines HTML, CSS, and JS files uploaded by users into a complete,
 * self-contained and sandboxed HTML string ready for iframe playback.
 */
export function bundleGameSource(
  htmlContent: string,
  cssContent: string = '',
  jsContent: string = ''
): string {
  let finalHtml = htmlContent.trim();

  // If user only provided a partial body fragment (no html/body tags), wrap it nicely
  const hasHtmlTag = /<html[\s>]/i.test(finalHtml);
  const hasBodyTag = /<body[\s>]/i.test(finalHtml);

  if (!hasHtmlTag && !hasBodyTag) {
    finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game</title>
</head>
<body>
${finalHtml}
</body>
</html>`;
  }

  // Inject CSS if provided
  if (cssContent && cssContent.trim()) {
    const styleSnippet = `\n<style>\n/* Community Game Styles */\n${cssContent}\n</style>\n`;
    if (finalHtml.includes('</head>')) {
      finalHtml = finalHtml.replace('</head>', `${styleSnippet}</head>`);
    } else if (finalHtml.includes('<body')) {
      finalHtml = finalHtml.replace(/<body/i, `${styleSnippet}<body`);
    } else {
      finalHtml = `${styleSnippet}${finalHtml}`;
    }
  }

  // Inject JS if provided
  if (jsContent && jsContent.trim()) {
    const scriptSnippet = `\n<script>\n// Community Game Logic\ntry {\n${jsContent}\n} catch (err) {\n  console.error("Game Runtime Error:", err);\n}\n</script>\n`;
    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `${scriptSnippet}</body>`);
    } else {
      finalHtml = `${finalHtml}${scriptSnippet}`;
    }
  }

  return finalHtml;
}

