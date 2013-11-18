/*
 * This file is part of pastyclient-browser
 * 
 * Copyright 2013 Philipp Geschke
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * 
 * Implements Pasty API version 2.1
 */
 

PastyClient = function(target){
  this.Token = {};
  this.target = target;
  this.ssl = (target.ssl === true || target.ssl === false) ? target.ssl : false;
  this.username = target.username || "";
  this.password = target.password || "";
  this.cachedClipboard = {};
};

PastyClient.prototype.__version = "0.1.0";
PastyClient.prototype.APIVERSION = "2.1.0"


/* 
 * Get the configured username
 *
 * @return {string} [username] the configured username
 * @api private
 */
PastyClient.prototype.getUsername = function() {
  return this.username;
}


/* 
 * Query the configured REST server for its version.
 *
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {object} [payload] the server version in an object.
 * @return {null}
 * @api public
 */
PastyClient.prototype.getServerVersion = function(callback) {
  target        = this.target;
  target.uri   = "/server/version";
  this.HTTPGet(target, null, function(err, answer) {
    if(err === null) {
      var payload = answer.payload;
      callback(null, payload);
    } else {
      callback(err, null);
    }
  });
}


/* 
 * Query the configured REST server for the users clipboard.
 *
 * @param {string} [user] The Pasty user's name.
 * @param {string} [password] The Pasty user's password.
 * @param {string} [token] As alternative to username/password, a valid Pasty User Token.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {array} [items] an array containing the items.
 * @return {null}
 * @api public
 */
PastyClient.prototype.listItems = function() {
  var authData = {};
  if(arguments.length >= 3) {
    authData.user = arguments[0];
    authData.password = arguments[1];
  } else {
    if(typeof(arguments[0]) !== "function") authData.token = arguments[0];
  }
  if(typeof(arguments[arguments.length-1]) !== "function") throw new Error("Last argument is not a callback function.");
  callback = arguments[arguments.length-1];
  target = this.target;
  target.uri = "/clipboard/list.json";
  this.HTTPGet(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.payload) { // Success, we should have items
        callback(null, answer.payload.items);
      } else { // No success, did not receive items
        var err = new Object();
        err.http_code = 500;
        err.message = "Did not receive items"
        callback(err, null);
      }
    } else {
      callback(err, null);
    }
  });
};


/* 
 * Query the configured REST server for a certain clipboard item
 *
 * @param {string} [id] The Object Id of the clipboard item to get.
 * @param {string} [user] The Pasty user's name.
 * @param {string} [password] The Pasty user's password.
 * @param {string} [token] As alternative to username/password, a valid Pasty User Token.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {object} the actual received item.
 * @return {null}
 * @api public
 */
PastyClient.prototype.getItem = function() {
  var authData = {};
  if(arguments.length >= 4) {
    authData.user = arguments[1];
    authData.password = arguments[2];
  } else {
    if(typeof(arguments[1]) !== "function") authData.token = arguments[1];
  }
  var id = arguments[0] || undefined;
  if(typeof(arguments[arguments.length-1]) !== "function") throw new Error("Last argument is not a callback function.");
  callback = arguments[arguments.length-1];
  target = this.target;
  target.uri = "/clipboard/item/"+id;
  var self = this;
  this.HTTPGet(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.payload) { // Success, we should have the item
        callback(null, answer.payload);
      } else { // No success, did not receive items
        callback(answer.error, null);
      }
    } else {
      callback(err, null);
    }
  });
};


/* 
 * Query the configured REST server to delete a certain item
 *
 * @param {string} [id] The Object Id of the clipboard item to delete
 * @param {string} [user] The Pasty user's name.
 * @param {string} [password] The Pasty user's password.
 * @param {string} [token] As alternative to username/password, a valid Pasty User Token.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {bool} the success of the operation.
 * @return {null}
 * @api public
 */
PastyClient.prototype.deleteItem = function() {
  var authData = {};
  if(arguments.length >= 4) {
    authData.user = arguments[1];
    authData.password = arguments[2];
  } else {
    if(typeof(arguments[1]) !== "function") authData.token = arguments[1];
  }
  var id = arguments[0] || undefined;
  if(typeof(arguments[arguments.length-1]) !== "function") throw new Error("Last argument is not a callback function.");
  callback = arguments[arguments.length-1];
  target = this.target;
  target.uri = "/clipboard/item/"+id;
  this.HTTPDelete(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.code === 200) { // Success item deleted
        callback(null, true);
      } else {
        callback(answer.error, false);
      }
    } else {
      callback(err, false);
    }
  });
};


/* 
 * Query the configured REST server to add acertain item
 *
 * @param {string} [item] The item to add to the clipboard.
 * @param {string} [user] The Pasty user's name.
 * @param {string} [password] The Pasty user's password.
 * @param {string} [token] As alternative to username/password, a valid Pasty User Token.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {int} [_id] the newly created items id.
 * @return {null}
 * @api public
 */
PastyClient.prototype.addItem = function() {
  var authData = {};
  if(arguments.length >= 4) {
    authData.user = arguments[1];
    authData.password = arguments[2];
  } else {
    authData.token = arguments[1];
  }
  var item = arguments[0] || undefined;
  if(typeof(arguments[arguments.length-1]) !== "function") throw new Error("Last argument is not a callback function.");
  callback = arguments[arguments.length-1];
   var data = {
    "item": item }
  target = this.target;
  target.uri = "/clipboard/item";
  this.HTTPPost(target, authData, data, function(err, answer) {
    if(err === null) {
      if(answer.payload) { // Success item added
        callback(null, answer.payload._id);
      } else { 
        callback(answer.error, null);
      }
    } else {
      callback(err, false);
    }
  });
};


/* 
 * Query the configured REST for a Pasty User Token to temporarily replace the login credentials.
 *
 * @param {string} [user] The username for which to get a token.
 * @param {string} [passwd] The users password.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {object} a Pasty Token Object
 * @return {null}
 * @api public
 */
PastyClient.prototype.requestToken = function(user, passwd, callback) {
  authData = new Object({'user': user, 'password': passwd });
  target = this.target;
  target.uri = "/user/token";
  var self = this;
  this.HTTPGet(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.payload) { // Success, we should have a token
        // answer.payload should be a token object
        self.Token = answer.payload;
        callback(null, answer.payload);
      } else { // No success, did not receive token
        callback(answer.error, null);
      }
    } else {
      callback(err, null);
    }
  });
};


/* 
 * Query the configured REST to verify the validity of a user token.
 *
 * @param {string} [token] a Pasty User Token
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {int} [expires] if the token is valid, the Unix Time when it will expire.
 * @return {null}
 * @api public
 */
PastyClient.prototype.checkTokenValidity = function(token, callback) {
  authData = new Object({"token": token});
  target = this.target;
  target.uri = "/user/token/validity";
  var self = this;
  this.HTTPGet(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.code === 200) { // payload should contain expire value
        if(answer.hasOwnProperty("payload")) {
          if(answer.payload.hasOwnProperty("expires")) {
            callback(null, answer.payload.expires);
            return;
          }
        }
        throw new Error("Server did not answer according to API");
      } else { 
        if(answer.hasOwnProperty(error)) {
          callback(answer.error, null);
        } else {
          err = {};
          err.http_code = 500;
          err.message = "An unknown error occured";
          callback(err,null);
        }
      }
    } else {
      callback(err, null);
    }
  });
};

/* 
 * Query the configured REST server to check if a given username is available
 *
 * @param {string} [username] The username to test.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {object} [payload] containing username and availability.
 * @return {null}
 * @api public
 */
PastyClient.prototype.checkUsernameAvailable = function(username, callback) {
  target        = this.target;
  target.uri   = "/v2.1/server/user/available?username="+username;
  this.HTTPGet(target, null, function(err, answer) {
    if(err === null) {
      var payload = answer.payload;
      callback(null, payload);
    } else {
      callback(err, null);
    }
  });
}

/* 
 * Query the configured REST for user information.
 *
 * @param {string} [user] The Pasty user's name.
 * @param {string} [password] The Pasty user's password.
 * @param {string} [token] As alternative to username/password, a valid Pasty User Token.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {object} [userInfo] the information aquired.
 * @return {null}
 * @api public
 */
PastyClient.prototype.getUser = function() {
  var authData = {};
  if(arguments.length >= 3) {
    authData.user = arguments[0];
    authData.password = arguments[1];
  } else {
    authData.token = arguments[0];
  }
  if(typeof(arguments[arguments.length-1]) !== "function") throw new Error("Last argument is not a callback function.");
  callback = arguments[arguments.length-1];
  target = this.target;
  target.uri = "/user";
  this.HTTPGet(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.code === 200) {
        callback(null, answer.payload);
      } else {
        callback(answer.error, null);
      }
    } else {
      callback(err, null);
    }
  });
};


/* 
 * Query the configured REST to update a users password.
 *
 * @param {string} [user] The username which will be updated.
 * @param {string} [uid] The users Object Id.
 * @param {string} [currPasswd] The users current password.
 * @param {string} [newPasswd] The users new password.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {bool} the success of the operation
 * @return {null}
 * @api public
 */
PastyClient.prototype.updateUserPassword = function(user, uid, currPasswd, newPasswd, callback) {
  var data = {
    "newPassword": newPasswd };
  var authData = {
    'user': user,
    'password': currPasswd };
  target = this.target;
  target.uri = "/user/"+uid;
  this.HTTPPut(target, authData, data, function(err, answer) {
    if(err === null) {
      if(answer.code === 200) {
        callback(null, true);
      } else {
        callback(answer.error, false);
      }
    } else {
      callback(err, false)
    }
  });
};


/* 
 * Query the configured REST to delete a certain user.
 *
 * @param {string} [user] The username to delete.
 * @param {string} [passwd] The users current password.
 * @param {string} [uid] The users Object Id.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {bool} the success of the operation.
 * @return {null}
 * @api public
 */
PastyClient.prototype.deleteUser = function(user, passwd, uid, callback) {
  authData = new Object({'user': user, 'password': passwd });
  target = this.target;
  target.uri = "/user/"+uid
  this.HTTPDelete(target, authData, function(err, answer) {
    if(err === null) {
      if(answer.code === 200) {
        callback(null, true);
      } else {
        callback(answer.error, false);
      }
    } else {
      callback(err, false)
    }
  });
};


/* 
 * Will send a HTTP GET request to the REST API server.
 *
 * @param {object} [target] An object containing information about the target to query.
 * @param {object} [authData] An object containing authentication data (user, passwd, token).
 * @param {function} [callback] Function that will be forwardet to PastyClient.HTTPRequest() and will
 *                              eventually receive {object} [err] Error Object and {object} a Pasty Answer Object
 * @return {null}
 * @api private
 */
PastyClient.prototype.HTTPGet = function(target, authData, callback) {
  var method = 'GET';
  var data = null;
  this.HTTPRequest(target, method, authData, data, callback);
};


/* 
 * Will send a HTTP POST request to the REST API server.
 *
 * @param {object} [target] An object containing information about the target to query.
 * @param {object} [authData] An object containing authentication data (user, passwd, token).
 * @param {object} [data] An Object that represents JSON data to be send to the server.
 * @param {function} [callback] Function that will be forwardet to PastyClient.HTTPRequest() and will
 *                              eventually receive {object} [err] Error Object and {object} a Pasty Answer Object
 * @return {null}
 * @api private
 */
PastyClient.prototype.HTTPPost = function(target, authData, data, callback) {
  var method = 'POST';
  this.HTTPRequest(target, method, authData, data, callback);
};


/* 
 * Will send a HTTP PUT request to the REST API server.
 *
 * @param {object} [target] An object containing information about the target to query.
 * @param {object} [authData] An object containing authentication data (user, passwd, token).
 * @param {object} [data] An Object that represents JSON data to be send to the server.
 * @param {function} [callback] Function that will be forwardet to PastyClient.HTTPRequest() and will
 *                              eventually receive {object} [err] Error Object and {object} a Pasty Answer Object
 * @return {null}
 * @api private
 */
PastyClient.prototype.HTTPPut = function(target, authData, data, callback) {
  var method = 'PUT';
  this.HTTPRequest(target, method, authData, data, callback);
};


/* 
 * Will send a HTTP DELETE request to the REST API server.
 *
 * @param {object} [target] An object containing information about the target to query.
 * @param {object} [authData] An object containing authentication data (user, passwd, token).
 * @param {function} [callback] Function that will be forwardet to PastyClient.HTTPRequest() and will
 *                              eventually receive {object} [err] Error Object and {object} a Pasty Answer Object
 * @return {null}
 * @api private
 */
PastyClient.prototype.HTTPDelete = function(target, authData, callback) {
  var method = 'DELETE';
  var data = null;
  this.HTTPRequest(target, method, authData, data, callback);
};


/* 
 * Will send a HTTP request to the REST API server and handle the response.
 *
 * @param {object} [target] An object containing information about the target to query.
 * @param {string} [method] The HTTP method to use (GET, POST, PUT, DELETE...).
 * @param {object} [authData] An object containing authentication data (user, passwd, token).
 * @param {object} [data] An Object that represents JSON data to be send to the server.
 * @param {function} [callback] Function that will receive {object} [err] Error Object and {object} a Pasty Answer Object
 * @return {null}
 * @api private
 */
PastyClient.prototype.HTTPRequest = function(target, method, authData, data, callback) {
  var userAgent = 'pastyclient-browser '+this.__version;
  if(authData === null) authData = {};
  if(authData.user === null || authData.user === undefined) authData.user = this.username;
  if(authData.password === null || authData.password === undefined) authData.password = this.password;
  
  if(authData.user) { // take the authdata and write it into an Basic Authentication object
    var bAuthData = "Basic " + btoa(authData.user + ":" + authData.password);
  }

  var options = {
    url: ((target.ssl) ? 'https://' : 'http://')+target.host+':'+target.port+target.uri,
    headers: {
      'Accept-Version': this.APIVERSION,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': 0,
      'User-Agent': userAgent,
      'cache': false
    }
  }
  if(bAuthData !== undefined) options.headers.Authorization = bAuthData;
  //if(authData.token !== undefined && authData.token !== null) options.headers["X-Pasty-Token"] = authData.token;
  if(method == "POST") {
    var postData = JSON.stringify(data);
    options.type = 'POST';
    options.data = postData;
  } else if(method == "PUT") {
    var postData = JSON.stringify(data);
    options.type = 'PUT';
    options.data = postData;
  } else if (method == "GET") {
    options.type = 'GET';
  } else if (method == "DELETE") {
    options.type = 'DELETE';
  }
  
  options.dataFilter = function(data, dataType) {
      return data;
    };

  /*
   * Send the HTTP Request and handle the response (res)
   */
   
  var jqxhr = $.ajax(options)
    .done(function(data, textStatus, jqxhr) {
      if(typeof(data) === "object") {
        callback(null, data);
      } else {
        try {
          answer = $.parseJSON(data);
          callback(null, answer);
        } catch (e) {
          err = { "code": "UnknownError", "message": "Invalid JSON received" };
          callback(err);
        }
      }
    })
    .fail(function(jqxhr, textStatus, err) {
      error = { "code": "UnknownError", "message": "Unknown error occured"};
      switch(err) {
        case "Unauthorized":
          error = { "code": "UnauthorizedError", "message": "Login failed"};
          break;
        default:
          console.log(err);
      }
      if(jqxhr.responseJSON != null && jqxhr.responseJSON != undefined) error = jqxhr.responseJSON;
      error.statusCode = jqxhr.status;
      callback(error, null);
    })
  
  
};

/*
 * PastyClient factory.
 *
 * @param {string} [host] The hostname of the Pasty REST API server.
 * @param {int} [port] The TCP port of the Pasty REST API server.
 * @param {string} [apiKey] A valid API key to allow user creation.
 * @return {object} A PastyClient object configured with the given parameters.
 * @api public
 */
function pastyclient(host, port, options) {
  if (typeof jQuery == 'undefined') {
    var jq = document.createElement('script'); jq.type = 'text/javascript';
    jq.src = location.protocol+'//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js';
    document.getElementsByTagName('head')[0].appendChild(jq);
  }
  options           = options || {};
  options.ssl       = options.ssl || false;
  options.username  = options.username || "";
  options.password  = options.password || "";
  var tgt = { "host": host, "port": port, "ssl": options.ssl, "username": options.username, "password": options.password };
  var pcl = new PastyClient(tgt);
  return pcl;
};

