require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { MongoClient } = require("mongodb");

class PokedexServer {
	constructor() {
		this.app = express();
		this.port = process.env.PORT || 3001;
		this.connectionString = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@pokedexapp.w2dwchr.mongodb.net/?retryWrites=true&w=majority&appName=PokedexApp`;
		this.client = new MongoClient(this.connectionString);
		this.connect = null;

		// Middleware
		this.app.use(cors());
		this.app.use(helmet());
		this.app.use(express.json());
		this.app.use(express.static(path.join(__dirname, "../public")));

		this.setupRoutes();
	}

	async connectToDB(collectionName) {
		try {
			this.connect = await this.client.connect();
			let db = await this.connect.db(process.env.MONGODB_DB);
			let collection = await db.collection(collectionName);
			return collection;
		} catch (e) {
			console.error(e);
		}
	}

	start() {
		this.app.listen(this.port, () => {
			console.log(`Server running on port ${this.port}`);
		});
	}

	setupRoutes() {
		const app = this.app;

		app.get("/api/v1/pokemon/all", async (req, res) => {
			try {
				let collection = await this.connectToDB("pokemon");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let filters = {};
				if (Object.hasOwn(req.query, "type")) {
					filters.types = req.query.type;
				}
				if (Object.hasOwn(req.query, "gen")) {
					filters.generationId = parseInt(req.query.gen);
				}
				if (Object.hasOwn(req.query, "name")) {
					filters.name = { $regex: req.query.name, $options: "i" };
				}
				if (Object.hasOwn(req.query, "id")) {
					filters._id = parseInt(req.query.id);
				}
				if (Object.hasOwn(req.query, "isLegendary")) {
					filters.isLegendary = req.query.isLegendary === "true";
				}
				if (Object.hasOwn(req.query, "isMythical")) {
					filters.isMythical = req.query.isMythical === "true";
				}

				if (
					Object.hasOwn(req.query, "page") &&
					Object.hasOwn(req.query, "limit")
				) {
					if (req.query.page < 0 || req.query.limit < 0) {
						return res
							.status(400)
							.send("Page and limit must be greater than 0");
					}
					if (req.query.page >= 0 && req.query.limit >= 0) {
						let page = parseInt(req.query.page) + 1;
						let limit = parseInt(req.query.limit);
						let skip = (page - 1) * limit;

						let results = await collection
							.find({
								...filters,
							})
							.skip(skip)
							.limit(limit)
							.sort({
								_id: req.query.sort?.toLowerCase() === "desc" ? -1 : 1,
							})
							.toArray();
						return res.status(200).json(results);
					}
				}

				let results = await collection
					.find({
						...filters,
					})
					.limit(parseInt(req.query.limit) || 0)
					.sort({
						_id: req.query.sort?.toLowerCase() === "desc" ? -1 : 1,
					})
					.toArray();
				res.status(200).json(results);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		app.get("/api/v1/pokemon/search=:search", async (req, res) => {
			try {
				let collection = await this.connectToDB("pokemon");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let results = await collection
					.aggregate([
						{
							$search: {
								index: "default",
								text: {
									query: req.params.search,
									path: {
										wildcard: "*",
									},
								},
							},
						},
					])
					.toArray();
				res.status(200).json(results);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		app.get("/api/v1/pokemon/id/:id", async (req, res) => {
			try {
				let collection = await this.connectToDB("pokemon");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let result = await collection.findOne({
					_id: parseInt(req.params.id),
				});
				res.status(200).json(result);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		app.get("/api/v1/pokemon/name/:name", async (req, res) => {
			try {
				let collection = await this.connectToDB("pokemon");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let result = await collection.findOne({
					name: req.params.name,
				});
				res.status(200).json(result);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		app.get("/api/v1/pokemon/type/:type", async (req, res) => {
			try {
				let collection = await this.connectToDB("pokemon");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let results = await collection
					.find({
						types: req.params.type,
					})
					.toArray();
				res.status(200).json(results);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		app.get("/api/v1/pokemon/gen/:number", async (req, res) => {
			try {
				let collection = await this.connectToDB("pokemon");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let results = await collection
					.find({ generationId: parseInt(req.params.number) })
					.toArray();
				res.status(200).json(results);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		app.get("/api/v1/pokemon/teams", async (req, res) => {
			try {
				let collection = await this.connectToDB("teams");
				console.log("Connected to MongoDB", collection.collectionName);

				if (!collection) {
					return res.status(500).send("Database connection failed");
				}

				let results = await collection
					.aggregate([
						{
							$match: {
								userId: 1,
							},
						},
						{
							$unwind: "$pokemon",
						},
						{
							$lookup: {
								from: "pokemon",
								let: {
									teamPokemonId: "$pokemon",
								},
								pipeline: [
									{
										$match: {
											$expr: {
												$eq: ["$_id", "$$teamPokemonId"],
											},
										},
									},
								],
								as: "pokemon",
							},
						},
						{
							$group: {
								_id: "$_id",
								pokemon: {
									$push: {
										$first: "$pokemon",
									},
								},
								name: {
									$addToSet: "$name",
								},
								createdDate: {
									$addToSet: "$createdDate",
								},
								updatedDate: {
									$addToSet: "$updatedDate",
								},
							},
						},
						{
							$project: {
								_id: 1,
								pokemon: 1,
								name: {
									$arrayElemAt: ["$name", 0],
								},
								createdDate: {
									$arrayElemAt: ["$createdDate", 0],
								},
								updatedDate: {
									$arrayElemAt: ["$updatedDate", 0],
								},
							},
						},
						{
							$sort: {
								name: 1,
							},
						},
					])
					.toArray();
				res.status(200).json(results);
			} catch (e) {
				console.error(e);
				res.status(500).send("Internal Server Error");
			}
		});

		// catch-all route
		app.all("/{*any}", (req, res) =>
			res.status(404).send("API endpoint not found"),
		);
	}
}

// Start the server
const server = new PokedexServer();
server.start();
