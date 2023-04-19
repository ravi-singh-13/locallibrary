const Author  = require("../models/author");
const Book =  require("../models/book");

const async = require("async");
const { body, validationResult} = require("express-validator");


// display trhe list of all aurhors
exports.author_list = (req,res,next) => {
    Author.find()
        .sort({family_name:1})
        .exec(function (err, list_authors) {
            if (err) {
                return next(err);
            }
            res.render("author_list",{
                title:"Author List",
                author_list: list_authors,
            });

        });
};

// Display detail page for a author
exports.author_detail = (req, res, next) => {
   async.parallel({
        author(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        author_books(callback) {
            Book.find({author:req.params.id}, "title summary").exec(callback);
        },        
   },
   (err, results) => {
        if (err){
            return next(err);
        };
        if (results.author == null) {
            const err = new Error("Author not found");
            err.status = 404;
            return next(err);
        };
        res.render("author_detail",{
            title: "Author Detail",
            author: results.author,
            author_books: results.author_books
        });
   }
   )
};

// display author create from on GET
exports.author_create_get = (req, res, next) => {
    res.render("author_form",{title: "Create Author"});
};

// handle author create on POST
exports.author_create_post = [
    body("first_name")
        .trim()
        .isLength({min:1})
        .escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("first name has non-alphaNumeric charachters"),

    body("family_name")
        .trim()
        .isLength({min:1})
        .escape()
        .withMessage("family name must be specified")
        .isAlphanumeric()
        .withMessage("Family name has non alphanumeric characters."),

    body("date_of_birth", "invalid date of death")
        .optional({checkFalsy: true})
        .isISO8601()
        .toDate(),
        
    body("date_of_death", "Invalid date of death")
        .optional({checkFalsy: true})
        .isISO8601()
        .toDate(),

    //process request
    (req, res, next) => {
        // extract validation errorfrom a request.
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            // there are errors. Render from again wth sanitize values/errors message.
            res.render("author_form",{
                title: "Create Author",
                author: req.body,
                errors: errors.array(),
            });
            return;
        }
        // Data from form is valid.

        // Create an Author object with escaped and trimmed data.
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });
        author.save((err) => {
                if (err) {
                    return next(err);
                }
         // successful -redirect to new author record.
         res.redirect(author.url);       
        });

       
    },
]

// display author delete from on GET
exports.author_delete_get = (req, res, next) => {
    async.parallel(
        {
            author(callback) {
                Author.findById(req.params.id).exec(callback)
            },
            author_books(callback) {
                Book.find({author:req.params.id}).exec(callback)
            },
        },
        (err, results) => {
            if (err) {
                return next(err);
            }

            if (results.author == null) {
                res.redirect("/catalog/authors");
            }
            //sucessful, so render. 
            res.render("author_delete" , {
                title:"Delete Author",
                author: results.author,
                author_books: results.author_books,
            })
        }
    )

};

// handle author delete on POST
exports.author_delete_post = (req, res) => {
    async.parallel(
        {
            author(callback){
                Author.findById(req.body.authorid).exec(callback);
            },
            author_books(callback){
                Book.find({author:req.body.authorid}).exec(callback);
            },
        },
        (err,  results) =>{
            if (err) {
                return next(err);
            }
            // success 
            if (results.author_books > 0 ){
                res.render("author_delete",{
                    title:"Delete Author",
                    author:results.author,
                    author_books:results.author_books,
                });
                return ;
            }
        // author has no books. delete object and redirect to author list  .
        Author.findByIdAndRemove(req.body.authorid, (err)=>{
            if (err) {
                return next(err);
            }
            //success - go to author list
            res.redirect("/catalog/authors");
        })
        }

    )
}

// diplay author update from on GET
exports.author_update_get = (req, res) =>{
  async.parallel({
    author(callback){
        Author.findById(req.params.id).exec(callback)
    },
  },
  (err, results) => {
    if (err){
        return next(err);        
    }
    if (results.author == null){
        const err = new Error("author not found");
        err.status = 404;
        return next(err);
    }
    res.render("author_form",{
        title: "Update Author",
        author: results.author,
    })
  }
  )
};

//handle Author update on POST
exports.author_update_post = [
    body("first_name", "invalid first name")
    .trim()
    .isLength({min:1})
    .escape(),

    body("family_name", "invalid family name")
    .trim()
    .isLength({min:1})
    .escape(),

    body("date_of_birth", "invalid date of birth")
    .optional({checkFalsy: true})
    .isISO8601()
    .toDate(),
     
    body("date_of_death", "invalid date of death")
     .optional({ckeckFalsly: true})
     .isISO8601()
     .toDate(),

     (req, res, next)=>{
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render("author_form",{
                title:"Update Author",
                author: req.body,
                errors: errors.array(), 
            })
            return ;
        }
        const author = new Author({
            first_name: req.body.first_name,
            family_name : req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });
        Author.findByIdAndUpdate(req.params.id, author, {}, (err)=>{
            return next(err);
        })
        res.redirect(author.url)
     },
]