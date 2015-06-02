/**
 * Weibo JavaScript SDK API: http://jssdk.sinaapp.com/api.php
 * Weibo API: open.weibo.com/wiki/微博API
 * Weibo API Test tool: http://open.weibo.com/tools/apitest.php
 *
 * @author  Darryl Snow
 * @email	darryl_snow@apple.com / dazsnow@gmail.com
 */
var weiboTest = {

	//- data for using the Weibo SDK
	//- be sure to change the app key if needed!
	config: {
		appKey: "3294558148",
		accessToken: "",
		currentAction: "",
		currentPost: ""
	},

	//- UI elements
	el: {
		avatar: $(".js-avatar"),
		newPost: $(".js-new-post"),
		name: $(".js-name"),
		userName: $(".js-username"),
		userID: $(".js-userid"),
		postContent: $(".js-post-content"),
		postID: $(".js-post-id"),
		postURL: $(".js-post-url"),
		searchQuery: $(".js-query"),
		searchButton: $(".js-get-post"),
		tile: $(".tile")
	},

	/**
	 * Initial Setup
	 */
	init: function() {

		credentials = weiboTest.URLToArray(decodeURIComponent(weiboTest.getCookie("weibojs_" + weiboTest.config.appKey)));

		weiboTest.config.accessToken = credentials.access_token;

		weiboTest.bindUIEvents();

	},

	getCookie: function(name) {
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2) return parts.pop().split(";").shift();
	},

	URLToArray: function(url) {
		var request = {};
		var pairs = url.substring(url.indexOf('?') + 1).split('&');
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split('=');
			request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
		}
		return request;
	},

	/**
	 * Add event listeners to buttons in the UI
	 */
	bindUIEvents: function() {

		// reset all event bindings when updating the UI
		$("*").unbind();

		// allow the search box to submit when the user presses enter
		weiboTest.el.searchQuery.on("keypress", function(e) {
			if(e.which == 13)
				weiboTest.search();
		});

		weiboTest.el.searchButton.on("click", weiboTest.search);

	},
	
	updateUI: function(result) {

		// update content
		weiboTest.el.avatar.attr("src", result.user.avatar_large);
		weiboTest.el.name.text(result.user.screen_name);
		weiboTest.el.userName.text(result.user.name);
		weiboTest.el.userID.text(result.user.id);
		weiboTest.el.postContent.text(result.text);
		weiboTest.el.postID.text(result.mid);
		weiboTest.el.postURL.text(weiboTest.el.searchQuery.val());

		// show loaded class
		weiboTest.el.tile.addClass("loaded");
	},

	/**
	 * Open a popup window. If it doesn't work, open the url in the same window.
	 * @url 	[string] The URL to be opened in the popup window
	 * @title 	[string] The title of the popup window
	 *
	 * returns window object
	 */
	openWindow: function(url, title) {

		var popup = window.open(url, title, ['toolbar=1,status=0,resizable=1,width=640,height=430,left=', (screen.width - 640) / 2, ',top=', (screen.height - 430) / 2].join(''));
		if(!popup) document.location.href = url;

		return popup;

	},

	/**
	 * Check if the user is logged in to weibo and has authorised the app.
	 *
	 * @return [boolean]
	 */
	checkLogin: function() {

		if(WB2.oauthData.access_token)
			return true;
		else
			return false;

	},

	/**
	 * The user isn't logged in so we need to open a popup window and direct them
	 * to the Weibo authorisation page. After they've logged in and authorised the app,
	 * weibo will automatically redirect them back to the callback URL ("/auth") with an
	 * access code that we can use to get an access token for the API.
	 */
	login: function() {

		weiboTest.openWindow("/login", "登录微博");

	},

	/**
	 * This function is called from the callback page in the popup window during
	 * the Oauth process. Its job is to receive and save the precious access token :)
	 *
	 * @token [string]	The access token granted by Weibo
	 */
	authorise: function(token) {

		// save the access token
		weiboTest.config.accessToken = token;

		// now we have the access token we need to re-try initialising the SDK
		// so that we can use it to perform API requests
		weiboTest.initialiseWeibo();

	},

	/**
	 * Initialise the Weibo SDK - requires the Oauth access token
	 */
	initialiseWeibo: function() {

		WB2.init({
			source: weiboTest.config.appKey,
			access_token: weiboTest.config.accessToken
		});

		//- wait for the Weibo SDK to initialise
		timer = setInterval(function(){
			if(WB2.oauthData.access_token) {

				// now we are logged in, authorised, and initialised, 
				// we can perform the original action
				weiboTest.config.currentAction();

				// clear the interval
				clearInterval(timer);
			}
		}, 500);

	},

	/**
	 * Query the API for details about the weibo based on the URL
	 * entered in the search field
	 */
	search: function() {

		weiboTest.el.tile.removeClass("loaded");

		//- only perform the search if we have valid a URL input
		if(weiboTest.el.searchQuery[0].validity.valid) {

			// check if the user is logged in / authorised
			if(weiboTest.checkLogin()) {

				//- disable the search button until search is complete
				weiboTest.el.searchButton.prop("disabled", true);

				// The last part of a Weibo URL is the MID, which is a 
				// base62 encoded version of the ID. We need to convert the
				// MID to an ID in order to lookup the Weibo with the API.
				// So we have a server-side function to do that (the client-side)
				// SDK doesn't have a function for this - I guess you could use
				// browserify to require the `weibo-mid` library...
				// Let's wait until we've got the ID then proceed...
				var searchQuery = weiboTest.el.searchQuery.val();
				var mid = searchQuery.substr(searchQuery.lastIndexOf("/") + 1);

				$.when(weiboTest.lookupID(mid)).then(
					function(status) {
						// success callback
						
						// save the Weibo ID
						var id = status.id;

						// compose the parameters we're going to send to the api
						var parameters = {
							id: id,
							source: weiboTest.config.appKey,
							access_token: weiboTest.config.accessToken
						};

						// Query the Weibo API to get the post info
						WB2.anyWhere(function(W){
							W.parseCMD(
								"/statuses/show.json",
								function(result, status) {

									//- have a geeky peek at what we get back from the server
									console.info(result);

									//- for some reason the MID for the post returned
									//- is the same as the ID so we need to change it
									result.mid = mid;

									//- update the UI
									weiboTest.updateUI(result);

									//- reenable the search button now that we've got the post info
									weiboTest.el.searchButton.prop("disabled", false);

								},
								parameters,
								{
									method: "get"
								}
							);
						});

					},
					function(status) {
						// failure callback
						console.error(status);
					},
					function(status) {
						// progress callback
						console.info(status);
					}
				);

			} else {

				// save the current action so we can get back to it later
				weiboTest.config.currentAction = weiboTest.search;

				// open the login popup
				weiboTest.login();

			}

		} else
			console.warn("Invalid input...");

	},

	/**
	 * Query the server for the ID of the post based on the MID
	 * @mid 	[String]	The MID of the Weibo post
	 *
	 * returns a promise
	 */
	lookupID: function(mid) {

		var dfd = new $.Deferred();

		$.ajax({
			type: "POST",
			url: "/getid",
			data: {
				mid: mid
			},
			beforeSend: function() {
				dfd.notify("looking up ID");
			},
			success: function(id) {
				dfd.resolve(id);
			},
			error: function(err) {
				dfd.fail(err);
			},
			complete: function() {
				dfd.notify("found ID");
			}
		});	

		return dfd.promise();

	}

}

weiboTest.init();