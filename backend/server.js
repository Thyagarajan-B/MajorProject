import express from "express"
import cors from 'cors'
import 'dotenv/config'
import expressSession from "express-session"
import passport from "passport"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import "./config/passport.js"
import MongoStore from "connect-mongo"

// app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()


app.use(
  expressSession({
    secret: process.env.EXPRESS_SECRET, // required!
    resave: false,       // don't save session if unmodified
    saveUninitialized: false, // only save if something stored
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }), // optional
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());
// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

app.listen(port, () => console.log(`Server started on PORT:${port}`))