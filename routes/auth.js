var express = require('express')
var passport = require('passport')
var LocalStrategy = require('passport-local')
const path = require('path')
const fs = require('fs')

var router = express.Router()

// Setting Passport to use the LOCAL strategy
passport.use(new LocalStrategy(function verify(username, password, cb) {
    let usersArray = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/users.json")))
    let filteredArray = usersArray.filter(x => x.username == username)
    if (filteredArray.length > 0) {
        let usersData = filteredArray[0]
        if (usersData.password == password) {
            return cb(null, usersData)
        }
    }
    else {
        return cb(null, false)
    }
}))

// Serialize and Deserialize users
passport.serializeUser((user, callback) => {
    callback(null, user)
})

passport.deserializeUser((user, callback) => {
    const userId = user ? user.username : ''
    callback(null, userId)
})

// routes to /login
router.get('/', (req, res) => {
    const currentUser = req.user ? req.user : undefined
    res.render('login', { currentUser })
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect('/')
    })
})

router.get('/signup', (req, res) => {
    const currentUser = req.user ? req.user : undefined
    res.render('signup', { currentUser })
})

router.post('/', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}), (req, res) => {
    req.session.currentUser = req.user
    res.redirect('/')
})

router.post('/signup', (req, res) => {
    const { username, password, confirmPassword } = req.body

    try {
        const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'))
        const existingUser = users.find(u => u.username === username)

        if (existingUser) {
            res.send('<script>alert("User already exists"); window.location.href="/login";</script>')
            return
        }

        const newUser = { username, password }
        users.push(newUser)
        fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2))
        res.redirect('/login')
    } catch (err) {
        res.redirect('/login/signup')
    }
})

module.exports = router // wired up to /login