$(document).ready(function() {
    var endpoint = null;
    var debug = true;

    if (debug)
        /*endpoint = "https://local.feedcrunch.io:5000/";*/
        endpoint = "https://feedcrunch-api-dev.eu-gb.mybluemix.net/";
    else
        endpoint = "https://feedcrunch-api-prod.eu-gb.mybluemix.net/";

    var max_tags = 5;
    var max_suggestion_display = 5;

    var switches_list = [
        'link-visible',
        'twitter',
        'facebook',
        'linkedin',
        'slack',
        'auto-format'
    ];

    var auth_token = null;

    try {
        chrome.tabs.getSelected(null, function(tab) {
            $("#title").data("init", tab.title);
            $("#link").data("init", tab.url);
            clearFields();

            $('#close-btn').on('click', function(){
                chrome.tabs.executeScript(tab.id,
                    {code: 'document.getElementById("feedcrunch-window").remove();'}
                );
            });
        });

        chrome.storage.local.get('loginToken', function(result) {
            if (result.loginToken)
                auth_token = result.loginToken;
            else
                alert("Not logged in!");
        });

        chrome.cookies.remove({url: endpoint, name: "sessionid"});

    } catch (err) {
        $("#title").data("init", "Debug Title");
        $("#link").data("init", "http://www.example.com");
        clearFields();
    }

    var tags = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: max_suggestion_display,
        prefetch: {
            url: endpoint + "api/1.0/authenticated/get/tags/",
            filter: function(list) {
                return $.map(list.tags, function(tag) {
                    return {
                        name: tag
                    };
                });
            },
            cache: false //NEW!
        }
    });

    tags.initialize();

    $("#tags").materialtags({
        maxTags: max_tags,
        trimValue: true,
        confirmKeys: [9, 13, 32, 44, 188],
        deleteTagsOnBackspace: false,
        deleteTagsOnDeleteKey: false,
        MoveTagOnLeftArrow: false,
        MoveTagOnRightArrow: false,
        CapitalizeFirstLetterOnly: true,
        typeaheadjs: [{
                autoselect: true,
                highlight: true,
            },
            {
                name: 'tags',
                displayKey: 'name',
                valueKey: 'name',
                source: tags.ttAdapter(),
            }
        ]
    });

    function clearFields() {

        var title = $("#title").data("init");
        var link = $("#link").data("init");

        $("#tags").materialtags('removeAll');

        if (title == "")
            $("#title").val('').removeClass("valid").siblings().removeClass("active");
        else
            $("#title").siblings().addClass("active");

        if (link == "")
            $("#link").val('').removeClass("valid").siblings().removeClass("active");
        else
            $("#link").siblings().addClass("active");

        $("#title").val(title);
        $("#link").val(link);

        $("#tags").materialtags('add', $("#tags").data("init"));

        for (switch_box in switches_list) {
            var input = $("#" + switches_list[switch_box]);

            if (!input.is(':disabled'))
                input.prop('checked', input.data("init"));
        }
    }

    $("#reset").click(function() {
        swal({
            title: "Are you sure ?",
            text: "Do you really want to reset all the fields ?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, please reset!",
            cancelButtonText: "Please No!",
            closeOnConfirm: true,
            closeOnCancel: true
        }, function() {
            clearFields();
            swal.close();
        });
    });

    $("#submit").click(function() {
        $.ajax({
            url: endpoint + "api/1.0/authenticated/post/article/",
            type: "POST",
            dataType: "json",
            data: {
                title: $("#title").val(),
                link: $("#link").val(),
                tags: $("#tags").val(),
                activated: $('#link-visible').prop('checked'),
                twitter: $('#twitter').prop('checked'),
                facebook: $('#facebook').prop('checked'),
                linkedin: $('#linkedin').prop('checked'),
                slack: $('#slack').prop('checked'),
                autoformat: $('#auto-format').prop('checked'),
            },
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
            },
            success: function(data) {
                if (data.success) {
                    if (data.operation == "submit article") {
                        clearFields();
                        swal({
                            title: "Good job!",
                            text: "Article Submitted!",
                            type: "success",
                            timer: 1500,
                            showConfirmButton: false,
                        });
                    } else {
                        swal({
                            title: "Article Modified!",
                            text: "Redirecting you to the edit listing in 3 seconds.",
                            type: "success",
                            timer: 3000,
                            showConfirmButton: false,
                        }, function() {
                            window.location = request_url.split("/", 5).join("/") + "/"
                            swal.close();
                        });
                    }

                } else {
                    swal({
                        title: "Something went wrong!",
                        text: data.error,
                        type: "error",
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "I'll Fix it!",
                        closeOnConfirm: true
                    });
                }
            }
        });
    });

});
