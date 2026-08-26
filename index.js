const express = require("express");
const cheerio = require("cheerio");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());


// ===============================
// Initial request with the key
// /KEY/https://google.com
// ===============================

app.get("/:env/{*splat}", async (req, res) => {
    const env = req.params.env;

    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    const target = Array.isArray(req.params.splat)
        ? req.params.splat.join("/")
        : req.params.splat;

    await proxy(target, req, res, true);
});


// ===============================
// Requests after authentication
// /search?q=test
// /images/logo.png
// etc.
// ===============================

app.get("/{*path}", async (req, res) => {
    const key = req.cookies.proxy_key;
    const origin = req.cookies.proxy_origin;

    if (key !== process.env.FETCH_KEY) {
        return res.status(401).send("No valid proxy session");
    }

    if (!origin) {
        return res.status(400).send("No website selected");
    }

    // Use the saved website origin
    const target = new URL(req.originalUrl, origin).href;

    await proxy(target, req, res, false);
});


// ===============================
// Proxy function
// ===============================

async function proxy(target, req, res, setSession) {

    console.log("Target:", target);

    try {

        const response = await fetch(target);

        if (!response.ok) {
            return res
                .status(response.status)
                .send("Target returned an error");
        }

        const contentType =
            response.headers.get("content-type") || "";


        // ===============================
        // HTML
        // ===============================

        if (contentType.includes("text/html")) {

            const html = await response.text();

            const $ = cheerio.load(html);


            // -------------------------------
            // Links
            // -------------------------------

            $("a[href]").each((_, element) => {

                const href = $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        makeProxyURL(absolute)
                    );

                } catch {}
            });


            // -------------------------------
            // Images
            // -------------------------------

            $("img[src]").each((_, element) => {

                const src = $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        makeProxyURL(absolute)
                    );

                } catch {}
            });


            // -------------------------------
            // Scripts
            // -------------------------------

            $("script[src]").each((_, element) => {

                const src = $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        makeProxyURL(absolute)
                    );

                } catch {}
            });


            // -------------------------------
            // Stylesheets
            // -------------------------------

            $("link[href]").each((_, element) => {

                const href = $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        makeProxyURL(absolute)
                    );

                } catch {}
            });


            // -------------------------------
            // FORMS
            // This is the important part
            // for Google Search.
            // -------------------------------

            $("form[action]").each((_, element) => {

                const action = $(element).attr("action");

                if (!action) return;

                try {

                    const absolute =
                        new URL(action, target).href;

                    $(element).attr(
                        "action",
                        makeProxyURL(absolute)
                    );

                } catch {}
            });


            // -------------------------------
            // Save authentication
            // -------------------------------

            if (setSession) {

                const targetURL = new URL(target);

                res.cookie(
                    "proxy_key",
                    process.env.FETCH_KEY,
                    {
                        httpOnly: true,
                        secure: true,
                        sameSite: "lax"
                    }
                );

                res.cookie(
                    "proxy_origin",
                    targetURL.origin,
                    {
                        httpOnly: true,
                        secure: true,
                        sameSite: "lax"
                    }
                );
            }


            return res
                .type("html")
                .send($.html());
        }


        // ===============================
        // Non-HTML resources
        // ===============================

        const data =
            Buffer.from(await response.arrayBuffer());

        res.set("Content-Type", contentType);

        res.send(data);


    } catch (err) {

        console.error("FETCH ERROR:", err);

        res.status(500).send("Failed to fetch website");
    }
}


// ===============================
// Turn a real URL into a proxy URL
// ===============================

function makeProxyURL(url) {

    return `/${process.env.FETCH_KEY}/${url}`;
}


// ===============================

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
});
