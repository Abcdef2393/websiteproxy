const express = require("express");
const cheerio = require("cheerio");

const app = express();


// ========================================
// Main proxy route
// /KEY/?url=https://duckduckgo.com/
// ========================================

app.get("/:env/", async (req, res) => {

    const env = req.params.env;

    // Check key
    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    const target = req.query.url;

    if (!target) {
        return res.status(400).send("Missing url");
    }

    await proxy(target, env, res);
});


// ========================================
// Proxy
// ========================================

async function proxy(target, env, res) {

    console.log("Target:", target);

    try {

        const response = await fetch(target, {
            redirect: "manual"
        });


        // ========================================
        // HTTP redirects
        // ========================================

        if (response.status >= 300 && response.status < 400) {

            const location =
                response.headers.get("location");

            if (location) {

                const absolute =
                    new URL(location, target).href;

                return res.redirect(
                    302,
                    proxyURL(env, absolute)
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


        // ========================================
        // HTML
        // ========================================

        if (contentType.includes("text/html")) {

            const html = await response.text();

            const $ = cheerio.load(html);


            // ------------------------------
            // Links
            // ------------------------------

            $("a[href]").each((_, element) => {

                const href = $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        proxyURL(env, absolute)
                    );

                } catch {}
            });


            // ------------------------------
            // Forms
            // ------------------------------

            $("form").each((_, element) => {

                const action =
                    $(element).attr("action") || target;

                try {

                    const absolute =
                        new URL(action, target).href;

                    $(element).attr(
                        "action",
                        proxyURL(env, absolute)
                    );

                } catch {}
            });


            // ------------------------------
            // Images
            // ------------------------------

            $("img[src]").each((_, element) => {

                const src =
                    $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        proxyURL(env, absolute)
                    );

                } catch {}
            });


            // ------------------------------
            // Scripts
            // ------------------------------

            $("script[src]").each((_, element) => {

                const src =
                    $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        proxyURL(env, absolute)
                    );

                } catch {}
            });


            // ------------------------------
            // CSS
            // ------------------------------

            $("link[href]").each((_, element) => {

                const href =
                    $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        proxyURL(env, absolute)
                    );

                } catch {}
            });


            return res
                .type("html")
                .send($.html());
        }


        // ========================================
        // Images / JS / CSS / other files
        // ========================================

        const data =
            Buffer.from(
                await response.arrayBuffer()
            );

        res.set(
            "Content-Type",
            contentType
        );

        res.send(data);


    } catch (err) {

        console.error("FETCH ERROR:", err);

        res
            .status(500)
            .send("Failed to fetch website");
    }
}


// ========================================
// Make every URL stay inside the proxy
// ========================================

function proxyURL(env, target) {

    return `/${env}/?url=${encodeURIComponent(target)}`;
}


// ========================================

app.listen(
    process.env.PORT || 3000,
    () => {
        console.log("Server is running");
    }
);
