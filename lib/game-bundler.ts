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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Game</title>
</head>
<body>
${finalHtml}
</body>
</html>`;
  } else if (!/<meta[\s]+name=["']viewport["']/i.test(finalHtml)) {
    // Inject mobile viewport if missing in user's head
    if (finalHtml.includes('<head>')) {
      finalHtml = finalHtml.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
    }
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

  // Inject Mobile Virtual Keyboard postMessage bridge & JS
  const virtualControlsBridge = `
<script>
// Buddy Line Mobile Virtual Controller Bridge
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'BUDDY_LINE_KEY_EVENT') {
    try {
      var action = event.data.action || 'keydown';
      var keyData = {
        key: event.data.key,
        code: event.data.code,
        keyCode: event.data.keyCode,
        which: event.data.keyCode,
        bubbles: true,
        cancelable: true
      };
      var keyEvent = new KeyboardEvent(action, keyData);
      window.dispatchEvent(keyEvent);
      document.dispatchEvent(keyEvent);
      if (document.activeElement && typeof document.activeElement.dispatchEvent === 'function') {
        document.activeElement.dispatchEvent(keyEvent);
      }
    } catch (e) {
      console.warn('Virtual controller bridge error:', e);
    }
  }
});
</script>
`;

  // Inject JS if provided, along with the bridge
  const scriptSnippet = `\n${virtualControlsBridge}\n<script>\n// Community Game Logic\ntry {\n${jsContent}\n} catch (err) {\n  console.error("Game Runtime Error:", err);\n}\n</script>\n`;
  if (finalHtml.includes('</body>')) {
    finalHtml = finalHtml.replace('</body>', `${scriptSnippet}</body>`);
  } else {
    finalHtml = `${finalHtml}${scriptSnippet}`;
  }

  return finalHtml;
}

