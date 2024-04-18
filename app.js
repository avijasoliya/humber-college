// ITE5315 – Project
// I declare that this assignment is my own work in accordance with Humber Academic Policy. No part of this assignment has been copied manually or electronically from any other source (including web sites) or distributed to other students.
// Name: Avi Mukeshbhai Jasoliya
// Student ID: N01579467
// Date: 12/04/2024


const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { connect, getAllRestaurants, getRestaurantById, addNewRestaurant, updateRestaurantById, deleteRestaurantById } = require('./db');
const handlebars = require("handlebars");
const fs = require("fs");
const path = require('path');
const bcrypt = require('bcrypt');
const { saveUser } = require('./db');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const secretKey = process.env.JWT_SECRET;
const app = express(); // Initialize express app here
const port = process.env.PORT || 3000;


// Middleware to parse JSON and form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files (CSS, images, etc.)
app.use(express.static('public'));

app.set("view engine", "handlebars");
app.set('views', path.join(__dirname, 'views')); // Set views directory here

// Handlebars engine setup
app.engine("handlebars", function (filePath, options, callback) {
    fs.readFile(filePath, function (err, content) {
        if (err) {
            return callback(err);
        }
        const rendered = handlebars.compile(content.toString())(options);
        return callback(null, rendered);
    });
});

(async () => {
  try {
      await connect();
      console.log('Connected to the MongoDB server');
  } catch (error) {
      console.error('Error connecting to the MongoDB server:', error);
      process.exit(1);
  }
})();

async function getUserByUsername(username) {
  try {
      const db = await connect();
      const collection = db.collection('users');
      const user = await collection.findOne({ username: username });
      return user;
  } catch (error) {
      console.error('Error fetching user by username:', error);
      throw new Error('Failed to fetch user by username');
  }
}

app.get('/login', (req, res) => {
  res.render('login');
});

// Render registration page
app.get('/register', (req, res) => {
  res.render('register');
});

// Render main page
app.get('/', (req, res) => {
  res.render('main');
});

// Register a new user
// Register a new user
app.post('/api/register', [
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString().isLength({ min: 6 }),
], async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Check if the user already exists
      const existingUser = await getUserByUsername(username);
      if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save the user to the database
      await saveUser({ username, password: hashedPassword });

      res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
  }
});


app.post('/api/login', [
    body('username').notEmpty().isString(),
    body('password').notEmpty().isString(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Check if the user exists
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate and send JWT token
        const token = jwt.sign({ username: user.username }, secretKey); // Sign token with secret key
        res.json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login user' });
    }
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(403).json({ error: 'Invalid token' });
    }
}





// Root route handler
app.get('/restaurants', async (req, res) => {
  try {
      const restaurants = await getAllRestaurants();
      res.render('restaurants', { restaurants });
  } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).render('error', { error: 'Failed to fetch restaurants' });
  }
});
// REST API routes
app.post('/api/restaurants', [
  body('name').notEmpty().isString(),
  body('cuisine').notEmpty().isString(),
  body('borough').notEmpty().isString(),
], async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const newRestaurant = await addNewRestaurant(req.body);
      res.status(201).json(newRestaurant);
  } catch (error) {
      console.error('Error creating restaurant:', error);
      res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

app.get('/api/restaurants', [
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 50 }),
  query('borough').optional().isString(),
], async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, perPage = 10, borough = null } = req.query;
      const restaurants = await getAllRestaurants(page, perPage, borough);
      res.json(restaurants);
  } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

app.get('/api/restaurants/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const restaurant = await getRestaurantById(req.params.id);
      if (!restaurant) {
          return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json(restaurant);
  } catch (error) {
      console.error('Error fetching restaurant by ID:', error);
      res.status(500).json({ error: 'Failed to fetch restaurant by ID' });
  }
});

app.put('/api/restaurants/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, cuisine, borough } = req.body;

      const updatedRestaurant = await updateRestaurantById(id, { name, cuisine, borough });

      if (!updatedRestaurant) {
          return res.status(404).json({ error: 'Restaurant not found or not modified' });
      }

      res.json(updatedRestaurant);
  } catch (error) {
      console.error('Error updating restaurant:', error);
      res.status(500).json({ error: 'Failed to update restaurant' });
  }
});


app.delete('/api/restaurants/:id', [
  param('id').isMongoId(),
], async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const deletedRestaurant = await deleteRestaurantById(req.params.id);
      if (!deletedRestaurant) {
          return res.status(404).json({ error: 'Restaurant not found' });
      }
      res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
      console.error('Error deleting restaurant by ID:', error);
      res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});


app.route('/search')
  .get((req, res) => {
      res.render('search', { results: null });
  })
  .post([
      body('page').optional().isInt({ min: 1 }),
      body('perPage').optional().isInt({ min: 1, max: 50 }),
      body('borough').optional().isString(),
  ], async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).render('search', { errors: errors.array() });
      }

      try {
          const { page = 1, perPage = 10, borough = null } = req.body;
          const restaurants = await getAllRestaurants(page, perPage, borough);
          res.render('search', { results: restaurants });
      } catch (error) {
          res.status(500).render('search', { error: 'Failed to fetch restaurants' });
      }
  });


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
