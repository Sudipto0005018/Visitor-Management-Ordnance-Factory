class SocketNotification {
    constructor(io, groups = [], event = "notification", type, data) {
        this.io = io;
        this.groups = groups;
        this.event = event;
        this.type = type;
        this.data = data;
    }

    sendNotification() {
        if (this.groups.length > 0) {
            this.io.to(this.groups).emit(this.event, { ...this.data, type: this.type });
        } else {
            this.io.emit(this.event, this.data);
        }
    }
}

module.exports = SocketNotification;
