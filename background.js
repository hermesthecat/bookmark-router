/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;


browser.menus.create({
	id: extname + "_tabs",
	title: "Bookmark Placer",
	contexts: ["tab"],
	onclick: bookmark // function(info/*, tab*/) {}
});

browser.menus.create({
	id: extname + "_bookmarks",
	title: "Copy Bookmark Folder Id",
	contexts: ["bookmark"],
	visible: false,
	onclick: function(info/*, tab*/) {
		if(info.bookmarkId){
            try {
                navigator.clipboard.writeText(info.bookmarkId);
                console.log(info.bookmarkId);
            }catch(e){
                console.error(e);
            }
		}
	}
});


browser.menus.onShown.addListener(async function(info/*, tab*/) {
	if(info.bookmarkId) {
        const bookmarkTreeNode = (await browser.bookmarks.get(info.bookmarkId))[0];
		if(bookmarkTreeNode.url) {
			await browser.menus.update(extname+"_bookmarks", {visible: false});
		}else{
			await browser.menus.update(extname+"_bookmarks", {visible: true});
		}
	}
	browser.menus.refresh();
});


browser.browserAction.onClicked.addListener(bookmark);

async function bookmark() {

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
