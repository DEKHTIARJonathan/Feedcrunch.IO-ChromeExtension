var debug        = true;
var local        = false;
var api_endpoint = null;

if (debug){
	if (local){
        api_endpoint = "https://local.feedcrunch.io:5000/";
	}
    else{
        api_endpoint = "https://feedcrunch-api-dev.eu-gb.mybluemix.net/";
    }
}    
else{
    api_endpoint = "https://feedcrunch-api-prod.eu-gb.mybluemix.net/";
}

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
	        function(response) {
	            if (response["result"] != "success"){
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
    	else if (request.action == "get_pageinfo"){    		
        	sendResponse({
    			result: "success",
    			title: sender.tab.title,
    			url: sender.tab.url
    		}); 		
    	}
    	else if(request.action == "shutdown-iframe"){
        	chrome.tabs.executeScript(sender.tab.id,
                {code: 'document.getElementById("feedcrunch-window").remove();'}
            );
            sendResponse({result: "success"});
        }
        else{
        	sendResponse({result: "error: unknown action: " + request.action});
        }  
    }
);
