const cloudinary = require('cloudinary').v2; // Correct Cloudinary v2 import
const dotenv = require('dotenv');
dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
