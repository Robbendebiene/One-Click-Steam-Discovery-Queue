// ==UserScript==
// @name                One-Click Steam Discovery-Queue
// @description         Simple user script for automated one-click Steam discovery queue exploring.
// @version             1.0.1
// @namespace           https://github.com/Robbendebiene/One-Click-Steam-Discovery-Queue
// @updateURL           https://raw.githubusercontent.com/Robbendebiene/One-Click-Steam-Discovery-Queue/master/steam-one-click-queue.user.js
// @icon                https://store.steampowered.com/favicon.ico
// @match               *://store.steampowered.com/explore*
// @run-at              document-end
// ==/UserScript==

/**
 * Programm logic
 **/

const queueExplorationCount = 3;
let queueCounter = 0;

function queryNextItem (itemDocument) {
  const nextItemForm = itemDocument.getElementById("next_in_queue_form");
  return new Promise((resolve, reject) => {
    if (!nextItemForm) reject("no more items");
    else {
      const nextItemFormData = new FormData(nextItemForm);
      const xhr = new XMLHttpRequest();
      xhr.responseType = "document";
      xhr.timeout = 20000;
      xhr.onerror = xhr.ontimeout = reject;
      xhr.onload = () => resolve(xhr.response);
      xhr.open("POST", nextItemForm.action);
      xhr.send(nextItemFormData);
    }
  });
}

function queryNextQueue () {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "document";
    xhr.timeout = 20000;
    xhr.onerror = xhr.ontimeout = reject;
    xhr.onload = () => resolve(xhr.response);
    xhr.open("GET", "https://store.steampowered.com/explore/startnew");
    xhr.send();
  });
}

function handleNextItem (currentItemDocument) {
  const queryNextItemDocument = queryNextItem(currentItemDocument);
  queryNextItemDocument.then(handleNextItem);
  queryNextItemDocument.catch((error) => {
    if (error === "no more items") handleNextQueue();
    else onError(error);
  });
  onNewItem(currentItemDocument);
};

function handleNextQueue () {
  if (queueCounter++ < queueExplorationCount) {
    const queryNextQueueDocument = queryNextQueue();
    queryNextQueueDocument.then(handleNextItem);
    queryNextQueueDocument.catch(onError);
    onNewQueue();
  }
  else {
    queueCounter = 0;
    onSuccess();
  }
}

/**
 * User interface
 **/

const customHTMLFragment = document.createRange().createContextualFragment(`
  <div class="discovery_queue_customize_ctn" style="display: flex; flex-direction: row; align-items: center;">
    <button class="btnv6_lightblue_blue btn_medium">
      <span>One-click queue discovery</span>
    </button>
    <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; flex: 1;">This will automatically explore ${queueExplorationCount} queues.</span>
  </div>
`);
const triggerButton = customHTMLFragment.querySelector(".btnv6_lightblue_blue");
      triggerButton.onclick = startDiscovery;
const infoText = customHTMLFragment.querySelector(".discovery_queue_customize_ctn > span");
const pageContent = document.querySelector(".page_content_ctn .page_content");
      pageContent.prepend(customHTMLFragment);

function startDiscovery () {
  triggerButton.disabled = true;
  handleNextQueue();
}

function onError (error) {
  infoText.textContent = "A connection error occurred. Visit the console for more information.";
  console.error("A connection error occurred", error);
}

function onNewItem (itemDocument) {
  infoText.textContent = `Exploring items of ${queueCounter}. queue: `;
  const itemLink = document.createElement("a");
        itemLink.textContent = itemDocument.title;
        itemLink.href = itemDocument.URL;
  infoText.appendChild(itemLink);
}

function onNewQueue () {
  infoText.textContent = `Starting ${queueCounter}. queue...`;
}

function onSuccess () {
  triggerButton.disabled = false;
  infoText.textContent = "All queues successfully explored! ";
  const itemLink = document.createElement("a");
        itemLink.textContent = "Click here to reload the page.";
        itemLink.href = "javascript:location.reload(true);";
  infoText.appendChild(itemLink);
}
