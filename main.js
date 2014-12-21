"use strict";

var vertx = require("vertx");
var console = require("vertx/console");

var httpServer = vertx.createHttpServer();

/**
 * @param {vertx.http.HttpServerRequest} req
 */
function webHandler(req) {
    var file = 'index.html';
    if (req.path() !== '/') {
        file = req.path();
    }
    req.response.sendFile('web/' + file);
}

httpServer.requestHandler(webHandler);

var sockServer = vertx.createSockJSServer(httpServer);
httpServer.websocketHandler(function (websocket) {
    console.log("Connected socket");
});
var sockConfig = { prefix: "/eventbus" };

sockServer.bridge(
    sockConfig,
    // inbound
    [
        {
            address: 'messages.all.send'
        },
        {
            address: 'messages.all.history'
        }
    ],
    // outbound
    [
        {
            address: 'messages.all.send'
        }
    ]
);

vertx.eventBus.registerHandler('messages.all.send', function (message) {
    var map = vertx.getMap("messages");
    var data = map.get("all");
    if (!data) {
        data = [];
    } else {
        data = JSON.parse(data);
    }
    data[data.length] = message;
    var str = JSON.stringify(data);
    map.put("all", str);
    console.log(str);
});

vertx.eventBus.registerHandler('messages.all.history', function (message, replier) {
    var data = vertx.getMap("messages").get("all");
    console.log("" + data);
    if (data) {
        replier(JSON.parse(data));
    }
    replier([]);
});

httpServer.listen(3000);
