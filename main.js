const InMemoryQueue = require("./inmemoryqueue/InMemoryQueue");
const MessageHandler = require("./MessageHandler");
const SidelineQueue = require("./sidelinequeue/SidelineQueue");

const { QUEUE_OVERFLOW_ERROR } = require("./constants");

(function main() {

    // Initialize SidelineQueue
    const sidelineQueue = new SidelineQueue();

    // Initialize message handlers with pattern
    const messageHandler1 = new MessageHandler({
        name: "messageHandler1",
        pattern: /abc/,
    });
    const messageHandler2 = new MessageHandler({
        name: "messageHandler2",
        pattern: /xyz/,
    });

    // To initialize InMemoryQueue instance with two handlers & 
    // size 4
    const inMemoryQueue = new InMemoryQueue(
        [messageHandler1, messageHandler2], // handlers
        4 // size
    );

    /**
     * _sendMessage - asynchronously send message to simulate multi-threading
     * @param {string} message
     */
    function _sendMessage(message) {
        setTimeout(() => {
            const expiryTime = +new Date() + 15000;
            inMemoryQueue.send(message, expiryTime);
        }, 0);
    }

    _sendMessage(JSON.stringify({ messageId: "abc1" }));
    _sendMessage(JSON.stringify({ messageId: "xyz2" }));
    _sendMessage(JSON.stringify({ messageId: "abc3" }));
    _sendMessage(JSON.stringify({ messageId: "xyz4" }));
    _sendMessage(JSON.stringify({ messageId: "abc5" }));

    // To catch uncaught exceptions
    process.on("uncaughtException", function ([error, message]) {
        if (error === QUEUE_OVERFLOW_ERROR) {
            console.error("Failed to send message:" + message);
            sidelineQueue.push(message);
        }
    });
})();
