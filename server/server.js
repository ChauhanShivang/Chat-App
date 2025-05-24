import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js"
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import {Server} from "socket.io"

// create express app using HTTP server
const app = express()
const server = http.createServer(app)

// initialize socket.io server
export const io = new Server(server, {
    cors: {origin: "http://localhost:5173", methods: ['GET', 'POST'], credentials: true,}
})

// store online users
export const userSocketMap = {}  // {userid: socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId
    
    if(userId)
        userSocketMap[userId] = socket.id

    // emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    socket.on("disconnect", () => {
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}))
app.use(cors())    // for backend connection

// Route Setup
app.use("/api/status", (req, res) => res.send("Server is Live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

// connect to mongoDB
await connectDB()

const port = process.env.PORT || 4000       
server.listen(port, () => console.log("Server is Running on PORT : " + port))