const express = require(express);
const cheerio = require(cheerio);

const app = express();

app.get("/camera/:env/{*splat}", async (req, res) => {
    const env = req.params.env;

    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send("Invalid key");
    }

    const target = req.params.splat;

    try {
        const response = await fetch(target);

        if (!response.ok) {
            return res.status(response.status).send("Target returned an error");
        }

        const html = await response.text();

        res.type("html").send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch website");
    }
});

app.listen(process.env.PORT  3000, () = {
    console.log(Server is running);
});
