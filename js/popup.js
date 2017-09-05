$( document ).ready(function() {
    var endpoint = null;
    var debug = true;

    if (debug)
        /*endpoint = "http://local.feedcrunch.io:5000/";*/
        endpoint = "https://feedcrunch-dev.eu-gb.mybluemix.net/";
    else
        endpoint = "https://www.feedcrunch.io/";

    var ajaxURL = endpoint + "api/1.0/authenticated/get/tags/";
    var max_tags = 5;
    var max_suggestion_display = 5;

    var curTab = null;

    try {
        chrome.tabs.getSelected(null, function(tab){
            curTab = tab;
            callback_chromeAPI();
        });
    }
    catch(err) {
        callback_chromeAPI();
    }

    function callback_chromeAPI(){
        if (!!curTab) {
            $("#title").val(curTab.title);
            $("#link").val(curTab.url);


            $('#close-btn').on('click', function(){
                chrome.tabs.executeScript(curTab.id,
                    {code: 'document.getElementById("feedcrunch-window").remove();'}
                );
            });
        }
        else{
            $("#title").val("Debug Title");
            $("#link").val("http://www.google.fr");
        }
        $("#title").siblings().addClass("active");
        $("#link").siblings().addClass("active");
    }

    var tags = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: max_suggestion_display,
        prefetch: {
            url: ajaxURL,
            filter: function (list) {
                return $.map(list.tags, function (tag) { return { name: tag }; });
            },
            cache: false //NEW!
        }
    });

    tags.initialize();

    $("#tags").materialtags({
        maxTags                    : max_tags,
        trimValue                  : true,
        confirmKeys                : [9, 13, 32, 44, 188],
        deleteTagsOnBackspace      : false,
        deleteTagsOnDeleteKey      : false,
        MoveTagOnLeftArrow         : false,
        MoveTagOnRightArrow        : false,
        CapitalizeFirstLetterOnly  : true,
        typeaheadjs : [{
            autoselect  : true,
            highlight   : true,
        },
        {
            name        : 'tags',
            displayKey   : 'name',
            valueKey    : 'name',
            source      : tags.ttAdapter(),
        }]
    });
});
