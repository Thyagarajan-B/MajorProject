import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/user/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you would check DB: if user exists, return user
      // else create new user and return
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
