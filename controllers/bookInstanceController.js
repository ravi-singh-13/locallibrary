const BookInstance = require('../models/bookinstance');
const Book = require("../models/book");

const async =require("async");
const { body, validationResult } = require("express-validator");

// display list of all books

exports.bookinstance_list = (req, res, next) =>{
    BookInstance.find()
        .populate("book")
        .exec(function (err, list_bookinstance) {
            if (err) {
                return next(err);
            }
            res.render("bookinstance_list",{
                title:"Book Instance List",
                bookinstance_list: list_bookinstance
            })
        })
};

//dislay detail page for a specific bookinstance
exports.bookinstance_detail =(req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec((err, bookinstance) =>{
            if (err) {
                return next(err)
            };
            if (bookinstance == null) {
                const err = new Error("No bookinstance not found");
                err.status = 404;
                return next(err);
            }

            res.render("bookinstance_detail",{
                title: `Copy: ${bookinstance.book.title}`,
                bookinstance,
            });

        });
}; 

// display Bookinstance created from form
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, "title").exec((err, books)=>{
        if(err){
            return next(err);
        }
        // sucessful, so render.
        res.render("bookinstance_form",{
            title:"Create BookInstance",
            book_list: books,
        })
    })
};

// handle bookInstance create on POST
exports.bookinstance_create_post = [
    // Validate and sanitize the fields.
    body("book", "Book must be specified").trim().isLength({min:1}).escape(),

    body("imprint", "Imrint must be specified")
        .trim()
        .isLength({min:1})
        .escape(),

    body("status").escape(),

    body("due_date", "Invalid date")
        .optional({checkFalsy: true})
        .isISO8601()
        .toDate(),

    // Proccess request after validation and sanitization
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if(!errors.isEmpty()){
            // there are errors, render form again with sanitize and escaped data.
            Book.find({}, "title").exec(function(err, books){
                if (err) {
                    return next(err);
                }
                // successful, so render.
                res.render("bookinstance_form",{
                    title:"Create BookInstance",
                    book_list:books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance,
                });

            });
            return;
        }
        // Data form is invalid
        bookinstance.save((err)=>{
            if (err) {
                return next(err);
            }
         // Succesful: redirect to new record.
         res.redirect(bookinstance.url);   
        });
    },    
]

// display bookinstance delete form on GET
exports.bookinstance_delete_get = (req, res) => {
    async.parallel(
        {
            BookInstance(callback) {
                BookInstance.findById(req.params.id).exec(callback)
            },
            
        },
        (err, results) => {
            if (err) {
                return next(err);
            }

            if (results.BookInstance == null) {
                res.redirect("/catalog/bookinstances");
            }
            //sucessful, so render. 
            res.render("bookinstance_delete" , {
                title:"Delete book-instance",
                bookinstance: results.BookInstance,
                
            })
        }
    )
};

// handle bookinstance delete on POST
exports.bookinstance_delete_post = (req, res, next) => {
       BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err)=>{
            if (err) {
                return next(err);
            }
            //success - go to instance list
            res.redirect("/catalog/bookinstances");
        })
        }

// diplay author update from on GET
exports.author_update_get = (req, res) =>{
    res.send("NOT implemented: Author update GET");
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = (req,res) => {
    async.parallel({
        bookinstance(callback){
   BookInstance.findById(req.params.id).exec(callback)
        },
        book(callback){
           Book.find({}, "title").exec(callback)
        },    
   }, 
   (err, results) =>{   
    if(err){
        return next(err);
    };
    if(results.bookinstance == null ){
        const err = new Error("no bookinstance found");
        err.status = 404;
        return next(err);
    }

    res.render("bookinstance_form",{
        title:"Update Bookinstance",
        book_list: results.book,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance,
    })
   }) 
};

//Handle bookinstance upate on POST
exports.bookinstance_update_post = [
  // vlidate and sanitize the fields.
  body("book", "Book must not be specified.")
  .trim()
  .isLength({min:1})
  .escape(),

  body("imprint", "Imprint must not be specified.")
  .trim()
  .isLength({min:1})
  .escape(),

  body("status") 
  .escape(),

  body("due_back", "Invalid Date")
  .optional({checkFalsy:true})
  .isISO8601()
  .isDate(),


  //Process request after validation and sanitiztion 
  (req, res, next) => {
    //extract validation error from a request. 
    const errors = validationResult(req);

    // create a bookinstance object with trimmed and escaped data and old id.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id, // This is require, or a new ID will be assigned!
    });
    
    if ( !errors.isEmpty()) {
        // there are errors. Render from again with sanitized values/error message.

        // get all book for from.
       
        Book.find({}, "title").exec((err, books)=>{
      
        if (err) {
          return next(err);
        } 
        // marked our selected genre as checked
          
            res.render("book_form",{
              title: "Update Book-instance",
              book_list: books,
              selected_book: req.body.book,
              bookinstance,
              errors: errors.array(),
            });
       
      
       
       return ;
      })     
             
    }       
        
   
    // Data  from from is valid. update  the rcord.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err)=>{
        return next(err);
      })
      // Successful redirect to book detail page.
      res.redirect(bookinstance.url);
    
    
    },
  
]
