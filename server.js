const express = require("express")
const app = express()

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))

app.get("/home", (req, res) => {
    res.render("homepage")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/register", (req, res) => {
    console.log(req.body)
    res.send("Thank you for signing up!")
})

app.listen(3000)