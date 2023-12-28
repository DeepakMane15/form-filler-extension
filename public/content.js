// content.js

const inputNames = Array.from(document.querySelectorAll('input, textarea')).map(input => input.getAttribute('name')).filter(Boolean);

chrome.runtime.sendMessage({ inputNames });
