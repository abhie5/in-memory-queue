const { polling } = require("../utils/polling");

const { QUEUE_OVERFLOW_ERROR } = require("../constants");
const MAX_RETRY_COUNT = 3;

class InMemoryQueue {
    /**
     * constructor
     * @param {MessageHandler[]} handlers - list of handlers to consume message
     * @param {number} size maximum capacity of queue
     */
    constructor(handlers, size) {
        this.handlers = handlers;
        this.size = size;
        this.queue = [];

        polling(this.poll, 2);
    }

    /**
     * send - adds message to queue
     *
     * @param {string} message - data to be added to queue
     * @param {number} pendingRetries - available retry count if failed to send message
     */
    send = (message, expiryTime, pendingRetries = 3) => {
        if (this.size > this.queue.length) {
            this.queue.push(
                JSON.stringify({
                    locked: false,
                    expiryTime: expiryTime,
                    message: JSON.parse(message),
                })
            );
            console.log("Message added to queue successfully");
        } else {
            if (pendingRetries > 0) {
                console.error(
                    "Unable to send message. Error: Size limit exceeded."
                );
                setTimeout(() => {
                    console.log(
                        "Retry attempt:" +
                            (MAX_RETRY_COUNT - pendingRetries + 1)
                    );
                    this.send(message, expiryTime, pendingRetries - 1);
                }, 2000);
            } else {
                throw [QUEUE_OVERFLOW_ERROR, message];
            }
        }
    };

    /**
     * poll - polling method to read queue and publish messages
     */
    poll = () => {
        // To find first message in queue that is not locked
        const messageIndex = this.queue.findIndex(m => !JSON.parse(m).locked);

        if (messageIndex >= 0) {
            const parsedMessage = JSON.parse(this.queue[messageIndex]);

            // check if message is expired
            if (parsedMessage.expiryTime < +new Date()) {
                console.log(
                    "Message expired. Message:" + this.queue[messageIndex]
                );
                // Remove expired message from queue
                this.queue.splice(messageIndex, 1);
                return;
            }

            // pick first handler
            const handler = this.handlers.shift();

            // to ignore handler if current message does not match it's pattern
            if (
                handler.data.pattern &&
                !handler.data.pattern.test(this.queue[messageIndex])
            ) {
                this.handlers.push(handler);
                return;
            }

            // lock message
            console.log("Locking message. Message index:" + messageIndex);
            this.queue[messageIndex] = JSON.stringify({
                ...parsedMessage,
                locked: true,
            });

            this.publish(handler, messageIndex);
        }
    };

    /**
     * publish - to send message to consumer handler
     * @param {MessageHandler} handler - message handler module with 'receive' method
     * @param {number} messageIndex - index of message in queue
     * @param {number} pendingRetries - available retry count if failed to send message
     */
    publish = (handler, messageIndex, pendingRetries = 3) => {
        handler
            .receive(this.queue[messageIndex])
            .then(() => {
                // message successfully processed
                // remove message from queue
                this.queue.splice(messageIndex, 1);
            })
            .catch(() => {
                // handler failed to process message, retry
                if (pendingRetries > 0) {
                    console.error("Consumer is unable to process message.");
                    console.log(
                        "Retry attempt:" +
                            (MAX_RETRY_COUNT - pendingRetries + 1)
                    );
                    this.publish(handler, messageIndex, pendingRetries - 1);
                } else {
                    console.error("Consumer failed to process message.");

                    // unlock message
                    console.log(
                        "Removing lock of message. Message index:" +
                            messageIndex
                    );
                    this.queue[messageIndex] = JSON.stringify({
                        ...JSON.parse(this.queue[messageIndex]),
                        locked: false,
                    });
                }
            })
            .finally(() => {
                // add handler back to handlers list for future use
                this.handlers.push(handler);
            });
    };
}

module.exports = InMemoryQueue;
