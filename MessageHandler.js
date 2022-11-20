/**
 * randomChoice - randomly returns true or false value
 * @returns {boolean}
 */
function randomChoice() {
    return Math.ceil(Math.random() * 1000) % 2 === 0;
}

class MessageHandler {
    constructor(data) {
        this.data = data;
    }

    /**
     * receive - callback method for message handler
     * @param {string} message 
     */
    receive = (message) => {
        return new Promise((resolve, reject) => {
            const { name } = this.data;
            console.log(`[${name}] Message recieved: ${message}`);
            setTimeout(() => {
                if (randomChoice()) {
                    console.log(`[${name}] Message processed successfully`);
                    resolve();
                } else {
                    console.error(`[${name}] Failed to process message.`);
                    reject();
                }
            }, 1000);
        });
    };
}

module.exports = MessageHandler;
