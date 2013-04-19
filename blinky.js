var Blink1 = require('node-blink1');
var blink1;


/*  Use the "Client Credentials" Auth */
var http = require('http');
var https = require('https');
var querystring = require('querystring');


var config = {
    loop_interval: 8000, // 8sec

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
        hostname: "api.netatmo.net",
        headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Content-Length": 0},
        port: 443,
        path: "/oauth2/token",
        method: "POST"
    },

    credentials: {
        "access_token": "",
        "expires_in": 0,
        "expire_in": 0,
        "scope": null,
        "refresh_token": ""
    },

    api_options: {
        hostname: "api.netatmo.net",
        headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
    },

    nextTokenRefresh: 0,    
}


var app = {
    startTime: 0,

    lastValue: 0, // holds the last value of whatever we decide to examine (i.e. Temp, Pressure, Humidity, Sound...)

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
          //console.log("statusCode: ", res.statusCode);
          //console.log("headers: ", res.headers);

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
            //console.log("statusCode: ", res.statusCode);
            //console.log("headers: ", res.headers);

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

        console.log("\nChecking to see if the access token needs to be refreshed...");

        var now = new Date();
        var now_millis = now.getTime() / 1000;

        // Note: adding 1 minute to the expires_in cutoff so we can prevent loop() from being called when the token has expired
        if(config.nextTokenRefresh > (app.startTime + config.credentials.expires_in + 60000)) {
            app.startTime = now; // update startTime to now so we can check all over again
            app.refreshToken();
        }
    },

    refreshTokenTimer: {},

    getUser: function() {

        // Set the method
        config.api_options.path = "/api/getuser?access_token=" + config.credentials.access_token;

        var req = https.request(config.api_options, function(res) {
            //console.log("statusCode: ", res.statusCode);
            //console.log("headers: ", res.headers);

            res.on('data', function(d) {
                var res = JSON.parse(d);

                //DO SOMETHING

                console.log("\n");
                //process.stdout.write(d);
            });
        });

        req.write("data\n");
        req.write("data\n");
        req.end();

        req.on('error', function(e) {
          console.error(e);
        });
    },

   getDevices: function() {
        // Set the method
        config.api_options.path = "/api/devicelist?access_token=" + config.credentials.access_token;

        var req = https.request(config.api_options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);
            console.log("\n");

            res.on('data', function(d) {
                var res = JSON.parse(d);
            
                var _id = res.body.devices[0]._id;

                /* DO SOMETHING */

                console.log("\n");

                //process.stdout.write(d);
            });
        });

        req.write("data\n");
        req.write("data\n");
        req.end();

        req.on('error', function(e) {
          console.error(e);
        });
    },

    getMeasurement: function(device_id) {
        var _this = this;

        // Set the method
        //config.api_options.path = "/api/getmeasure";
        config.api_options.path = "/api/getmeasure?access_token=" + config.credentials.access_token + "&device_id=" + device_id + "&scale=max&type=Noise&date_end=last";

        var params =  querystring.stringify({
            "access_token": config.credentials.access_token,
            "device_id": device_id,
            "scale": "max",
            "type": "Noise",
            "date_end": "last",
        });


        var req = https.request(config.api_options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);
            console.log("\n");

            res.on('data', function(d) {
                var res = JSON.parse(d);

                var val = res.body[0].value[0][0];
                if(_this.lastValue != val) {
                    _this.lastValue = val;
                    _this.setRGB();
                }

                //process.stdout.write(d);
            });
        });

        //req.write(params);
        req.write("data\n");

        req.end();

        req.on('error', function(e) {
          console.log("\n");
          console.error(e);
          console.log("\n");
        });

    },

    setRGB: function() {
        var val = this.lastValue;
        if(val < 45) {
            blink1.fadeToRGB(500, 0, 0, 255);
        } else if( val > 45 || val < 52) {
            blink1.fadeToRGB(500, 0, 255, 0);
        } else {
            blink1.fadeToRGB(500, 255, 0, 0);
        }
    },

    loop: function() {
        /* This is the loop that will get the data at the interval specified in the config object */
        var _this = this;
        setInterval(function() {
            console.log("Running...");
            //_this.getUser();
            //_this.getDevices();
            _this.getMeasurement("70:ee:50:00:71:fc");
        }, config.loop_interval);
    },

    start: function() {
        var _this = this;
        var now = new Date();
        
        this.startTime = now.getTime() / 1000; // Unix epoch

        this.getToken(function() {
            _this.refreshTokenTimer = setInterval(_this.refreshTokenCheck, 10000); // check every 10 sec
        });

        
        blink1 = new Blink1.Blink1();
        blink1.fadeToRGB(500, 255, 0, 0, function() { blink1.fadeToRGB(500, 0, 255, 0, function() { blink1.fadeToRGB(500, 9, 0, 255, function() { blink1.fadeToRGB(100, 0, 0, 0);});})})

        this.loop();
    },
}

app.start();
