/**
 * polling
 *
 * @param {function} handler - function to be called through polling
 * @param {interval} interval - time interval in seconds
 */
const polling = (handler, interval) => {
    setInterval(handler, interval * 1000);
};

module.exports = { polling };
