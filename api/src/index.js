const express = require("express");
const helmet = require("helmet");
const pokeapiProxy = require("./pokeapiProxy");

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(express.json());
app.use("/pokeapi", pokeapiProxy);

// catch-all route
app.all("/{*any}", (_req, res) =>
    res.status(404).send("API endpoint not found")
);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
