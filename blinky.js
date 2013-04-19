var Blink1 = require('node-blink1');
var blink1;


/*  Use the "Client Credentials" Auth */
var https = require('https');
var querystring = require('querystring');


var config = {
    auth_request: {
        grant_type: "password",
        client_id: [CLIENT_ID],
        client_secret: [CLIENT_SECRET],
        username: [USERNAME],
        password: [PASSWORD]
    },

    auth_refresh: {
        grant_type: "refresh_token",
        refresh_token: "",
        client_id: [CLIENT_ID],
        client_secret: [CLIENT_SECRET],
    },

    auth_options: {
        hostname: 'api.netatmo.net',
        headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Content-Length": 0},
        port: 443,
        path: '/oauth2/token',
        method: 'POST '
    },

    credentials: {
        "access_token": "",
        "expires_in": 0,
        "expire_in": 0,
        "scope": null,
        "refresh_token": ""
    },

    nextTokenRefresh: 0,    
}


var app = {
    startTime: 0,

    getToken: function(callback) {
        var _this = this;

        console.log("Getting authorization token...");

        if(arguments.length === 0) {
            var callback = function() {};
        }

        var auth_data = querystring.stringify(config.auth_request);

        //SET THE HEADERS!!!
        config.auth_options.headers = {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Content-Length": auth_data.length};

        var req = https.request(config.auth_options, function(res) {
          console.log("statusCode: ", res.statusCode);
          console.log("headers: ", res.headers);

          res.on('data', function(d) {
            var cred_obj = JSON.parse(d);
            config.credentials.access_token = cred_obj.access_token;
            config.credentials.expires_in = cred_obj.expires_in;
            config.credentials.expire_in = cred_obj.expire_in;
            config.credentials.scope = cred_obj.scope;
            config.credentials.refresh_token = cred_obj.refresh_token;

            config.nextTokenRefresh = app.startTime + config.credentials.expires_in;

            console.log(config.credentials);
            console.log("\n");
            //process.stdout.write(d);

            callback();
          });
        });

        req.write(auth_data);
        req.end();

        req.on('error', function(e) {
          console.error(e);
        });
    },

    refreshToken: function() {
        var _this = this;
        console.log("Refreshing authorization token...");

        // Set the refresh token based on current credentials
        config.auth_refresh.refresh_token = config.credentials.refresh_token;

        var auth_data = querystring.stringify(config.auth_refresh);

        //SET THE HEADERS!!!
        config.auth_options.headers = {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Content-Length": auth_data.length};

        var req = https.request(config.auth_options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);

            res.on('data', function(d) {
                var cred_obj = JSON.parse(d);
                config.credentials.access_token = cred_obj.access_token;
                config.credentials.expires_in = cred_obj.expires_in * 1000; // convert to millis
                config.credentials.expire_in = cred_obj.expire_in * 1000; // convert to millis
                config.credentials.scope = cred_obj.scope;
                config.credentials.refresh_token = cred_obj.refresh_token;

                config.nextTokenRefresh = app.startTime + config.credentials.expires_in;

                console.log(config.credentials);
                console.log("\n");
                //process.stdout.write(d);
            });
        });

        req.write(auth_data);
        req.end();

        req.on('error', function(e) {
          console.error(e);
        });
    },

    refreshTokenCheck: function() {
        var _this = this;

        console.log("Checking to see if the access token needs to be refreshed...");

        var now = new Date();
        var now_millis = now.getTime() / 1000;
        console.log(config.nextTokenRefresh + " > " + app.startTime + config.credentials.expires_in );

        // Note: adding 1 minute to the expires_in cutoff so we can prevent loop() from being called when the token has expired
        if(config.nextTokenRefresh > (app.startTime + config.credentials.expires_in + 60000)) {
            app.startTime = now; // update startTime to now so we can check all over again
            app.refreshToken();
        }
    },

    refreshTokenTimer: {},

    init: function() {
        var _this = this;
        var now = new Date();
        
        this.startTime = now.getTime() / 1000; // Unix epoch

        this.getToken(function() {
            _this.refreshTokenTimer = setInterval(_this.refreshTokenCheck, 5000);
        });

        
        blink1 = new Blink1.Blink1();
        blink1.fadeToRGB(500, 255, 0, 0, function() { blink1.fadeToRGB(500, 0, 255, 0, function() { blink1.fadeToRGB(500, 9, 0, 255, function() { blink1.fadeToRGB(100, 0, 0, 0);});})})
    },
}


app.init();

/* This loop will check for updates and set the blink color accordingly... */
var loop = setInterval(function() {
    console.log("Running...");
}, 1000);
