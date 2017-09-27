chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if (request.command == "create_window"){

        var iframe_id = "feedcrunch-window";

        var iframe_elem = document.getElementById(iframe_id);

        if (iframe_elem === null) {

            //var iframe = document.createElement('iframe');
            var iframe = document.createElementNS('http://www.w3.org/1999/xhtml', 'iframe');

            chrome.storage.local.get(['loginToken', 'username'], function(result) {

                var target_webpage = "templates/";

                if (!(result.loginToken) || !(result.username))
                    target_webpage += "login.html";
                else{
                    target_webpage += "submit_article.html";
                }

                iframe.src = chrome.runtime.getURL(target_webpage);
                iframe.id = iframe_id;

                iframe.style.cssText = 'border: none !important; height: 100% !important; width: 100% !important;' +
                                       'position: fixed !important; z-index: 2147483647 !important; top: 0px !important;' +
                                       'left: 0px !important; display: block !important; max-width: 100% !important;' +
                                       'max-height: 100% !important; padding: 0px !important ;background: rgba(39, 39, 39, 0.74) !important';

                document.body.appendChild(iframe);
            });

            sendResponse({result: "success"});
        }
        else{
            sendResponse({result: "error: iframe already exists"});
        }

    }
    else{
        sendResponse({result: "error: command unknown: " + request.command});
    }

});
