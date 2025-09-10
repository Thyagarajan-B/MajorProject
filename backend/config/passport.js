import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import dotenv from "dotenv";
dotenv.config();

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID); 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:"http://localhost:4000/api/user/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you would check DB: if user exists, return user
      // else create new user and return
      const userData = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      picture: profile.photos[0].value,
    };
      return done(null, profile);
    }
  )
);

// Serialize user -> saves user info into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user -> attaches user back to req.user
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
