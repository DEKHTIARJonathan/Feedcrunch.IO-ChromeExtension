var local           = false;
var api_endpoint    = null;
var current_rssfedd = null;

var icon_dict       = {};
var icon_data       = {
    prod: {
        no_rss: chrome.runtime.getManifest().icons,
        with_rss: {
            "19": "img/icon_add.png",
            "48": "img/iconLauncher_add.png",
            "128": "img/iconStore_add.png"
        }
    },
    debug: {
        no_rss: {
            "19": "img/icon_dev.png",
            "48": "img/iconLauncher_dev.png",
            "128": "img/iconStore_dev.png"
        },
        with_rss: {
            "19": "img/icon_add_dev.png",
            "48": "img/iconLauncher_add_dev.png",
            "128": "img/iconStore_add_dev.png"
        }
    }
}

/* ===================================================================================
============= ############## Getting the correct Endpoint ############## =============
=================================================================================== */

chrome.management.get(chrome.runtime.id, function(app_info){
    if (app_info.installType == "development"){

        icon_dict = icon_data.debug;

        if (local){
            api_endpoint = "https://local.feedcrunch.io:5000/";
    	}
        else{
            api_endpoint = "https://feedcrunch-api-dev.eu-gb.mybluemix.net/";
        }
        chrome.browserAction.setIcon({path: icon_dict.no_rss});
    }
    else {
        icon_dict = icon_data.prod;
        api_endpoint = "https://feedcrunch-api-prod.eu-gb.mybluemix.net/";
    }
});

/* ===================================================================================
================ ############## Extension Entry Point ############## =================
=================================================================================== */

function OpenExtensionIFrame(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

        chrome.cookies.remove({url: api_endpoint, name: "sessionid"});

        chrome.tabs.sendMessage(
        	tabs[0].id,
        	{
	        	command: "create_window",
	        	id: tabs[0].id,
	        	title: tabs[0].title,
	        	url: tabs[0].url,
	        },
	        function(response){
                if (response != undefined && response.result != "success"){
	            	console.log(response);
	            	console.log(response.result);
	            }
        	}
        );
    });
}

/* ===================================================================================
================= ############## RSS Checking Routine ############## =================
=================================================================================== */

function checkRSSFeeds() {
    //query the information on the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){

        if (tabs.length > 0 && tabs[0].id != undefined){
            chrome.tabs.executeScript(
                tabs[0].id,
                {
                    code: `
                        var RSS_CONTENT_TYPES = [
                            "application/xhtml+xml",
                            "application/xml",
                            "application/atom+xml",
                            "application/rss+xml",
                            "application/rdf+xml",
                            "text/xml"
                        ]

                        var rss_tag = null;

                        for (x in RSS_CONTENT_TYPES){
                            rss_tag = document.querySelector("[type=\'"+RSS_CONTENT_TYPES [x]+"\']");
                            if (rss_tag != null){
                                feed_url = rss_tag.getAttribute("href");
                                break;
                            }
                        }

                        if (rss_tag == null) {
                            if (RSS_CONTENT_TYPES.indexOf(document.contentType) > -1){
                                feed_url = document.documentURI;
                            } else {
                                null;
                            }
                        }

                        if (feed_url[0] == "/" &&  feed_url.substring(0, 2) != "//"){
                            feed_url = window.location.origin + feed_url;
                        }

                        feed_url
                        `
                },
                function(rss_href){
                    if(chrome.runtime.lastError == undefined){
                        current_rssfedd = rss_href[0];
                        if (current_rssfedd != null){
                            chrome.browserAction.setIcon({path: icon_dict.with_rss});
                        }
                        else {
                            chrome.browserAction.setIcon({path: icon_dict.no_rss});
                        }
                    }
                    else {
                        current_rssfedd = null;
                        chrome.browserAction.setIcon({path: icon_dict.no_rss});
                    }

                }
            );
        }
        else{
            current_rssfedd = null;
            chrome.browserAction.setIcon({path: icon_dict.no_rss});
        }
    });
}

//listen for new tab to be activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
    checkRSSFeeds();
});

//listen for current tab to be changed
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    checkRSSFeeds();
});

/* ===================================================================================
=============== ############## Browser Action Listeners ############## ===============
=================================================================================== */

chrome.browserAction.onClicked.addListener(function() {
    OpenExtensionIFrame();
});

/* ===================================================================================
=================== ############## Message Listeners ############## ==================
=================================================================================== */

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    	if (request.action == "get_endpoint"){
    		sendResponse({
    			result: "success",
    			endpoint: api_endpoint
    		});
    	}
    	else if (request.action == "open_signup_tab"){
    		chrome.tabs.executeScript(sender.tab.id,
                {code: 'document.getElementById("feedcrunch-window").remove();'}
            );
            chrome.tabs.create({url: "https://www.feedcrunch.io/signup/"});
            sendResponse({result: "success"});
    	}
    	else if (request.action == "open_admin_panel"){

            chrome.storage.local.get('username', function(result) {
                if (result.username){
                    chrome.tabs.create({
                        url: "https://www.feedcrunch.io/@" + result.username + "/admin/"
                    });
                }
                else {
                    console.log("Error: 'username' local variable does not exists.");
                }
            });
            sendResponse({result: "success"});
    	}
    	else if (request.action == "open_personal_feed"){

            chrome.storage.local.get('username', function(result) {
                if (result.username){
                    chrome.tabs.create({
                        url: "https://www.feedcrunch.io/@" + result.username + "/"
                    });
                }
                else {
                    console.log("Error: 'username' local variable does not exists.");
                }
            });
            sendResponse({result: "success"});
    	}
    	else if(request.action == "shutdown-iframe"){
        	chrome.tabs.executeScript(sender.tab.id,
                {code: 'document.getElementById("feedcrunch-window").remove();'}
            );
            sendResponse({result: "success"});
        }
        else if(request.action == "get_pageinfo"){
            sendResponse({
                result: "success",
                rss_link: current_rssfedd,
                title: sender.tab.title,
                url: sender.tab.url
            });
        }
        else{
        	sendResponse({result: "error: unknown action: " + request.action});
        }
    }
);

/* ===================================================================================
================ ############## Context Menus Handling ############## ================
=================================================================================== */

function setUpContextMenus() {
    chrome.contextMenus.create( {
      title: "Share with FeedCrunch",
      id: "ShareFC",
      contexts: ['all']
    });
};

chrome.runtime.onInstalled.addListener(function() {
    // When the app gets installed, set up the context menus
    setUpContextMenus();
});

chrome.contextMenus.onClicked.addListener(function(itemData) {
    if (itemData.menuItemId == "ShareFC"){
        OpenExtensionIFrame();
    }
});
