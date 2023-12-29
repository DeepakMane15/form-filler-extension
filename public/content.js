// content.js

const inputNames = Array.from(document.querySelectorAll('input, textarea'))
    .filter(input => !input.type || !input.type.toLowerCase().includes('file'))
    .map(input => input.getAttribute('name'))
    .filter(Boolean);

chrome.runtime.sendMessage({ inputNames });
