// user.js (User model and authentication logic)

const bcrypt = require('bcrypt');

// Mock user data (in a real application, this would be stored in a database)
const users = [];

// User model
class User {
    constructor(username, email, password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    // Method to hash password before storing
    async hashPassword() {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }

    // Method to compare password during login
    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }
}

// Function to find a user by username
const findUserByUsername = (username) => {
    return users.find(user => user.username === username);
};

module.exports = { User, users, findUserByUsername };
