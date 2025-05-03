import express from "express";
import bodyParser from "body-parser";

//creating the server
const app = express();
const port =3000;
const posts=[];


//adding middelware and modules
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));




// =============== ROUTES SETUP ===============//

//Home Page - Show all posts
app.get("/",(req,res)=>{
    
    res.render("home.ejs");
});

//compose page - Show form to create a new post 
app.get("/compose",(req,res)=>{

   res.render("compose.ejs");
});

//handle new Post Submission
app.post("/compose",(req,res)=>{
     const post={
        title : req.body.postTitle,
        content : req.body.postContent, 
        category : req.body.postCategory
     }
   
     //saving the new posts
     posts.push(post)
     

    //logic to save a new post
res.redirect("/");
});


//Handle Edited Post Submission
app.post("/edit/:postId",(req,res)=>{
    //logic to update the post 
    res.redirect("/");
});

//delete a post
app.post("/delete/:postId",(req,res)=>{
    //logic to delete a post
    res.redirect("/");
});


// =============== SERVER START ===============//
app.listen(port,() =>{
    console.log(`Server running on port ${port}`);
});