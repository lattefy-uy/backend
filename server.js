// Lattefy's Server

const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require('dotenv').config()

// Import routes
const clientsRoute = require('./routes/clients') 
const usersRoute = require('./routes/users')
const cardsRoute = require('./routes/cards')
const templatesRoute = require('./routes/templates')

const clientsAuthRoute = require('./routes/auth/client') 
const userAuthRoute = require('./routes/auth/user')


const app = express()
app.use(express.json())
app.use(cors())

// const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",")
// app.use(cors({
//     origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//     } else {
//         callback(new Error('Not allowed by CORS'))
//     }
//     }
// }))

// Disable Interest Cohort
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'interest-cohort=()')
    next()
})

// Root route for uptime check
app.get('/', (req, res) => {
    res.send('Server is running...')
})

// CLIENTS

// Clients Database connection
const clientsDb = process.env.MONGO_DB_CONNECTION_CLIENTS
const clientsConnection = mongoose.createConnection(clientsDb)

// Verify clients connection
clientsConnection
    .asPromise()
    .then(() => console.log("Clients db connected"))
    .catch(err => console.log("Clients db connection error:", err))

// Define clients routes
app.use('/auth/clients', clientsAuthRoute(clientsConnection)) 
app.use('/clients', clientsRoute(clientsConnection))

// USERS

// Users Database connection
const usersDb = process.env.MONGO_DB_CONNECTION_USERS
const usersConnection = mongoose.createConnection(usersDb)

// Verify users connection
usersConnection
    .asPromise()
    .then(() => console.log("Users db connected"))
    .catch(err => console.log("Users db connection error:", err))

// Define users routes
app.use('/auth/users', userAuthRoute(usersConnection)) 
app.use('/users', usersRoute(usersConnection))

// CARDS

const cardsDb = process.env.MONGO_DB_CONNECTION_CARDS
const cardsConnection = mongoose.createConnection(cardsDb)

// Verify cards connection
cardsConnection
    .asPromise()
    .then(() => console.log("Cards db connected"))
    .catch(err => console.log("Cards db connection error:", err))

// Define cards routes
app.use('/cards', cardsRoute(cardsConnection))

// TEMPLATES

const templatesDb = process.env.MONGO_DB_CONNECTION_TEMPLATES
const templatesConnection = mongoose.createConnection(templatesDb)

// Verify templates connection
templatesConnection
    .asPromise()
    .then(() => console.log("Templates db connected"))
    .catch(err => console.log("Templates db connection error:", err))

// Define templates routes
app.use('/templates', templatesRoute(templatesConnection))


// Start the server
const PORT = process.env.PORT || 3068
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
