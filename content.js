const threadContainer = document.querySelector("div.forumbg");
if (threadContainer) {
  function showHiddenThreadsPanel() {
    chrome.storage.local.get(null, result => {
      const hiddenTopicIds = Object.keys(result);
      const div = document.createElement("div");
      const emptyNotice = document.createTextNode("No hidden threads");

      div.classList = "hidden-threads-panel";
      if (hiddenTopicIds.length) {
        //   terrible, janky way to show emptyNotice without re-rendering entire div
        let deletedState = 0;
        const ul = document.createElement("ul");
        hiddenTopicIds.forEach(hiddenTopicId => {
          const li = document.createElement("li");
          const textNode = document.createTextNode(result[hiddenTopicId]);
          const button = document.createElement("button");
          const buttonTextNode = document.createTextNode("(restore)");
          button.addEventListener("click", () => {
            chrome.storage.local.remove(hiddenTopicId);
            deletedState++;
            li.remove();
            if (deletedState === hiddenTopicIds.length) {
              div.appendChild(emptyNotice);
            }
          });
          button.classList = "hidden-threads-panel__remove-button";
          button.appendChild(buttonTextNode);
          li.appendChild(textNode);
          li.appendChild(button);
          ul.appendChild(li);
        });
        div.appendChild(ul);
      } else {
        div.appendChild(emptyNotice);
      }
      threadContainer.appendChild(div);
      const hiddenThreadsButton = document.querySelector(
        ".hidden-threads-button"
      );
      hiddenThreadsButton.removeEventListener("click", showHiddenThreadsPanel);
      hiddenThreadsButton.addEventListener("click", hideHiddenThreadsPanel);
    });
  }

  function hideHiddenThreadsPanel() {
    const panel = document.querySelector(".hidden-threads-panel");
    panel.remove();
    const hiddenThreadsButton = document.querySelector(
      ".hidden-threads-button"
    );
    hiddenThreadsButton.removeEventListener("click", hideHiddenThreadsPanel);
    hiddenThreadsButton.addEventListener("click", showHiddenThreadsPanel);
  }

  function createHiddenThreadsButton() {
    const buttonNode = document.createElement("button");
    const textNode = document.createTextNode("hidden threads");
    buttonNode.classList = "hidden-threads-button";
    buttonNode.appendChild(textNode);
    buttonNode.addEventListener("click", showHiddenThreadsPanel);
    threadContainer.prepend(buttonNode);
  }
  createHiddenThreadsButton();

  function getTopicId(href = "") {
    const queryString = href.split("?")[1];
    const pairs = queryString.split("&");
    const topicId = pairs
      .find((pair = "") => pair.includes("t="))
      .split("=")[1];
    return topicId;
  }

  function hideThread(topicId, title) {
    chrome.storage.local.set({ [topicId]: title });
  }

  function createButton(topicId, title) {
    const buttonNode = document.createElement("button");
    const textNode = document.createTextNode("x");
    buttonNode.appendChild(textNode);
    buttonNode.classList = "hide-button";
    buttonNode.addEventListener("click", () => {
      hideThread(topicId, title);
    });
    return buttonNode;
  }

  const threadNodes = document.querySelectorAll("ul.topiclist li.row");
  const topicNodes = document.querySelectorAll(".topictitle");

  function renderHiddenThreadsPanel() {
    hideHiddenThreadsPanel();
    showHiddenThreadsPanel();
  }

  chrome.storage.local.get(null, result => {
    for (let i = 0; i < threadNodes.length; i++) {
      const threadNode = threadNodes[i];
      const topicNode = topicNodes[i];
      const topicId = getTopicId(topicNode.href);
      const title = topicNode.textContent;
      if (result[topicId]) {
        threadNode.classList.add("hidden");
      } else {
        const button = createButton(topicId, title);
        threadNode.appendChild(button);
      }
    }
  });

  chrome.storage.onChanged.addListener(changes => {
    let topicId = Object.keys(changes)[0];
    //   topic was hidden
    if (changes[topicId].newValue) {
      for (let i = 0; i < topicNodes.length; i++) {
        const topicNode = topicNodes[i];
        if (topicId === getTopicId(topicNode.href)) {
          threadNodes[i].classList.add("hidden");
          const panel = document.querySelector(".hidden-threads-panel");
          if (panel) {
            renderHiddenThreadsPanel();
          }
          break;
        }
      }
    } else {
      for (let i = 0; i < topicNodes.length; i++) {
        const topicNode = topicNodes[i];
        if (topicId === getTopicId(topicNode.href)) {
          threadNodes[i].classList.remove("hidden");
          break;
        }
      }
    }
  });
}
