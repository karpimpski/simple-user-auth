var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true}
});

userSchema.methods.validPassword = function( pwd ) {
    return ( this.password === pwd );
};

var User = mongoose.model('User', userSchema);

module.exports = User;