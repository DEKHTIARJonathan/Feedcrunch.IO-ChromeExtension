$( document ).ready(function() {
    var endpoint = null;
    var debug = true;

    if (debug)
        /*endpoint = "https://local.feedcrunch.io:5000/";*/
        endpoint = "https://feedcrunch-api-dev.eu-gb.mybluemix.net/";
    else
        endpoint = "https://feedcrunch-api-prod.eu-gb.mybluemix.net/";

    var curTab = null;

    try {
        chrome.tabs.getSelected(null, function(tab){
            $('#close-btn').on('click', function(){
                chrome.tabs.executeScript(tab.id,
                    {code: 'document.getElementById("feedcrunch-window").remove();'}
                );
            });
        });
        chrome.cookies.remove({url: endpoint, name: "sessionid"});
    }
    catch(err) {}

    $('#signup_link').on('click', function(){
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    $.validator.addMethod(
            "regex",
            function(value, element, regexp) {
                var re = new RegExp(regexp);
                return this.optional(element) || re.test(value);
            },
            "Please check your input."
    );

    $("#login_form").validate({
          rules: {
             username: {
                required: true,
                minlength: 2,
                maxlength: 30,
                regex: "^[A-Za-z0-9]*$"
             },
             password: {
                required: true,
                minlength: 8,
                regex: "(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}"
             }
        },
        errorPlacement: function (error, element) {
            switch (element.attr("name")) {
                case "password":
                    console.log("TOP password");
                    $("#password-error").text(error.text());
                    break;
                case "username":
                    console.log("TOP username");
                    $("#username-error").text(error.text());
                    break;
                default:
                    //nothing
            }
        }
    })

    $("#btn_login").on( "click", function() {

        if(! $("#login_form").valid()) return false;

        var formData = new FormData();
        formData.append('username', $("#username").val());
        formData.append('password', $("#password").val());

        /*
        data: {
            'username': $("#username").val(),
            'password': $("#password").val()
        }
        */

        $.ajax({
            url: endpoint + "api/1.0/get_auth_token/",
            type: 'POST',
            // Fetch the stored token from localStorage and set in the header
            data: formData,
            dataType: "json",
            mimeType: "multipart/form-data",
            contentType: false,
            cache: false,
            processData:false,
            xhrFields: {
              withCredentials: false
            },
            headers: {
                 'Cache-Control': 'no-cache'
            },
            beforeSend: function(xhr) {
                /*xhr.setRequestHeader('X-CSRFToken', csrf_val);*/
                /*xhr.setRequestHeader('X-CSRFToken', 'Fiy8DD6Epge9I7geiWOMTlXZdSsZMnBlq4XOH9JDmTfnilNQcsg2kTtnvnJ0c2w2');*/
            },
            success: function(response){
                if (response.token) {
                    chrome.storage.local.set({
                            'loginToken': response.token
                        }, function() {
                            window.location = "popup.html";
                        }
                    );
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                var jsonResponse = JSON.parse(xhr.responseText);

                if (jsonResponse.non_field_errors)
                    console.log("username and password do not match.");
                else {
                    error_found = false;
                    if (jsonResponse.username) {
                        error_found = true;
                        console.log("username is missing!");
                    }

                    if (jsonResponse.password) {
                        error_found = true;
                        console.log("password is missing!");
                    }

                    if (! error_found)
                        console.log(xhr.responseText);
                }
            }
        });
        return false;
    });

});

/*
chrome.storage.local.get('loginToken', function(result) {
    if (!(result.loginToken)) {
        alert("please login with your details!!");
    }

})
*/
