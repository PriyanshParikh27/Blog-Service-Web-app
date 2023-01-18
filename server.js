/*********************************************************************************
 *  BlogService-Web-App
 *  I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: __Priyansh Parikh__ Student ID: __158341214__ Date: __06/12/2022__
 *
 *  Cyclic Web App URL: https://light-trunks-fawn.cyclic.app/
 *  GitHub Repository URL: https://github.com/PriyanshParikh27/BlogService-Web-app
 *
 ********************************************************************************/

var express = require("express");
const clientSessions = require("client-sessions");
var app = express();
const exphbs = require("express-handlebars");
var blogService = require(__dirname + "/blog-service.js");
var authData = require("./auth-service.js");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const stripJs = require("strip-js");
const { info } = require("console");
const env = require("dotenv")
env.config()

//coudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});
//upload variable without any disk storage
const upload = multer();
var HTTP_PORT = process.env.PORT || 8080;

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      strong: function (options) {
        return "<strong>" + options.fn(this) + "</strong>";
      },
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    },
  })
);

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(clientSessions({
  cookieName: "session",
  secret: "pparikh8@myseneca.ca",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.set("view engine", ".hbs");

//css
app.use(express.static("public"));
app.use(express.static("views"));

// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {
  res.redirect("blog");
});

app.get("/about", (req, res) => {
  res.render("about", {
    data: info,
  });
});

app.get("/blog", async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogService.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let post = posts[0];
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blogService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});

app.get("/blog/:id", async (req, res) => {
  let viewData = {};
  try {
    let posts = [];
    if (req.query.category) {
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blogService.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    viewData.post = await blogService.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blogService.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.render("blog", { data: viewData });
});

app.get("/posts", ensureLogin, (req, res) => {
  var cat = req.query.category;
  var minDat = req.query.minDate;

  if (cat < 6 && cat > 0) {
    blogService
      .getPostsByCategory(cat)
      .then((getResponse) => {
        if (getResponse.length > 0) {
          res.render("posts", { posts: getResponse });
        } else {
          res.render("posts", { message: "No results" });
        }
      })
      .catch(() => {
        res.render("posts", { message: "No results" });
      });
  }

  else if (minDat != null) {
    blogService
      .getPostsByMinDate(minDat)
      .then((getResponse) => {
        if (getResponse.length > 0) {
          res.render("posts", { posts: getResponse });
        } else {
          res.render("posts", { message: "No results" });
        }
      })
      .catch(() => {
        res.render("posts", { message: "No results" });
      });
  } else {

    blogService
      .getAllPosts()
      .then((getResponse) => {
        if (getResponse.length > 0) {
          res.render("posts", { posts: getResponse });
        } else {
          res.render("posts", { message: "No results" });
        }
      })
      .catch(() => {
        res.render("posts", { message: "No results" });
      });
  }
});

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };
  async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }
  upload(req).then((uploaded) => {
    req.body.featureImage = uploaded.url;
    blogService.addPost(req.body).then(() => {
      res.redirect("/posts");
    });
  });
});

app.get("/posts/add", ensureLogin, (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      res.render("addPost", {
        categories: data,
      });
    }).catch(() => {
      res.render("addPost"), { categories: [] };
    });
});

app.get("/posts/:id", ensureLogin, (req, res) => {
  blogService
    .getPostById(req.params.id)
    .then((getResponse) => {
      res.send(getResponse);
    }).catch((getReject) => {
      res.send(getReject);
    });
});

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
  blogService
    .deletePostById(req.params.id)
    .then(() => {
      res.redirect("/posts");
    }).catch(console.log("Unable to Remove Post / Post not found"));
});

app.get("/categories", ensureLogin, (req, res) => {
  blogService
    .getCategories()
    .then((getResponse) => {
      if (getResponse.length > 0) {
        res.render("categories", { categories: getResponse });
      } else {
        res.render("categories", { message: "No results" });
      }
    }).catch(() => {
      res.render("categories", { message: "No results" });
    });
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  blogService
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    }).catch(console.log("Unable to Add category"));
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  blogService
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    }).catch(console.log("Unable to Remove Category / Category not found)"));
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => res.render("register", { successMessage: "User created" }))
    .catch(err => res.render("register", { errorMessage: err, userName: req.body.userName }))
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      }
      res.redirect("/posts");
    })
    .catch(err => {
      res.render("login", { errorMessage: err, userName: req.body.userName })
    })
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", {
    user: req.session.user
  });
});

app.use((req, res) => {
  res.status(404).render("404");
});

blogService.initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT)
    });
  }).catch(function (err) {
    console.log("unable to start server: " + err);
});
