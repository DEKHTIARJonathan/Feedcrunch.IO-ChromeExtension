chrome.browserAction.onClicked.addListener(function() {

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("ID="+ tabs[0].id);

        chrome.tabs.sendMessage(tabs[0].id, {command: "create_window"}, function(response) {
            console.log(response);
            console.log(response.result);
        });
    });
    
});
