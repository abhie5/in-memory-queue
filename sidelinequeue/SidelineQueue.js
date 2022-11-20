class SidelineQueue {
    constructor() {
        this.queue = [];
    }

    push = (message) => {
        console.log("Adding message to Sidequeue:" + message);
        this.queue.push(message);
    };

    shift = () => {
        return this.queue.shift();
    };
}

module.exports = SidelineQueue;
