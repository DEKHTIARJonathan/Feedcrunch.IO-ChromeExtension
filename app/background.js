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

function checkRSSFeeds() {
    //query the information on the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tab){

        chrome.tabs.executeScript(
            tab[0].id,
            {
                code: 'var rss_tag = document.querySelector("[type=\'application/rss+xml\']"); \
                      if (rss_tag == null){rss_tag = document.querySelector("[type=\'application/atom+xml\']");} \
                      if (rss_tag == null) {null} else {rss_tag.href}'
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

chrome.browserAction.onClicked.addListener(function() {

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

});

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
