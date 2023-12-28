// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.inputNames) {
    chrome.storage.local.set({ inputNames: message.inputNames.map(name => ({ name, value: '', fakeValue: '' })) });
  }
});

