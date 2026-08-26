const express = require("express");
const cheerio = require("cheerio");

const app = express();


// Open a website:
// /KEY/?url=https://duckduckgo.com
app.get("/:env/", async (req, res) => {

    const env = req.params.env;

    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    const target = req.query.url;

    if (!target) {
        return res.status(400).send("Missing url");
    }

    await proxy(target, env, res);
});


// Everything after /KEY/ is treated as a target URL
app.get("/:env/*", async (req, res) => {

    const env = req.params.env;

    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    const path = Array.isArray(req.params[0])
        ? req.params[0].join("/")
        : req.params[0];

    const target = decodeURIComponent(path);

    await proxy(target, env, res);
});


async function proxy(target, env, res) {

    try {

        const response = await fetch(target, {
            redirect: "manual"
        });

        // Handle redirects
        if (response.status >= 300 && response.status < 400) {

            const location = response.headers.get("location");

            if (location) {

                const redirectURL =
                    new URL(location, target).href;

                return res.redirect(
                    302,
                    `/${env}/${encodeURIComponent(redirectURL)}`
                );
            }
        }


        if (!response.ok) {
            return res
                .status(response.status)
                .send("Target returned an error");
        }


        const contentType =
            response.headers.get("content-type") || "";


        // HTML
        if (contentType.includes("text/html")) {

            const html = await response.text();

            const $ = cheerio.load(html);


            // Links
            $("a[href]").each((_, element) => {

                const href = $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        `/${env}/${encodeURIComponent(absolute)}`
                    );

                } catch {}
            });


            // Forms
            $("form[action]").each((_, element) => {

                const action =
                    $(element).attr("action");

                if (!action) return;

                try {

                    const absolute =
                        new URL(action, target).href;

                    $(element).attr(
                        "action",
                        `/${env}/${encodeURIComponent(absolute)}`
                    );

                } catch {}
            });


            // Images
            $("img[src]").each((_, element) => {

                const src =
                    $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        `/${env}/${encodeURIComponent(absolute)}`
                    );

                } catch {}
            });


            // Scripts
            $("script[src]").each((_, element) => {

                const src =
                    $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        `/${env}/${encodeURIComponent(absolute)}`
                    );

                } catch {}
            });


            // CSS
            $("link[href]").each((_, element) => {

                const href =
                    $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        `/${env}/${encodeURIComponent(absolute)}`
                    );

                } catch {}
            });


            return res
                .type("html")
                .send($.html());
        }


        // Images, CSS, JS, etc.
        const data =
            Buffer.from(await response.arrayBuffer());

        res.set("Content-Type", contentType);

        res.send(data);


    } catch (err) {

        console.error("FETCH ERROR:", err);

        res.status(500).send(
            "Failed to fetch website: " + err.message
        );
    }
}


app.listen(
    process.env.PORT || 3000,
    () => console.log("Server is running")
);
