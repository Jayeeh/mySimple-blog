// Import required modules
const cookieParser = require('cookie-parser')
require("dotenv").config()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const express = require("express")
const db = require("better-sqlite3")("ourApp.db")
db.pragma("journal_mode = WAL")

// database setup here
const createTables = db.transaction(() => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING NOT NULL UNIQUE,
    password STRING NOT NULL
    )`).run()
})

createTables()

// database setup ends here

const app = express()

// Configure Express settings
app.set("view engine", "ejs")  // Set EJS as the template engine
app.use(express.urlencoded({extended: true}))  // Parse URL-encoded bodies (form data)
app.use(express.static("public"))  // Serve static files from 'public' directory
app.use(cookieParser())

app.use(function (req, res, next) {
    res.locals.errors = []

    // try to decode
    try {
      const decoded = jwt.verify(req.cookies.ourSimpleApp, process.env.JWTSECRET)
      req.user = decoded
    } catch (err) {
      req.user = false
    }

    res.locals.user = req.user
    console.log(req.user)

    next()
})

// Route handler for home page
app.get("/home", (req, res) => {
  if (req.user) {
    return res.render("dashboard")
  }

  res.render("homepage")  // Render the homepage.ejs template
})

// Route handler for login page
app.get("/login", (req, res) => {
    res.render("login")  // Render the login.ejs template
})

app.get("/logout", (req, res) => {
  res.clearCookie("ourSimpleApp")
  res.redirect("/home")
})

app.post("/login", (req, res) => {
  let errors = []

  // Ensure username and password are strings, set to empty string if not
  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";

  if (req.body.username.trim() == "") errors = ["Invalid Username / Password."]
  if (req.body.password == "") errors = ["Invalid Username / Password."]

  if (errors.length) {
    return res.render("login", {errors})
  }

  // Original Line of Code
  // const userInQuestionStatement = db.prepare("SELECT * FROM users WHERE USERNAME = ?")
  // const userInQuestion = userInQuestionStatement.get(req.body.username)

  // Revised
  let userInQuestion;
  try {
    const userInQuestionStatement = db.prepare("SELECT * FROM users WHERE username = ?");
    userInQuestion = userInQuestionStatement.get(req.body.username);
  } catch (error) {
    errors.push("Database error. Please try again later.");
    return res.render("login", {errors});
  }


  if (!userInQuestion) {
    errors = ["Invalid Username / Password."]
    return res.render("login", {errors})
  }

  const matchOrNot = bcrypt.compareSync(req.body.password, userInQuestion.password)
  if (!matchOrNot) {
    errors = ["Invalid Username / Password."]
    return res.render("login", {errors})
  }

  // give them a cookie
  const ourTokenValue = jwt.sign({exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, userid: userInQuestion.id, username: userInQuestion.username}, process.env.JWTSECRET)

  res.cookie("ourSimpleApp", ourTokenValue, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24
  })

  res.redirect("/home")

})

// Handle user registration POST request
app.post("/register", (req, res) => {
  // Array to store validation errors
  const errors = [];

  // Ensure username and password are strings, set to empty string if not
  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";

  req.body.username = req.body.username.trim();

  // Validate username input
  if (!req.body.username) errors.push("You must provide a username."); // Username is required
  if (req.body.username && req.body.username.length < 3) errors.push("Username must be at least 3 characters long."); // Username is too short
  if (req.body.username && req.body.username.length > 20) errors.push("Username must be less than 20 characters long."); // Username is too long
  if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push("Username can only have letters and numbers.");

  // Validate password input
  if (!req.body.password) errors.push("You must provide a password."); // Password is required
  if (req.body.password && req.body.password.length < 12) errors.push("Password must be at least 12 characters long."); // Password is too short
  if (req.body.password && req.body.password.length > 70) errors.push("Password must be less than 70 characters long."); // Password is too long

  // Check for validation errors and respond accordingly
  if (errors.length) {
      return res.render("homepage", { errors });
  }

  // save the new user into a database
  const salt = bcrypt.genSaltSync(10)
  req.body.password = bcrypt.hashSync(req.body.password, salt)

  const ourStatement = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  const result = ourStatement.run(req.body.username, req.body.password);

  const lookupStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?")
  const ourUser = lookupStatement.get(result.lastInsertRowid)

  // log the user in by giving them a cookie
  const ourTokenValue = jwt.sign({exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, skyColor: "blue", userid: ourUser.id, username: ourUser.username}, process.env.JWTSECRET)

  res.cookie("ourSimpleApp", ourTokenValue, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24
  })

  res.redirect("/home")
});

 
// Start the server on port 3000
app.listen(3000)