const express = require(express);
const cheerio = require(cheerio);

const app = express();

app.get(cameraenv, async (req, res) = {
    const env = req.params.env;

    if (env !== process.env.FETCH_KEY) {
        return res.status(401).send(Invalid key);
    }

    const target = req.params[0];

    try {
        const response = await fetch(target);

        if (!response.ok) {
            return res.status(response.status).send(Target returned an error);
        }

        const html = await response.text();

        const $ = cheerio.load(html);

         Rewrite resources
        $(script[src], img[src], link[href], iframe[src]).each(
            (_, element) = {
                const attr = element.tagName === link  href  src;
                const value = $(element).attr(attr);

                if (!value) return;

                const absolute = new URL(value, target).href;

                $(element).attr(
                    attr,
                    `camera${env}${absolute}`
                );
            }
        );

        res.type(html).send($.html());

    } catch (err) {
        console.error(err);
        res.status(500).send(Failed to fetch website);
    }
});

app.listen(process.env.PORT  3000, () = {
    console.log(Server is running);
});