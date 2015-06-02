# Weibo Test

This app allows you to use the Weibo JavaScript SDKs to:
- authenticate using Oauth2.0
- query the API to get details about a particular Weibo post
- reply to (comment on) a weibo post
- forward (share) a weibo post
- like a weibo post
- see the exact API requests that are made

## Requirements

* A weibo account
* A weibo app
* NodeJS & NPM
* CoffeeScript (`sudo npm install -g coffee`)

## Development

* Set your hosts file to point `apple.com to localhost` for testing/development:

```
sudo echo "127.0.0.1 apple.com" >> /etc/hosts
```

If deploying to heroku (git push heroku master) then go to [https://tranquil-beyond-8910.herokuapp.com/](https://tranquil-beyond-8910.herokuapp.com/)

> NOTE: the domain you use, whether apple.com or not, has to match with the domain used in your app settings on open.weibo.com. Be sure to also change the **oauthCallbackURL** variable on **line 30** of `index.coffee` as well.

* Edit the App Key and App secret in `index.coffee` to match those for your weibo app

* Edit the App Key in `/scripts/weiboTest.js` and `/views/index-loggedin.jade`

> Note you'll also need to edit the encoded app key in `scripts/weiboTest.js`. To encode it, use the NodeJS package `weibo-mid`: `require('weibo-mid').encode(appkey)`.

* Install dependencies:

```
npm install
```

> NOTE: you'll need to comment out lines 713-729 in node_modules/weibo/lib/tapi.js - it's out of date

* Run the start command:

```
npm start
```

> NOTE: you need to use `sudo` to run the app as it's using port 80. 

* In your browser go to [http://apple.com](http://apple.com) (or whatever URL you've set in your app details on `open.weibo.com` and in the callback URL in `index.coffee`)

> NOTE: Remember to remove the line in your hosts file when you've finished! :)

## How to use it

* Try the share buttons on the demo post on the top-left of the page. Clicking the share buttons will open a login/authorisation popup if you are not already logged in to weibo and/or have not previously authorised the app. If you are already logged in /authorised, the reply and forward buttons will open a popup for you to complete the social interactions, and the like button will just register a like on the weibo post without any visual feedback. If you need to first login, then you will need to click the social buttons again to continue with the interaction.

* Enter the URL of a weibo post in the search bar at the top and then click "go" - the weibo post will appear on the bottom left of the page and the request made to the weibo API will appear on the right

* When you search for a weibo or complete a social interaction, the API request details will be shown on the top right of the page.

## Explanation

Every interaction with Sina weibo requires Oauth2.0 authorisation. So first you need to use the SDK to get the authorisation URL - you have to send the user to this URL, provinding your app key and callback URL as parameters. Weibo will then redirect the user back to your callback URL, a page on your server, along with an access code. That page (/auth auth.jade in this example) then needs to make a request to Weibo again with this access code as a parameter. The request result will be an access token that you can use for future API requests. This token should be stored in a session cookie. When the Weibo SDK is initialised on future visits to the site, it will check the cookie for the access token. The token expires after a fixed duration.

[Email me](mailto:darryl_snow@apple.com) if you have any questions