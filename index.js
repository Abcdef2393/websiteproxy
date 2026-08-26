const express = require("express");
const cheerio = require("cheerio");

const app = express();


// =====================================
// /KEY/https://example.com
// =====================================

app.get("/:env/{*splat}", async (req, res) => {

    const env = req.params.env;

    // Check key
    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    // Rebuild target URL
    const target = Array.isArray(req.params.splat)
        ? req.params.splat.join("/")
        : req.params.splat;

    await proxy(target, env, res);
});


// =====================================
// Proxy
// =====================================

async function proxy(target, env, res) {

    console.log("Target:", target);

    try {

        const response = await fetch(target, {
            redirect: "manual"
        });


        // =================================
        // Handle redirects
        // =================================

        if (
            response.status >= 300 &&
            response.status < 400
        ) {

            const location =
                response.headers.get("location");

            if (location) {

                const redirectURL =
                    new URL(location, target).href;

                return res.redirect(
                    302,
                    makeProxyURL(env, redirectURL)
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


        // =================================
        // HTML
        // =================================

        if (contentType.includes("text/html")) {

            const html = await response.text();

            const $ = cheerio.load(html);


            // ---------------------------------
            // Links
            // ---------------------------------

            $("a[href]").each((_, element) => {

                const href =
                    $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        makeProxyURL(env, absolute)
                    );

                } catch {}
            });


            // ---------------------------------
            // Forms
            // ---------------------------------

            $("form[action]").each((_, element) => {

                const action =
                    $(element).attr("action");

                if (!action) return;

                try {

                    const absolute =
                        new URL(action, target).href;

                    $(element).attr(
                        "action",
                        makeProxyURL(env, absolute)
                    );

                } catch {}
            });


            // ---------------------------------
            // Images
            // ---------------------------------

            $("img[src]").each((_, element) => {

                const src =
                    $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        makeProxyURL(env, absolute)
                    );

                } catch {}
            });


            // ---------------------------------
            // Scripts
            // ---------------------------------

            $("script[src]").each((_, element) => {

                const src =
                    $(element).attr("src");

                if (!src) return;

                try {

                    const absolute =
                        new URL(src, target).href;

                    $(element).attr(
                        "src",
                        makeProxyURL(env, absolute)
                    );

                } catch {}
            });


            // ---------------------------------
            // Stylesheets
            // ---------------------------------

            $("link[href]").each((_, element) => {

                const href =
                    $(element).attr("href");

                if (!href) return;

                try {

                    const absolute =
                        new URL(href, target).href;

                    $(element).attr(
                        "href",
                        makeProxyURL(env, absolute)
                    );

                } catch {}
            });


            return res
                .type("html")
                .send($.html());
        }


        // =================================
        // Images / JS / CSS / .data / etc.
        // =================================

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


// =====================================
// Create proxy URL
// =====================================

function makeProxyURL(env, url) {

    return `/${env}/${url}`;
}


// =====================================

app.listen(
    process.env.PORT || 3000,
    () => {
        console.log("Server is running");
    }
);
