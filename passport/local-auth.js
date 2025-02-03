const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    var user = new User();
    user = await user.findEmail(email)

    if (user) {
        return done(null, false, req.flash('signupMessage', 'The Email is already Taken.'));
    } else {
        const newUser = new User();
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password);
        await newUser.insert()
            .then(result => console.log(result))
            .catch(error => {
              console.log(error)
              return done(null, false, req.flash('signupMessage', 'Error creating user. Please try again.'));
            });
    }
}));

passport.use('local-signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    var user = new User();
    console.log(email);
    user = await user.findEmail(email);
    if (!user) {
        return done(null, false, req.flash('signinMessage', 'No user found with that email.'));
    }
    if (!user.comparePassword(password)) {
        return done(null, false, req.flash('signinMessage', 'Incorrect Password'));
    }
    return done(null, user);
}));
