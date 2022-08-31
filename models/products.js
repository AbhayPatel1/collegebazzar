


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    images:[{
        url:String,
        filename:String
    }],
    price:{
        type:Number,
        required:true,
        min:0
    },
    description:{
        type:String
    },
    author: {
        type: String,
        ref: 'User'
    },
    category:{
            type:String,
            enum:['cycle','books','light','others'],
            required:true
        },
    isApproved:{
        type:Boolean,
        default:false
    }    
        
})

const product = mongoose.model('product',productSchema);

module.exports = product;