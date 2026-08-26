const express = require("express");
const cheerio = require("cheerio");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

app.get("/:env/{*splat}", async (req, res) => {
    const env = req.params.env;

    // Accept either the key in the URL or the key stored in the cookie
    if (
        env !== process.env.FETCH_KEY &&
        req.cookies.proxy_key !== process.env.FETCH_KEY
    ) {
        return res.status(401).send("Invalid key");
    }

    // If the correct key was supplied in the URL,
    // store it in a cookie for future requests.
    if (env === process.env.FETCH_KEY) {
        res.cookie("proxy_key", process.env.FETCH_KEY, {
            httpOnly: true,
            secure: true,
            sameSite: "lax"
        });
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

        const $ = cheerio.load(html);

        $("a[href]").each((_, element) => {
            const href = $(element).attr("href");

            if (!href) return;

            try {
                const absolute = new URL(href, target).href;

                $(element).attr(
                    "href",
                    `/${env}/${absolute}`
                );
            } catch {}
        });

        res.type("html").send($.html());

    } catch (err) {
        console.error("FETCH ERROR:", err);
        res.status(500).send("Failed to fetch website");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
});
