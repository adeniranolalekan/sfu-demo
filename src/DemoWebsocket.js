export default class DemoWebsocket{

    constructor(userId,onMessage) {
        console.log('user id is'+userId)
        this.socket= new WebSocket(
            `wss://fhj0m0aeug.execute-api.eu-central-1.amazonaws.com/sfu?id=${userId}`
        );
        this.socket.onopen =this.onopen
        this.socket.onclose= () => {
            console.log('DISCONNECTED');
        };
        this.userId=userId
        this.socket.onmessage = onMessage
    }
    onopen() {
        console.log('CONNECTED');
    };
    sendEvent (value) {


      //  this.waitForConnection(function () {
            this.socket.send(JSON.stringify(value));

     //   }, 1000);

    };
    waitForConnection = function (callback, interval) {
        if (this.socket.readyState === 1) {
            callback();
        } else {
            var that = this;
            // optional: implement backoff for interval here
            setTimeout(function () {
                that.waitForConnection(callback, interval);
            }, interval);
        }
    };

}
