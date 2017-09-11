$( document ).ready(function() {

    var endpoint = null;
    var title    = null;
    var page_url = null;

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

    chrome.runtime.sendMessage({action: "get_endpoint"}, function(response) {
        if (response.result == "success"){
            endpoint = response.endpoint;

            chrome.runtime.sendMessage({action: "get_pageinfo"}, function(response) {
		        if (response.result == "success"){
		            $("#title").data("init", response.title);
		        	$("#link").data("init", response.url);

		        	init_webpage();
		        }
		        else{
		            console.log("Response:" + response.result);
		        }
		    });
        }
        else{
            console.log("Response:" + response.result);
        }
    });


    function init_webpage(){
    	try {

	        if (localStorage.getItem("loginToken") === null) {
	            throw ("User Not Logged In: loginToken does not exists!");
	        }

	        $.ajax({
	            url: endpoint + "api/1.0/authenticated/get/user/preferences/",
	            type: "GET",
	            dataType: "json",
	            beforeSend: function(xhr) {
	                xhr.setRequestHeader("Authorization", 'Token ' + localStorage.getItem("loginToken"));
	            },
	            async: false,
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
	                } else
	                    console.log(data.error);
	            }
	        });

	        var tags = new Bloodhound({
	            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
	            queryTokenizer: Bloodhound.tokenizers.whitespace,
	            limit: max_suggestion_display,
	            prefetch: {
	                url: endpoint + "api/1.0/authenticated/get/tags/",
	                prepare: function(settings) {
	                    settings.type = "GET";
	                    settings.beforeSend = function(xhr) {
	                        xhr.setRequestHeader("Authorization", 'Token ' + localStorage.getItem("loginToken"));
	                    };
	                    return settings;
	                },
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
		            cancelButtonText: "Please No!",
		            closeOnConfirm: true,
		            closeOnCancel: true
		        }).then(function() {
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
		                activated: $('#visibility').prop('checked'),
		                twitter: $('#twitter').prop('checked'),
		                facebook: $('#facebook').prop('checked'),
		                linkedin: $('#linkedin').prop('checked'),
		                slack: $('#slack').prop('checked'),
		                autoformat: $('#autoformat').prop('checked'),
		            },
		            beforeSend: function(xhr) {
		                xhr.setRequestHeader("Authorization", 'Token ' + localStorage.getItem("loginToken"));
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
		                        confirmButtonText: "I'll Fix it!",
		                        closeOnConfirm: true
		                    });
		                }
		            }
		        });
		    });

		    clearFields();

	    } catch (err) {
	        console.log("Error: " + err);
	        window.location = "login.html";
	    }
    }

});
