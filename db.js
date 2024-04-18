const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// Connection URI
const uri = process.env.DB_URI;
let client;

// Function to connect to the MongoDB server
// Function to connect to the MongoDB server
async function connect() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to the MongoDB server');
        return client.db('5315-project'); // Make sure to return the database object here
    } catch (error) {
        console.error('Error connecting to the MongoDB server:', error);
        throw error;
    }
}



// Function to get the user by username
async function getUserByUsername(username) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('users');

        // Find user by username
        const user = await collection.findOne({ username });

        return user;
    } catch (error) {
        console.error('Error fetching user by username:', error);
        throw new Error('Failed to fetch user by username');
    }
}

// Function to save a new user
async function saveUser(user) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('users');
        const result = await collection.insertOne(user);

        if (result.ops && result.ops.length > 0) {
            return result.ops[0];
        } else {
            return result.insertedId;
        }
    } catch (error) {
        console.error('Error saving user:', error);
        throw new Error('Failed to save user');
    }
}


// Function to get restaurants for a specific page (sorted by restaurant_id), with optional filtering by borough
async function getAllRestaurants(page, perPage, borough) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('restaurants');

        // Calculate skip count based on page number and perPage value
        const skipCount = (page - 1) * perPage;

        // Define query criteria
        const query = borough ? { borough: borough } : {};

        // Fetch restaurants based on query criteria, sorted by restaurant_id, with pagination
        const restaurants = await collection.find(query)
            .sort({ restaurant_id: 1 })
            .skip(skipCount)
            .limit(parseInt(perPage))
            .toArray();

        return restaurants;
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw new Error('Failed to fetch restaurants');
    }
}

async function getRestaurantById(id) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('restaurants');

        // Find restaurant by ID
        const restaurant = await collection.findOne({ _id: new ObjectId(id) });

        return restaurant;
    } catch (error) {
        console.error('Error fetching restaurant by ID:', error);
        throw new Error('Failed to fetch restaurant by ID');
    }
}

async function addNewRestaurant(data) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('restaurants');
        const result = await collection.insertOne(data);

        if (result.ops && result.ops.length > 0) {
            return result.ops[0];
        } else {
            return result.insertedId;
        }
    } catch (error) {
        console.error('Error creating new restaurant:', error);
        throw new Error('Failed to create restaurant');
    }
}

async function updateRestaurantById(id, newData) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('restaurants');

        // Update restaurant by ID
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: newData });

        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error updating restaurant by ID:', error);
        throw new Error('Failed to update restaurant by ID');
    }
}

async function deleteRestaurantById(id) {
    try {
        const db = client.db('5315-project');
        const collection = db.collection('restaurants');

        // Delete restaurant by ID
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error deleting restaurant by ID:', error);
        throw new Error('Failed to delete restaurant by ID');
    }
}

module.exports = { 
    getAllRestaurants, 
    getRestaurantById, 
    addNewRestaurant, 
    updateRestaurantById, 
    deleteRestaurantById,
    connect, 
    getUserByUsername, 
    saveUser 
};
