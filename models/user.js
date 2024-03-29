const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    id: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: [true, "email already registered"],
    },
    isBlacklisted:{
      type:Boolean,
      default:false
    },
    firstName: String,
    lastName: String,
    profilePhoto: String,
    password: String,
    source: { type: String, required: [true, "source not specified"] },
    lastVisited: { type: Date, default: new Date() },
    wishlistedItems:[{
      type:Schema.ObjectId,
      ref:"product" 
    }],
    items:[{
      type:Schema.ObjectId,
      ref:"product"
    }]
    
  });


module.exports = mongoose.model('User', UserSchema);