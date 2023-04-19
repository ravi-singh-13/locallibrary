const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const { body, validationResult} = require("express-validator");

const async = require("async");

exports.index = (req, res) => {
  async.parallel(
    {
      book_count(callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count(callback) {
        BookInstance.countDocuments({},callback);
      },
      book_instance_available_count(callback) {
        BookInstance.countDocuments({status:"Available"}, callback);
      },
      author_count(callback) {
        Author.countDocuments({}, callback);
      },
      genre_count(callback) {
        Genre.countDocuments({}, callback);        
      },
    },
    (err, results) => {
      res.render("index", {
        title:"Local Library Home",
        error: err,
        data: results,
      })
    }
  )
};

// Display list of all books.
exports.book_list = (req, res, next) => {
 Book.find({},"title author")
     .sort({title:1})
     .populate("author")
     .exec(function(err, list_books) {
      if (err) {
        return next(err);
      }
      //successful so render
      res.render("book_list", {title:"Book list", book_list: list_books})
     })
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
      async.parallel(
        {
          book(callback) {
            Book.findById(req.params.id)
                .populate("author")
                .populate("genre")
                .exec(callback);
          },

          book_instance(callback) {
            BookInstance.find({book:req.params.id}).exec(callback);
          },
        },
        (err, results) => {
          if (err) {
            return  next(err);
          };
          if (results.book ==  null){
            const err =  new Error("Book not found");
            err.status = 404;
            return next(err)
          };
          res.render("book_detail",{
            title: results.book.title,
            book: results.book,
            book_instances: results.book_instance,

          });
        }

     ); 
}

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  console.log("book form create")
  // Get all author and genre

  async.parallel(
    {
      authors(callback) {
        Author.find(callback);
      },
      genres(callback){
        Genre.find(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },
  // validate ans sanitize
  body("title", "Title must not be empty")
    .trim()
    .isLength({min:1})
    .escape(),

  body("author", "Author must not be empty")
    .trim()
    .isLength({min:1})  
    .escape(),

  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({min:1})
    .escape(), 
    
  body("isbn" , "ISBN must not be empty.").trim().isLength({min:1}).escape(),
  
  body("genre.*").escape(),

  // Processed request after validation and sanitization.
  (req, res, next) => {
    // extract validtion error from the a request
    const errors= validationResult(req);

    // create a book object with trimed and escaped book data

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn:  req.body.isbn,
      genre: req.body.genre,
    });

    if(!errors.isEmpty()) {
      // There are errors. REnder form again with sanitized value /error messages.

      // Get all the authors and genres for form.
      async.parallel(
        {
          authors(callback){
            Author.find(callback);
          },
          genres(callback){
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err){
            return next(err);
          }
        
        // mark out selected genre as checked.
         for(const genre of results.genres){
          if (book.genre.includes(genre._id)){
            genre.checked =true;
          }
        }
          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book,
            errors:errors.array(),
          });
        }
        );
        return ;
    }
    // data from form is valid;
    book.save((err)=>{
      if (err){
        return next(err);
      }
      //Sucessful: redirect  to new book record.
      res.redirect(book.url);
    });
  },
];
// Display book delete form on GET.
exports.book_delete_get = (req, res) => {
  async.parallel(
    {
        book(callback) {
            Book.findById(req.params.id).exec(callback)
        },
        book_instances(callback) {
            BookInstance.find({book:req.params.id}).exec(callback)
        },
    },
    (err, results) => {
        if (err) {
            return next(err);
        }

        if (results.book == null) {
            res.redirect("/catalog/books");
        }
        //sucessful, so render. 
        res.render("book_delete" , {
            title:"Delete Author",
            book: results.book,
            book_instances: results.book_instances,
        })
    }
)

};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id).exec(callback)
    },
    book_instances(callback) {
        BookInstance.find({book:req.params.id}).exec(callback)
    },
    },
    (err,  results) =>{
        if (err) {
            return next(err);
        }
        // success 
        if (results.book_instances > 0 ){
            res.render("book_delete",{
              title:"Delete Author",
              book: results.book,
              book_instances: results.Book_instances,
            });
            return ;
        }
    // book has no instance. delete object and redirect to book list  .
    Book.findByIdAndRemove(req.body.bookid, (err)=>{
        if (err) {
            return next(err);
        }
        //success - go to author list
        res.redirect("/catalog/books");
    })
    }

)
};

// Display book update form on GET.
exports.book_update_get = (req, res) => {
  // get book authors and genre from form 
  async.parallel(
    {
      book(callback) {
         Book.findById(req.params.id)
        .populate("author")
        .populate("genre")
        .exec(callback);
      },
      
        authors(callback){
          Author.find(callback);
        },
        genres(callback){
          Genre.find(callback);
        }
      },
      (err, results) => {
        if (err){
          return next(err);
        }
       if (results.book == null) {
        const err = new Error("book not found");
        err.status = 404;
        return next(err);
       }
       // sucess
       // markout selected genre as checked 
       for(const genre of results.genres){
         for(const bookGenre of results.book.genre){
          if (genre._id.toString() === bookGenre._id.toString() ){
              genre.checked = "true"
          }
         }
       }
       res.render("book_form", {
                title:   "update Book",
                authors: results.authors,
                genres:  results.genres,
                book:    results.book,
       });
      }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  //converts the genre to an array
  (req, res, next) =>{
    if( !Array.isArray(req.body.genre)){
      req.body.genre = typeof req.body.genre === undefined ? [] : [req.body.genre];
    };
    next();
  },
  // vlidate and sanitize the fields.
  body("title", "title must not be empty")
  .trim()
  .isLength({min:1})
  .escape(),

  body("author", "Author must not be empty")
  .trim()
  .isLength({min:1})
  .escape(),

  body("summary", "summary must not be empty")
  .trim()
  .isLength({min:1})
  .escape(),

  body("isbn", "isbn must not be empty").trim().isLength({min:1}).escape(),
  body("genre.*").escape(),

  //Process request after validation and sanitiztion 
  (req, res, next) => {
    //extract validation error from a request. 
    const errors = validationResult(req);

    // create a book object with trimmed and escaped data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre=== "undefined" ? [] : req.body.genre,
      _id: req.params.id, // This is require, or a new ID will be assigned!
    });
    
    if ( !errors.isEmpty()) {
        // there are errors. Render from again with sanitized values/error message.

        // get all authors and genres for from.
       async.parallel({
        genres(callback){
          Genre.find().exec(callback);
        },
        authors(callback){
          Author.find().exec(callback)
        },
      }, 
      (err, results) => {
        if (err) {
          return next(err);
        } 
        // marked our selected genre as checked
          for (const genre of results.genres){
               if(book.genre.includes(genre.id)) {
                genre.checked = "true";
               }
            }
            res.render("book_form",{
              title: "Update Book",
              authors: results.authors,
              genres: results.genres,
              book:book,
              errors: errors.array(),
            });
      }  
      
       )
       return ;
      }     
             
            
        
   
    // Data  from from is valid. update  the rcord.
      Book.findByIdAndUpdate(req.params.id, book, {}, (err)=>{
        return next(err);
      })
      // Successful redirect to book detail page.
      res.redirect(book.url);
    
    },
  
  
]

