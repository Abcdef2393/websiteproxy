const express = require("express");

const app = express();

app.get("/:env/{*splat}", async (req, res) => {
    const env = req.params.env;

    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    const target = Array.isArray(req.params.splat)
        ? req.params.splat.join("/")
        : req.params.splat;

    console.log("Target:", target);

    try {
        const response = await fetch(target);

        if (!response.ok) {
            return res.status(response.status).send("Target returned an error");
        }

        const html = await response.text();

        res.type("html").send(html);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).send("Failed to fetch website");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
});
