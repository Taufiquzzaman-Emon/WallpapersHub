const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');
const fs = require('fs');


const app = express();
const port = 4400;

//view engine and middlewares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // for serving uploaded images
app.use(methodOverride('_method'));
// handling image upload using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueName);
  },
});
const upload = multer({ storage });

let posts = [];

// Routes

// Home page
app.get("/", (req, res) => {
  res.redirect("/posts");
});

app.get("/posts/new", (req, res) => {
  res.render("instaPost.ejs");
});

// Handle new post submission
app.post("/posts", upload.single("image"), (req, res) => {
  const { username, caption } = req.body;
  let id = uuidv4();
  const imagePath = "/uploads/" + req.file.filename;
  posts.push({ id, username, caption, image: imagePath });
  res.redirect("/posts");
});

app.get("/posts/:id",(req,res)=>{
  let{id}=req.params;
  let post =posts.find((p)=>id===p.id);
  res.render("post.ejs",{post});

});

app.patch("/posts/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;
  const post = posts.find(p => p.id === id);

  if (post) {
    // Delete old image if a new one is uploaded
    if (req.file) {
      const oldImagePath = path.join(__dirname, post.image); // Save old path before replacing
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error("Error deleting old image:", err);
        else console.log("Old image deleted:", oldImagePath);
      });

      // Replace with new image path
      post.image = "/uploads/" + req.file.filename;
    }

    // Update caption
    post.caption = caption;
  }

  res.redirect("/posts");
});


app.get("/posts/:id/edit", (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === id);
  if (!post) {
    return res.status(404).send("Post not found");
  }
  res.render("editImage", { post });
});
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === id);

  if (post) {
    // Extract local file path by removing leading slash
    const imagePath = path.join(__dirname, post.image);

    // Delete the image file
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log("Image deleted:", imagePath);
      }
    });

    // Remove post from array
    posts = posts.filter(p => p.id !== id);
  }

  res.redirect("/posts");
});

app.get("/posts", (req, res) => {
  res.render("index.ejs", { posts });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
