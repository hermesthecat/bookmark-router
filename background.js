/* global browser */

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

browser.browserAction.onClicked.addListener(bookmark);
