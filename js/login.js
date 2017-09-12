$( document ).ready(function() {

    var endpoint = null;

    chrome.runtime.sendMessage({action: "get_endpoint"}, function(response) {
        if (response.result == "success"){
            endpoint = response.endpoint;
        }
        else{
            console.log("Response:" + response.result);
        }
    });

    var curTab = null;

    $('#signup_link').on('click', function(){
         chrome.runtime.sendMessage({action: "open_signup_tab"}, function(response) {
            if (response.result != "success"){
                console.log("Response:" + response.result);
            }
        });
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

        $.ajax({
            url: endpoint + "api/1.0/get_auth_token/",
            type: 'POST',
            data: {
                'username': $("#username").val(),
                'password': $("#password").val()
            },
            dataType: "json",
            cache: false,
            success: function(response){
                if (response.token) {
                    chrome.storage.local.set({
                            'loginToken': response.token
                        }, function() {
                            localStorage.setItem("loginToken", response.token);
                            window.location = "submit_article.html";
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

                    if (!error_found)
                        console.log(xhr.responseText);
                }
            }
        });
        return false;
    });

});
