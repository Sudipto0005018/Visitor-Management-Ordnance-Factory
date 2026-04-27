const { Server } = require("socket.io");
let io = null;

const init = (server) => {
    io = new Server(server, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        socket.on("joinGroup", (groupName) => {
            socket.join(groupName);
        });
        socket.on("leaveGroup", (groupName) => {
            socket.leave(groupName);
        });
        socket.on("approve-visitor", (data) => {
            io.to([`user-${data.tenant_id}`]).emit("notification", {
                visitor_id: data.visitor_id,
                type: "visitor_approved",
            });
        });
        socket.on("reject-visitor", (data) => {
            io.to([`user-${data.tenant_id}`]).emit("notification", {
                visitor_id: data.visitor_id,
                type: "visitor_rejected",
            });
        });
        socket.on("add-appointment", (data) => {
            io.to([`approver-${data.tenant_id}`, `superuser-${data.tenant_id}`]).emit(
                "notification",
                {
                    appointment_id: data.appointment_id,
                    type: "appointment_added",
                }
            );
        });
        socket.on("approve-appointment", (data) => {
            io.to([`approver-${data.tenant_id}`, `superuser-${data.tenant_id}`]).emit(
                "notification",
                {
                    appointment_id: data.appointment_id,
                    type: "appointment_approved",
                }
            );
        });
        socket.on("reject-appointment", (data) => {
            io.to([`approver-${data.tenant_id}`, `superuser-${data.tenant_id}`]).emit(
                "notification",
                {
                    appointment_id: data.appointment_id,
                    type: "appointment_rejected",
                }
            );
        });
        socket.on("disconnect", () => {});
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};

module.exports = { init, getIO };
