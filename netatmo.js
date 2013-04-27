/*
 Copyright 2013 Corey Menscher

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions
 of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE.

 FYI: Netatmo is a registered trademark of Netatmo (SAS)

 */

//HTTP
var http = require('http');
var https = require('https');
var querystring = require('querystring');

var utils = require('./utils');

var DEFAULT_CONFIG = {
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
};

var Netatmo = function(start_time) {
    this.device_id = null;
    this.lastValue = 0; // holds the last value of whatever we decide to examine (i.e. Temp, Pressure, Humidity, Sound...)
    this.tokenUpdated = start_time;
    this.config = DEFAULT_CONFIG;
};

Netatmo.prototype.getToken = function(callback) {
    var _this = this;

    utils.log("Getting authorization token...");

    if(arguments.length === 0) {
        var callback = function() {};
    }

    var auth_data = querystring.stringify(_this.config.auth_request);

    //SET THE HEADERS!!!
    _this.config.auth_options.headers = {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Content-Length": auth_data.length};

    var req = https.request(this.config.auth_options, function(res) {
      //utils.log("statusCode: ", res.statusCode);
      //utils.log("headers: ", res.headers);

      res.on('data', function(d) {
        var cred_obj = JSON.parse(d);
        _this.config.credentials.access_token = cred_obj.access_token;
        _this.config.credentials.expires_in = cred_obj.expires_in;
        _this.config.credentials.expire_in = cred_obj.expire_in;
        _this.config.credentials.scope = cred_obj.scope;
        _this.config.credentials.refresh_token = cred_obj.refresh_token;
        _this.config.nextTokenRefresh = _this.tokenUpdated + _this.config.credentials.expires_in;

        utils.log("Successfully retrieved token...");
        
        callback();
      });
    });

    req.write(auth_data);
    req.end();

    req.on('error', function(e) {
      console.error(e);
    });
};

Netatmo.prototype.refreshToken = function() {
    var _this = this;
    utils.log("Refreshing authorization token...");

    // Set the refresh token based on current credentials
    _this.config.auth_refresh.refresh_token = _this.config.credentials.refresh_token;

    var auth_data = querystring.stringify(_this.config.auth_refresh);

    //SET THE HEADERS!!!
    _this.config.auth_options.headers = {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Content-Length": auth_data.length};

    var req = https.request(_this.config.auth_options, function(res) {
        //utils.log("statusCode: ", res.statusCode);
        //utils.log("headers: ", res.headers);

        res.on('data', function(d) {
            var cred_obj = JSON.parse(d);
            _this.config.credentials.access_token = cred_obj.access_token;
            _this.config.credentials.expires_in = cred_obj.expires_in * 1000; // convert to millis
            _this.config.credentials.expire_in = cred_obj.expire_in * 1000; // convert to millis
            _this.config.credentials.scope = cred_obj.scope;
            _this.config.credentials.refresh_token = cred_obj.refresh_token;

            _this.config.nextTokenRefresh = _this.tokenUpdated + config.credentials.expires_in;

            utils.log("Successfully refreshed access token...");
        });
    });

    req.write(auth_data);
    req.end();

    req.on('error', function(e) {
      console.error(e);
    });
};

Netatmo.prototype.getUser = function() {
    // Set the method
    this.config.api_options.path = "/api/getuser?access_token=" + this.config.credentials.access_token;

    var req = https.request(this.config.api_options, function(res) {
        //utils.log("statusCode: ", res.statusCode);
        //utils.log("headers: ", res.headers);

        res.on('data', function(d) {
            var res = JSON.parse(d);

            //DO SOMETHING

            //process.stdout.write(d);
        });
    });

    req.write("data\n");
    req.write("data\n");
    req.end();

    req.on('error', function(e) {
      console.error(e);
    });
};

Netatmo.prototype.getDevices = function(callback) {
    var _this = this;

    // Set the method
    _this.config.api_options.path = "/api/devicelist?access_token=" + _this.config.credentials.access_token;

    var req = https.request(_this.config.api_options, function(res) {
        //utils.log("statusCode: ", res.statusCode);
        //utils.log("headers: ", res.headers);
        //utils.log("\n");

        res.on('data', function(d) {
            var device_data = JSON.parse(d);
            callback(device_data);  
        });
    });

    req.write("data\n");
    req.write("data\n");
    req.end();

    req.on('error', function(e) {
      console.error(e);
    });
};

Netatmo.prototype.getMeasurement = function(callback) {
    var _this = this;

    // default to a basic callback if none passed
    if(arguments.length === 0) {
        var callback = function(msg) { utils.log(msg); };
    }

    // Set the method
    var measurementType = "Noise"; //see API docs for adding other measurement types
    _this.config.api_options.path = "/api/getmeasure?access_token=" + _this.config.credentials.access_token + "&device_id=" + _this.device_id + "&scale=max&type=" + measurementType + "&date_end=last";

    var params =  querystring.stringify({
        "access_token": _this.config.credentials.access_token,
        "device_id": _this.device_id,
        "scale": "max",
        "type": "Noise",
        "date_end": "last",
    });


    utils.log("Fetching data from your netatmo id: " + _this.device_id + "...");

    var req = https.request(_this.config.api_options, function(res) {
        //utils.log("statusCode: ", res.statusCode);
        //utils.log("headers: ", res.headers);
        //utils.log("\n");

        res.on('data', function(d) {
            var res = JSON.parse(d);

            if(typeof(res.error) != "undefined") {
                utils.log("ERROR! " + res.error.message + " (" + res.error.code + ")");
            } else {
                var val = res.body[0].value[0][0];
            }
            callback(val);
        });
    });

    req.write("data\n");
    req.end();

    req.on('error', function(e) {
      utils.log("\n");
      util.error(e);
      utils.log("\n");
    });
};

exports.Netatmo = Netatmo;
