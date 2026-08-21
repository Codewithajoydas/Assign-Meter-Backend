const express = require("express");
const router = express.Router();

const {
    addClient,
    removeClient,
} = require("../../config/sse.config");

router.get("/", (req, res) => {

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    addClient(res);

    req.on("close", () => {
        removeClient(res);
    });
});

module.exports = router;