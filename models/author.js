const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: {type:String, required: true, maxLength: 100},
    family_name: {type: String, required:true, maxLength: 100},
    date_of_birth:{type:Date},
    date_of_death:{type: Date}
});

// virtual for author's full name;
AuthorSchema.virtual("name").get(function(){
    let fullname = "";
    if(this.first_name && this.family_name){
        fullname = `${this.family_name}, ${this.first_name}`;
    }

    if(!this.first_name || !this.family_name){
        fullname="";
    }
    return fullname;
})

// virtual for authors url;

AuthorSchema.virtual("url").get(function(){
    return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("date_of_birth_formatted").get(function(){
    return this.date_of_birth ? 
    DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.Date_MED)
    : ""
})

AuthorSchema.virtual("date_of_death_formatted").get(function(){
    return this.date_of_death ?
    DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.Date_MED)
    : ""
})

AuthorSchema.virtual("date_of_birth_formatted_1").get(function(){
    return this.date_of_birth ? 
    DateTime.fromJSDate(this.date_of_birth).toFormat('yyyy-MM-dd')
    :""
})

AuthorSchema.virtual("date_of_death_formatted_1").get(function(){
    return this.date_of_death 
    ? DateTime.fromJSDate(this.date_of_death).toFormat('yyyy-MM-dd')
    :""
})

// export model
module.exports= mongoose.model("Author", AuthorSchema);
