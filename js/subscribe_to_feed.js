$( document ).ready(function() {

    var endpoint   = null;
    var auth_token = null;

    try{
        chrome.runtime.sendMessage({action: "get_endpoint"}, function(response) {
            if (response.result == "success"){
                endpoint = response.endpoint;

                chrome.storage.local.get('loginToken', function(result) {
                    if (result.loginToken){
                        auth_token = result.loginToken;

                        chrome.runtime.sendMessage({action: "get_pageinfo"}, function(response) {
            		        if (response.result == "success"){
                                if (response.rss_link == null){
                                    window.location = "submit_article.html";
                                }

            		        	$("#rssfeed_link").data("init", response.rss_link);
                                $("#rssfeed_link").val(response.rss_link);
                                format_labels();

                                updateFeedTitle();

            		        }
            		        else{
            		            throw ("Impossible to obtain pageinfos:" + response.result);
            		        }
                        });
                    }
                    else{
                        throw ("User Not Logged In: loginToken does not exists!");
                    }
                });
            }
            else {
                throw ("Impossible to obtain the API endpoint.");
            }
        });
    } catch (err) {
        console.log("Error: " + err);
        window.location = "login.html";
    }

    function isUrlValid(url) {
		return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
	}

    function format_labels(){

        var link = $("#rssfeed_link").val();
        var title = $("#rssfeed_title").val();

        if (title == "")
            $("#rssfeed_title").removeClass("valid").siblings().removeClass("active");
        else
            $("#rssfeed_title").siblings().addClass("active");

        if (link == "")
            $("#rssfeed_link").removeClass("valid").siblings().removeClass("active");
        else
            $("#rssfeed_link").siblings().addClass("active");

    }

    function clearFields() {
        $("#rssfeed_title").val($("#rssfeed_title").data("init"));
        $("#rssfeed_link").val($("#rssfeed_link").data("init"));

        format_labels();
    }

    function updateFeedTitle(){
        var rss_link    = $("#rssfeed_link").val();

        var title_label = $("#rssfeed_title").siblings('label');
        var info_div    = $("#link-ajax-rslt");
        var title_div   = $("#rssfeed_title");

        if (! isUrlValid(rss_link) ){ // URL empty or not valid
            info_div.html("&emsp;");
            info_div.attr("class", "");
            $("#rssfeed_title").val("");
            format_labels();
            return false;
        }

        $.ajax({
            url : endpoint + "api/1.0/public/post/validate/rssfeed/",
            type : "POST",
            data: {
                rssfeed: rss_link,
            },
            timeout: 5000, // sets timeout to 5 seconds
            dataType : "json",
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
                info_div.text("Validating your input ...");
                info_div.attr("class", "green-text text-darken-2");
                if (title_label.hasClass( "active" )){
                    title_label.removeClass("active");
                    title_div.val("");
                }
            },
            error: function(jqXHR, textStatus){
                if(textStatus === 'timeout')
                {
                    info_div.text("Request Timeout, please try again...");
                    info_div.attr("class", "red-text text-darken-2");
                }
                format_labels();
            },
            success: function(data){
                if (data.success && data.valid) {
                    if (! title_label.hasClass( "active" ))
                        title_label.addClass("active");

                    title_div.val(data.title);

                    info_div.html("&emsp;");
                    info_div.attr("class", "");
                }
                else {
                    if (data.error == "You already subscribed to this RSS Feed"){
                        swal({
    						title: "Ooops! Not Good...",
    						text: data.error,
                            type: "error",
    						confirmButtonColor: "#DD6B55",
    						confirmButtonText: "Oh... That's cool !"
    					}).then(function() {
                            swal.close();
                            $('#return_to_submit-btn').trigger("click");
                        });
                    } else {
                        info_div.text(data.error);
                        info_div.attr("class", "red-text text-darken-2");
                    }
                }
                format_labels();
            }
        });
    }

    $('#rssfeed_link').on('paste', function (){
        setTimeout($.proxy(function () {
            $(this).blur();
        }, this), 100);
    });

    $('#rssfeed_link').on('change',function (){
        updateFeedTitle();
    });

    $("#reset").click(function() {
        swal({
            title: "Are you sure ?",
            text: "Do you really want to reset all the fields ?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, please reset!",
            cancelButtonText: "Please No!"
        }).then(function() {
            clearFields();
            updateFeedTitle();
            swal.close();
        }, function(dismiss) {
            swal.close();
        });
    });

    $("#save-btn-rssfeed").click(function() {

		var info_div     = $("#link-ajax-rslt");

		if (! isUrlValid($("#rssfeed_link").val()) ){ // URL empty or not valid
			info_div.text("Link is empty or not Valid");
			info_div.attr("class", "red-text text-darken-2");
			return false;
		}

		if ( $("#rssfeed_title").val() == "" ){ // Title empty
			info_div.text("Title is empty");
			info_div.attr("class", "red-text text-darken-2");
			return false;
		}

		$.ajax({
			url : endpoint + "api/1.0/authenticated/post/rssfeed_subscribtion/",
			type : "POST",
			data: {
                "rssfeed_link": $("#rssfeed_link").val(),
                "rssfeed_title": $("#rssfeed_title").val()
            },
			timeout: 8000, // sets timeout to 8 seconds
			dataType : "json",
			beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
				info_div.text("Verifying and subscribing to the RSS Feed ...");
				info_div.attr("class", "green-text text-darken-2");
			},
			error: function(jqXHR, textStatus){
				if(textStatus === 'timeout')
				{
					info_div.text("Request Timeout, please try again...");
					info_div.attr("class", "red-text text-darken-2");
				}
			},
			success: function(data){
				if (data.success) {
					swal({
						title: "Good job!",
						text: "RSS Feed Added with success!",
						type: "success",
						timer: 1500,
						showConfirmButton: false
					}).then(function() {
                        console.log("Error: swal shouldn't return here.");
                    }, function(dismiss) {
                        // dismiss can be 'overlay', 'cancel', 'close', 'esc', 'timer'
                        if (dismiss == "timer"){
                            swal.close();
                            $('#return_to_submit-btn').trigger("click");
                        }
                        else {
                            console.log("Error: incorrect dismiss call: " + dismiss);
                        }
                    });
				}
				else {
					swal({
						title: "Something went wrong!",
						text: data.error,
						type: "error",
						confirmButtonColor: "#DD6B55",
						confirmButtonText: "I'll retry later"
					}).then(function() {
						info_div.html("&emsp;");
						info_div.attr("class", "");
					});
				}
			}
		});
    });
});
