/* global browser */

browser.browserAction.onClicked.addListener(async (tab) => {
    // 1. get fromm regexs + bookmarkIds from storage

    let store = {};

	try {
		store = await browser.storage.local.get('selectors');
	}catch(e){
		console.error('error', 'access to rules storage failed');
		return;
	}

	if ( typeof store.selectors !== 'object' ) {
		console.error('error', 'rules selectors not available');
		return;
	}

    const bookmarkId = (function() {
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
                                        return selector.bookmarkId;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }());

    /*
    try {
        const bookmarkTreeNode = await browser.bookmarks.get(bookmarkId);
    }catch(e){
        console.error(e);
        // bookmark with id doent exist
        return;
    }

    if(!bookmarkTreeNode.children){
        // not a folder ref. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode
        return;
    }
    */
    let createdetails = {
        title: tab.title,
        url: tab.url
    }
    if(bookmarkId !== null){
        createdetails.parentId = bookmarkId;
    }

    browser.bookmarks.create(createdetails);

});
