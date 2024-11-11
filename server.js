// Import required modules
const express = require("express")
const app = express()

// Configure Express settings
app.set("view engine", "ejs")  // Set EJS as the template engine
app.use(express.urlencoded({extended: true}))  // Parse URL-encoded bodies (form data)
app.use(express.static("public"))  // Serve static files from 'public' directory

// Route handler for home page
app.get("/home", (req, res) => {
    res.render("homepage")  // Render the homepage.ejs template
})

// Route handler for login page
app.get("/login", (req, res) => {
    res.render("login")  // Render the login.ejs template
})

// Handle user registration POST request
app.post("/register", (req, res) => {
    // Validate user input and send response
    const errors = []
  
    if (typeof req.body.username !== "string") req.body.username = ""
    if (typeof req.body.password !== "string") req.body.password = ""
  
    if (!req.body.username) errors.push("You must provide a username.")
    if (req.body.username && req.body.username.length < 3) errors.push("Username must be at least 3 characters long.")
    if (req.body.username && req.body.username.length > 20) errors.push("Username must be less than 20 characters long.")
  
    if (errors.length > 0) {
      res.send({ errors: errors }) // Return errors to user
    } else {
      res.send("Thank you for signing up!") // Send happy response
    }
  })

// Start the server on port 3000
app.listen(3000)