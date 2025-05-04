import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";
//creating the server
const app = express();
const port =3000;


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads"); // Directory to save uploaded images
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Only images (JPEG, JPG, PNG, GIF) are allowed!"));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // Limit file size to 2MB
});

// Connect to MySQL database
const db = mysql.createConnection({
    host: "localhost",
    user: "root", 
    password: "", 
    database: "blog_website" 
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
    } else {
        console.log("Connected to the MySQL database.");
    }
});

//adding middelware and modules
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// Set EJS as the view engine
app.set("view engine", "ejs");




// =============== ROUTES SETUP ===============//

//Home Page - Show all posts
app.get("/",(req,res)=>{
    const query = "SELECT * FROM posts"; 
    db.query(query,(err,results)=>{
        if (err) {
            console.error("Error fetching posts:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        else {
            // Render the home page with the posts data
        res.render("home.ejs", { posts: results });
        }
        
    });
});

//compose page - Show form to create a new post 
app.get("/compose",(req,res)=>{

   res.render("compose.ejs");
});

//handle new Post Submission
app.post("/compose", upload.single("postImage"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded or invalid file type.");
    }

    const { postTitle, postContent, postCategory } = req.body;
    const postImage = `/uploads/${req.file.filename}`;

    const query = "INSERT INTO posts (title, content, category, image) VALUES (?, ?, ?, ?)";
    db.query(query, [postTitle, postContent, postCategory, postImage], (err, result) => {
        if (err) {
            console.error("Error inserting post:", err);
            res.status(500).send("Error saving the post.");
        } else {
            console.log("Post saved successfully:", result);
            res.redirect("/");
        }
    });
});


// Show Edit Page
app.get("/edit/:postId", (req, res) => {
    const postId = req.params.postId;
    const query = "SELECT * FROM posts WHERE id = ?";
    db.query(query, [postId], (err, results) => {
        if (err) {
            console.error("Error fetching post:", err);
            res.status(500).send("Error fetching post.");
        } else {
            res.render("edit.ejs", { post: results[0] });
        }
    });
});

// Handle Edited Post Submission


app.post("/edit/:postId", upload.single("postImage"), (req, res) => {
    const postId = req.params.postId;
    const { postTitle, postContent, postCategory } = req.body;
    const postImage = req.file ? `/uploads/${req.file.filename}` : null;

    // Fetch the current image path from the database
    const fetchQuery = "SELECT image FROM posts WHERE id = ?";
    db.query(fetchQuery, [postId], (err, results) => {
        if (err) {
            console.error("Error fetching current image:", err);
            res.status(500).send("Error fetching current image.");
            return;
        }

        const currentImage = results[0]?.image;

        // If a new image is uploaded, delete the old image
        if (postImage && currentImage) {
            const oldImagePath = `public${currentImage}`;
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error("Error deleting old image:", err);
                } else {
                    console.log("Old image deleted successfully.");
                }
            });
        }

        // Update the post in the database
        const query = postImage
            ? "UPDATE posts SET title = ?, content = ?, category = ?, image = ? WHERE id = ?"
            : "UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?";

        const params = postImage
            ? [postTitle, postContent, postCategory, postImage, postId]
            : [postTitle, postContent, postCategory, postId];

        db.query(query, params, (err, result) => {
            if (err) {
                console.error("Error updating post:", err);
                res.status(500).send("Error updating post.");
            } else {
                console.log("Post updated successfully:", result);
                res.redirect("/");
            }
        });
    });
});

//delete a post
app.post("/delete/:postId", (req, res) => {
    const postId = req.params.postId;
    const query = "DELETE FROM posts WHERE id = ?";
    db.query(query, [postId], (err, result) => {
        if (err) {
            console.error("Error deleting post:", err);
            res.status(500).send("Error deleting post.");
        } else {
            console.log("Post deleted successfully:", result);
            res.redirect("/");
        }
    });
});


// =============== SERVER START ===============//
app.listen(port,() =>{
    console.log(`Server running on port ${port}`);
});