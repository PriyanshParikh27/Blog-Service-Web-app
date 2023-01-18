const Sequelize = require("sequelize");
const env = require("dotenv")
env.config()

var sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

var Post = sequelize.define("Post", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

var Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Post.belongsTo(Category, { foreignKey: "category" });

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    sequelize
      .sync()
      .then(function () {
        resolve("database synced Successfully");
      }).catch(function () {
        reject("Unable to sync the database");
      });
  });
};

module.exports.getAllPosts = function () {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
      Post.findAll()
        .then(function (data) {
          resolve(data);
        }).catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.getPostsByCategory = (input) => {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(function () {
      Post.findAll({
        where: { category: input },
      })
        .then(function (data) {
          resolve(data);
        }).catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.getPublishedPosts = function () {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
      Post.findAll({
        where: { published: true },
      })
        .then(function (data) {
          resolve(data);
        }).catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.getCategories = function () {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
      Category.findAll()
        .then(function (data) {
          resolve(data);
        }).catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.getPublishedPostsByCategory = (input) => {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
      Post.findAll({
        where: {
          published: true,
          category: input,
        },
      })
        .then(resolve(Post.findAll({where:{published:true,category:input}})))
        .catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.addPost = (postData) => {
  return new Promise((resolve, reject) => {
    for (var i in postData) {
      if (postData[i] == "") {
        postData[i] = null;
      }
    }
    postData.published = postData.published ? true : false;
    postData.postDate = new Date();
    sequelize.sync().then(function () {
      Post.create(postData)
        .then(resolve(console.log("Post created successfully")))
        .catch(function () {
          reject("Unable to create post");
        });
    });
  });
};

module.exports.getPostsByMinDate = (minDateStr) => {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
      Post.findAll({
        where: {
          postDate: {
            [gte]: new Date(minDateStr),
          },
        },
      })
        .then(function (data) {
          resolve(data);
        })
        .catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.getPostById = (identity) => {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(function () {
      Post.findAll({
        where: { id: identity },
      })
        .then(function (data) {
          resolve(data[0]);
        })
        .catch(function () {
          reject(console.log("no results returned"));
        });
    });
  });
};

module.exports.addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    if (categoryData.category == "") {
      categoryData.category = null;
    }
    sequelize.sync().then(function () {
      Category.create(categoryData)
        .then(resolve(console.log("Category created successfully ")))
        .catch(reject("Unable to create category"));
    });
  });
};

module.exports.deleteCategoryById = (identity) => {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(function () {
      Category.destroy({
        where: { id: identity },
      })
        .then(resolve(console.log("category deleted successfully")))
        .catch(reject("Unable to delete category"));
    });
  });
};

module.exports.deletePostById = (identity) => {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(function () {
      Post.destroy({
        where: { id: identity },
      })
        .then(resolve(console.log("post deleted  successfully")))
        .catch(reject("Unable to delete category"));
    });
  });
};
