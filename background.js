/* global browser */

let bookmarkFoldersCache;
let delayTimerId;

function recGetFolders(node, depth = 0){
    let out = new Map();
    if(typeof node.url !== 'string'){
        if(node.id !== 'root________'){
            out.set(node.id, { 'depth': depth, 'title': node.title });
        }
        if(node.children){
            for(let child of node.children){
                out = new Map([...out, ...recGetFolders(child, depth+1) ]);
            }
        }
    }
    return out;
}

async function updateBookmarkFoldersCache() {
    const nodes = await browser.bookmarks.getTree();
    let out = new Map();
    let depth = 1;
    for(const node of nodes){
        out = new Map([...out, ...recGetFolders(node, depth) ]);
    }
    bookmarkFoldersCache = out;
}

function delay_updateBookmarkFoldesCache(){
    clearTimeout(delayTimerId);
    delayTimerId = setTimeout(updateBookmarkFoldersCache, 2000);
}


async function onBAClicked() {

	// operate on highlighted tabs
	const tabs = await browser.tabs.query({ currentWindow:true, highlighted: true, hidden: false });

	let store = {};

	try {
		store = await browser.storage.local.get('selectors');
		if(typeof store === 'undefined'){
			store = {};
		}
	}catch(e){
		console.error('error', 'access to rules storage failed');
		store = {};
	}

	if( typeof store.selectors === 'undefined' ){
		store.selectors = [];
	}

	let bookmarkId = null;
	for(let tab of tabs) {
		bookmarkId = null;
		for(let selector of store.selectors) {
			// check activ
			if(typeof selector.activ === 'boolean') {
				if(selector.activ === true) {
				// check url regex
				if(typeof selector.url_regex === 'string') {
					selector.url_regex = selector.url_regex.trim();
						if(selector.url_regex !== ''){
                            if((new RegExp(selector.url_regex)).test(tab.url)){
                                if ( typeof selector.bookmarkId === 'string' ) {
                                    if ( selector.bookmarkId !== '' ) {
										bookmarkId = selector.bookmarkId;
										break;
									}
								}
							}
						}
					}
				}
			}
		}
		let createdetails = {
			title: tab.title,
			url: tab.url
		}
		if(bookmarkId !== null){
			createdetails.parentId = bookmarkId;
		}
		browser.bookmarks.create(createdetails);
	}
}

// send the cachedFolders to the options page
function onMessage(/*data, sender*/){
    return Promise.resolve(bookmarkFoldersCache);
}

browser.menus.create({

  title: "Options",
  contexts: ["browser_action"],
  onclick: () => {
    browser.tabs.create({
        url: 'options.html',
        active: true
    });
  }
});


// bookmark
browser.browserAction.onClicked.addListener(onBAClicked);

// option page opened
browser.runtime.onMessage.addListener(onMessage);

// events to update the folder Cache
  browser.runtime.onStartup.addListener(delay_updateBookmarkFoldesCache);
browser.runtime.onInstalled.addListener(delay_updateBookmarkFoldesCache);
browser.bookmarks.onCreated.addListener(delay_updateBookmarkFoldesCache);
browser.bookmarks.onRemoved.addListener(delay_updateBookmarkFoldesCache);

