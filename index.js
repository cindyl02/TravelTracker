import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, 
  database: process.env.DB_NAME,
  password: process.env.DB_PW,
  port: 5432
})

db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT * FROM visited_countries");
  let countries = [];

  result.rows.forEach((country) => {
        countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisited();
  console.log(countries)
  res.render("index.ejs", { countries: countries, total: countries.length });
});

app.post("/add", async(req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [req.body["country"].toLowerCase()]);
  
    const data = result.rows[0];
    const country_code = data.country_code;
    try {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [country_code]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", { error: "Country has already been added, try again.", countries: countries, total: countries.length});
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index.ejs", { error: "Country name does not exist, try again.", countries: countries, total: countries.length});
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
