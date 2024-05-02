/* eslint-disable no-unused-vars */
import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { ruruHTML } from "ruru/server";
import morgan from "morgan";
import { create } from "express-handlebars";
import { marked } from "marked";
import * as cheerio from "cheerio";
import fs from "fs";

import schema from "./graphql/schemas";
import { myCustomformat } from "./morgan";
import vtuber_routes from "./routes/vtuber.routes";
import hashtag_routes from "./routes/hashtag.routes";
import social_routes from "./routes/social.routes";

const app = express();
const hbs = create({});
const port = 3000;

function getHeaders(data) {
	const headers = [];
	const lines = data.split("\n");

	lines.forEach((line) => {
		if (line.startsWith("#")) {
			const header = line.replace(/#/g, "").trim();
			const id = header.toLowerCase().replace(/[^\w]+/g, "-");
			headers.push({ text: header, id: id });
		}
	});
	return headers;
}

/** ## Server initializer
 * This function is responsible for running the Express.js server. You can configure routes, and middlewares,
 * whether to create a CRUD system, track the routes you visit, configure request bodies, etc.
 * ---
 * This function will display an error message if the server fails to run, or mongoose initialization fails.
 * @returns {Promise<void>} */
async function init_server() {
	app.use(morgan(myCustomformat));
	app.use(express.static("./public"));
	app.engine("handlebars", hbs.engine);
	app.set("view engine", "handlebars");
	app.set("views", "./views");

	app.all("/api/graphql", createHandler({ schema })); // Implement GraphQL handler
	app.use("/api/hashtag", hashtag_routes);
	app.use("/api/social", social_routes);
	app.use("/api/vtuber", vtuber_routes);

	app.get("/gql", (_req, res) => {
		res.type("html");
		res.end(
			ruruHTML({
				endpoint: "/api/graphql",
			}),
		);
	});
	app.get("/", (_req, res) => {
		return res.render("index", { title: "IdolAPI" });
	});

	app.get("/docs", (_req, res) => {
		const markdown = fs.readFileSync("./views/markdown/documentation.mdx", "utf-8");
		const html = marked(markdown);
		const headers = getHeaders(markdown);
		return res.render("docs", { title: "Documentation | IdolAPI", docs: html, headers });
	});

	app.get("/about", (_req, res) => {
		const markdown = fs.readFileSync("./views/markdown/about.mdx", "utf-8");
		const html = marked(markdown);
		return res.render("about", { title: "About this project | IdolAPI", docs: html });
	});
	app.get("/support", (_req, res) => {
		const markdown = fs.readFileSync("./views/markdown/support.mdx", "utf-8");
		const html = marked(markdown);
		return res.render("support", { title: "Support us | IdolAPI", docs: html });
	});

	app.use((req, res, next) => {
		return res.status(404).render("notfound", { title: "Page not found!" });
	});
	app.listen(port, () => {
		console.log(`\n Server listening on http://localhost:${port}\n`);
	});
}

init_server();

process.on("SIGINT", () => {
	console.log(" Server terminated!");
	process.exit(0);
});

export default app;
