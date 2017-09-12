$( document ).ready(function() {

    try {
        $('#close-btn').on('click', function(){
            chrome.runtime.sendMessage({action: "shutdown-iframe"}, function(response) {
                if (response.result != "success"){
                    console.log("Response:" + response.result);
                }
            });
        });

        $('#disconnect-btn').on('click', function(){
            localStorage.removeItem('loginToken');
            chrome.storage.local.remove('loginToken');
            window.location = "login.html";
        });

        $("#subscribe-btn").click(function() {
            window.location = "subscribe_to_feed.html";
        });

        $("#return_to_submit-btn").click(function() {
            window.location = "submit_article.html";
        });
    }
    catch(err) {
        console.log("error: " + err);
    }
});
