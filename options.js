/* global browser */

let bookmarkFolders;

const syncCheckbox = document.getElementById("sync-checkbox");
const syncButton = document.getElementById("sync-button");

// Load syncCheckbox value from local storage
browser.storage.local.get("syncEnabled", function (result) {
  if (result.syncEnabled !== undefined) {
    syncCheckbox.checked = result.syncEnabled;
  }
});

browser.storage.onChanged.addListener(() => {
  let res = browser.storage.local.get("selectors");
  if (!Array.isArray(res.selectors)) {
    return;
  }
  res.selectors.forEach((selector) => {
    selector.action = "delete";
    createTableRow(selector);
  });
});

function deleteRow(rowTr) {
  let mainTableBody = document.getElementById("mainTableBody");
  mainTableBody.removeChild(rowTr);
}

function createTableRow(feed) {
  let mainTableBody = document.getElementById("mainTableBody");
  let tr = mainTableBody.insertRow();

  Object.keys(feed)
    .sort()
    .forEach((key) => {
      let input;
      switch (key) {
        case "activ":
          input = document.createElement("input");
          input.className = key;
          input.style.width = "95%";
          input.placeholder = key;
          input.type = "checkbox";
          input.checked = typeof feed[key] === "boolean" ? feed[key] : true;
          break;
        case "bookmarkId":
          input = document.createElement("select");
          input.className = key;
          input.style.width = "95%";
          for (const [k, v] of bookmarkFolders) {
            input.add(new Option(">".repeat(v.depth) + " " + v.title, k));
          }
          input.value = feed[key];
          break;
        case "url_regex":
          input = document.createElement("input");
          input.className = key;
          input.style.width = "95%";
          input.placeholder = "url_regex";
          input.value = feed[key];
          break;
        default:
          return;
      }
      tr.insertCell().appendChild(input);
    });

  let button;
  if (feed.action === "save") {
    button = createButton("Create", "saveButton", function () {}, true);
  } else {
    button = createButton(
      "Delete",
      "deleteButton",
      function () {
        deleteRow(tr);
      },
      false
    );
  }
  tr.insertCell().appendChild(button);
}

function collectConfig() {
  let mainTableBody = document.getElementById("mainTableBody");
  let feeds = [];
  for (let row = 0; row < mainTableBody.rows.length; row++) {
    try {
      let url_regex =
        mainTableBody.rows[row].querySelector(".url_regex").value.trim() || "";
      let bookmarkId =
        mainTableBody.rows[row].querySelector(".bookmarkId").value || "";
      let check =
        mainTableBody.rows[row].querySelector(".activ").checked || false;

      if (url_regex !== "" && bookmarkId !== "") {
        feeds.push({
          activ: check,
          url_regex: url_regex,
          bookmarkId: bookmarkId,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  return feeds;
}

function createButton(text, id, callback, submit) {
  let span = document.createElement("span");
  let button = document.createElement("button");
  button.id = id;
  button.textContent = text;
  button.className = "browser-style";
  if (submit) {
    button.type = "submit";
  } else {
    button.type = "button";
  }
  button.name = id;
  button.value = id;
  button.addEventListener("click", callback);
  span.appendChild(button);
  return span;
}

async function saveOptions(/*e*/) {
  let feeds = collectConfig();
  await browser.storage.local.set({ selectors: feeds });

  // Save syncCheckbox value to local storage
  await browser.storage.local.set({ syncEnabled: syncCheckbox.checked });

  // Sync with account if checkbox is checked
  if (syncCheckbox.checked) {
    await browser.storage.sync.set({ selectors: feeds });
  }
}

async function restoreOptions() {
  bookmarkFolders = await browser.runtime.sendMessage({});

  createTableRow({
    activ: 1,
    bookmarkId: "",
    url_regex: "",
    action: "save",
  });

  //let res = await browser.storage.local.get('selectors');
  //if ( !Array.isArray(res.selectors) ) { return; }
  //res.selectors.forEach( (selector) => {
  //    selector.action = 'delete'
  //    createTableRow(selector);
  //});

  await browser.storage.local.get("selectors", function (localResult) {
    if (localResult.selectors) {
      localResult.selectors.forEach((selector) => {
        selector.action = "delete";
        createTableRow(selector);
      });
    } else {
      // If no local selectors, check for synced selectors
      browser.storage.sync.get("selectors", function (syncResult) {
        if (syncResult.selectors) {
          // Save synced selectors to local storage
          browser.storage.local.set({ selectors: syncResult.selectors });
          // Populate selectorList with synced selectors
          syncResult.selectors.forEach((selector) => {
            selector.action = "delete";
            createTableRow(selector);
          });
        }
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

const impbtnWrp = document.getElementById("impbtn_wrapper");
const impbtn = document.getElementById("impbtn");
const expbtn = document.getElementById("expbtn");

// Sync button click event
syncButton.addEventListener("click", function () {
  browser.storage.sync.get("selectors", function (result) {
    if (result.selectors) {
      // Save synced selectors to local storage
      browser.storage.local.set({ selectors: result.selectors });
      // Populate selectorList with synced selectors
      result.selectors.forEach((selector) => {
        selector.action = "delete";
        createTableRow(selector);
      });
    }
  });
});

expbtn.addEventListener("click", async function (/*evt*/) {
  let dl = document.createElement("a");
  let res = await browser.storage.local.get("selectors");
  let content = JSON.stringify(res.selectors, null, 4);
  dl.setAttribute(
    "href",
    "data:application/json;charset=utf-8," + encodeURIComponent(content)
  );
  dl.setAttribute("download", "data.json");
  dl.setAttribute("visibility", "hidden");
  dl.setAttribute("display", "none");
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
});

// delegate to real Import Button which is a file selector
impbtnWrp.addEventListener("click", function (/*evt*/) {
  impbtn.click();
});

impbtn.addEventListener("input", function (/*evt*/) {
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = async function (/*e*/) {
    try {
      let config = JSON.parse(reader.result);
      await browser.storage.local.set({ selectors: config });
      document.querySelector("form").submit();
    } catch (e) {
      console.error("error loading file: " + e);
    }
  };
  reader.readAsText(file);
});

function onChange(evt) {
  let id = evt.target.id;
  let el = document.getElementById(id);

  let value = el.type === "checkbox" ? el.checked : el.value;
  let obj = {};

  //console.log(id,value, el.type,el.min);
  if (value === "") {
    return;
  }
  if (el.type === "number") {
    try {
      value = parseInt(value);
      if (isNaN(value)) {
        value = el.min;
      }
      if (value < el.min) {
        value = el.min;
      }
    } catch (e) {
      value = el.min;
    }
  }

  obj[id] = value;

  console.log(id, value);
  browser.storage.local.set(obj).catch(console.error);
}

["notifications"].map((id) => {
  browser.storage.local
    .get(id)
    .then((obj) => {
      let el = document.getElementById(id);
      let val = obj[id];

      if (typeof val !== "undefined") {
        if (el.type === "checkbox") {
          el.checked = val;
        } else {
          el.value = val;
        }
      } else {
        el.value = 0;
      }
    })
    .catch(console.error);

  let el = document.getElementById(id);
  el.addEventListener("input", onChange);
});
