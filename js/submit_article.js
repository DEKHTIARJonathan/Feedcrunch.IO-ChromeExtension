$( document ).ready(function() {

    var endpoint   = null;
    var auth_token = null;
    var title      = null;
    var page_url   = null;

    var max_tags = 5;
    var max_suggestion_display = 5;

    var switches_list = [
        'visibility',
        'twitter',
        'facebook',
        'linkedin',
        'slack',
        'autoformat'
    ];

    try{
        chrome.runtime.sendMessage({action: "get_endpoint"}, function(response) {
            if (response.result == "success"){
                endpoint = response.endpoint;

                chrome.storage.local.get('loginToken', function(result) {
                    if (result.loginToken){
                        auth_token = result.loginToken;

                        chrome.runtime.sendMessage({action: "get_pageinfo"}, function(response) {
            		        if (response.result == "success"){

                                if (response.rss_link != null){
                                    $("#subscribe-btn").toggleClass('disabled', false);
                                }
                                else {
                                    $("#subscribe-btn").toggleClass('disabled', true);
                                }

            		            $("#title").data("init", response.title);
            		        	$("#link").data("init", response.url);

                                $.ajax({
                    	            url: endpoint + "api/1.0/authenticated/get/user/preferences/",
                    	            type: "GET",
                    	            dataType: "json",
                    	            beforeSend: function(xhr) {
                    	                xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
                    	            },
                    	            success: function(data) {
                    	                if (data.success) {
                    	                    for (switch_box in switches_list) {
                    	                        var input = $("#" + switches_list[switch_box]);

                    	                        pref_value = data.preferences[switches_list[switch_box]];

                    	                        if (pref_value == "disabled")
                    	                            input.prop("disabled", true);
                    	                        else
                    	                            input.data("init", pref_value);
                    	                    }

                        		        	init_webpage();

                    	                } else{
                        		            throw ("Impossible to obtain user preferences:" + data.error);
                                        }
                    	            }
                    	        });
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

    function init_webpage(){
    	try {
            $.ajax({
                url: endpoint + "api/1.0/authenticated/get/article/exists/",
                type: "GET",
                dataType: "json",
                data: {
                    link: $("#link").data("init"),
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
                },
                success: function(data) {
                    if (data.success) {
                        if (data.exists){
                            swal({
                                title: 'You already shared this one...',
                                type: 'info',
                                html:
                                    '<br><center>' +
                                    'Article ID: '+ data.post_data.id +'<br>' +
                                    '<a href="'+ data.post_data.link +'" target="_blank">' +
                                    data.post_data.title +
                                    '</a>' +
                                    '</center>',
                                confirmButtonColor: "#0277bd",
                                confirmButtonText: 'Oh Yeah! Thanks.',
                            })
                        }
                    } else {
                        swal({
                            title: "Something went wrong!",
                            text: data.error,
                            type: "error",
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "I'll Fix it!"
                        });
                    }
                }
            });

	        var tags = new Bloodhound({
	            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
	            queryTokenizer: Bloodhound.tokenizers.whitespace,
	            limit: max_suggestion_display,
	            prefetch: {
	                url: endpoint + "api/1.0/authenticated/get/tags/",
	                cache: false,
	                prepare: function(settings) {
	                    settings.type = "GET";
	                    settings.beforeSend = function(xhr) {
	                        xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
	                    };
	                    return settings;
	                },
	                filter: function(list) {
	                    return $.map(list.tags, function(tag) {
	                        return {
	                            name: tag
	                        };
	                    });
	                }
	            }
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
		            swal.close();
                }, function(dismiss) {
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
		                activated: $('#visibility').prop('checked'),
		                twitter: $('#twitter').prop('checked'),
		                facebook: $('#facebook').prop('checked'),
		                linkedin: $('#linkedin').prop('checked'),
		                slack: $('#slack').prop('checked'),
		                autoformat: $('#autoformat').prop('checked'),
		            },
		            beforeSend: function(xhr) {
		                xhr.setRequestHeader("Authorization", 'Token ' + auth_token);
		            },
		            success: function(data) {
		                if (data.success) {
		                    swal({
		                        title: "Good job!",
		                        text: "Article Submitted!",
		                        type: "success",
                                timer: 1500,
		                        showConfirmButton: false,
		                    }).then(function() {
                                console.log("Error: swal shouldn't return here.");
                            }, function(dismiss) {
                                // dismiss can be 'overlay', 'cancel', 'close', 'esc', 'timer'
                                if (dismiss == "timer"){
                                    swal.close();
    		                        $('#close-btn').trigger("click");
                                }
                                else {
                                    console.log("Error: incorrect dismiss call: " + dismiss);
                                }
                            });
		                } else {
		                    swal({
		                        title: "Something went wrong!",
		                        text: data.error,
		                        type: "error",
		                        confirmButtonColor: "#DD6B55",
		                        confirmButtonText: "I'll Fix it!"
		                    });
		                }
		            }
		        });
		    });

            $('#my_feed-btn').on('click', function(){
                 chrome.runtime.sendMessage({action: "open_personal_feed"}, function(response) {
                    if (response.result != "success"){
                        console.log("Response:" + response.result);
                    }
                });
                return false;
            });

           $('#admin_panel-btn').on('click', function(){
                chrome.runtime.sendMessage({action: "open_admin_panel"}, function(response) {
                   if (response.result != "success"){
                       console.log("Response:" + response.result);
                   }
               });
               return false;
           });

		    clearFields();

	    } catch (err) {
	        console.log("Error: " + err);
	        window.location = "login.html";
	    }
    }

});
