var express = require('express');
const res = require('express/lib/response');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;


const product = require('../models/products');
const multer  = require('multer')

const app = express();

const {storage} = require('../cloudinary')
const upload = multer({ storage })

const user = require('../models/user');
const { findById } = require('../models/products');
const { findByIdAndUpdate } = require('../models/user');

var ensureLoggedIn = ensureLogIn();


var router = express.Router();

const isAuthor = async (req, res, next) => {
  if(!req.isadmin){
  const { id } = req.params;
  const findproduct = await product.findById(id);

  if (!(findproduct.author==req.user.id)) {
    req.flash('error', 'You are not the owner of item');
    return res.redirect(`/items/${id}`)
  }}else{
    next();
  }
  next();
}

const isApproved = async(req,res,next)=>{
  const {id} = req.params;
  const findproduct = await product.findById(id);
  if(!isApproved){
    return res.redirect('/items');
  }

  next();
}

router.use((req,res,next)=>{
   res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next()
})


/* GET home page. */
router.get('/', (req, res) => {
  if(req.user){
    
    req.flash('success',`Welcome Back! ${req.user.firstName}`)
    res.redirect('/items');
  }else{
  res.render('index');
  }
})

router.post('/blacklist/:id',ensureLoggedIn,async (req,res)=>{
  const {id} = req.params;
  const founduser =await user.findById(id);
  if(founduser.isBlacklisted){
  await founduser.updateOne({isBlacklisted:false});
  req.flash('success',`Removed from Blacklist ${founduser.firstName}`)
  }else{
    await founduser.updateOne({isBlacklisted:true});
    req.flash('error',`Blacklisted ${founduser.firstName}`)
  }
  res.redirect('/allusers');
})

router.get('/items', ensureLoggedIn, async (req, res) => {
  const search = req.query.search;

  if(!search){
      var products = await product.find({});
}else{
  var products = await product.find({  $and: [{name: search}] });
}

  var founduser = await user.find({id:req.user.id});
  products = [products, { user: founduser[0].firstName }];
  
  res.render('items.ejs', { products });
})

// router.get('/profile', (req, res) => {
//   res.render('profile')
// })

router.get('/items/new', ensureLoggedIn, async (req, res) => {
  const founduser = await user.find({id:req.user.id});
  
  if(founduser[0].isBlacklisted){
    return res.send('you are blaclisted from posting the item, contact admin');
  }else{
  res.render('new.ejs');}
})
router.get('/category/:id',async (req,res)=>{
  const id = req.params.id;
  const foundproduct = await product.find({'category':id})
  
  res.render('category',{foundproduct,id})
})

router.get('/items/:id', ensureLoggedIn,isApproved, async (req, res) => {
  const { id } = req.params;
  const singleproduct = await product.findById(id);
 
 // console.log(singleproduct);
  res.render('itemviewpage', { singleproduct});
})
router.get('/allitems',async (req,res)=>{
  if(req.session.isadmin=='yes'){
    const products = await product.find({});
   return res.render('allitems',{products});
  }
  res.render('admin');
})


router.get('/admin',async (req,res)=>{
  if(req.session.isadmin=='yes'){
    const products = await product.find({});
   res.render('profile',{products});
  }
  res.render('admin');
})

router.get('/allusers',async (req,res)=>{
  if(req.session.isadmin=='yes'){
    const users = await user.find({});
   return res.render('allusers',{users});
  }
  res.render('allusers');
})

router.post('/admin',async(req,res)=>{
  if(req.body.admin.username=='webnd@iitbbs'&&req.body.admin.password=='webnd'){  
    req.session.isadmin = 'yes';
  const products = await product.find({});
   res.render('profile',{products});
  }else{
  req.flash('error','username or password are incorrect')
  res.redirect('/admin');
  }

})

router.post('/logoutadmin',ensureLoggedIn,async(req,res)=>{
  req.session.isadmin = 'no';
  res.redirect('/items');
})

router.post('/approve/:id',ensureLoggedIn,async(req,res)=>{
  const {id} = req.params;
  const singleproduct = await product.findByIdAndUpdate(id,{isApproved:true});
  res.redirect('/admin');
})



router.post('/items', ensureLoggedIn,upload.array('avatar'), async (req, res) => {
  
  const newitem = new product(req.body.item);
  newitem.images = req.files.map(f=>({url:f.path,filename:f.filename}));
  newitem.author = req.user.id;
 
  await newitem.save();
  //res.send("making your product");

  res.redirect('/items');
 // console.log(req.body,req.files);
  
 
})

router.get('/wishlist',ensureLoggedIn,async(req,res)=>{
    
    var founduser = await user.find({id:req.user.id})
    .populate('wishlistedItems')
    .exec(); 
   
    var products = founduser[0].wishlistedItems;
    res.render('wishlist',{products});
})


router.post('/wishlist/:id', ensureLoggedIn, async (req, res) => {
  const { id } = req.params;
  const founduser = await user.find({'wishlistedItems':{$in: [id]}}); // and user id should match 

  if(!founduser.length){
  
    await user.updateOne(
      { id:req.user.id},
      { $push: { 'wishlistedItems': id } }
   )
   req.flash('success','Added to Wishlist')
  }else{ 
   
    await user.updateOne(
      { id:req.user.id},
      { $pull: { 'wishlistedItems': id } }
   )
   req.flash('error','Deleted from Wishlist')
  }

   res.redirect('/items/'+id);
})


//edit
router.get('/items/edit/:id', ensureLoggedIn, async (req, res) => {
  const { id } = req.params;
  const singleproduct = await product.findById(id);

  res.render('edit.ejs', { singleproduct });
})

router.post('/items/edit/:id', ensureLoggedIn, async (req, res) => {
  const { id } = req.params;
  await product.findOneAndReplace((id), req.body);
  res.redirect(`/items/${id}`)
});


router.get('/', (req, res) => {
  res.render('index');
})

router.post('/delete/:id', ensureLoggedIn, isAuthor,async (req, res) => {
  //IMPLEMENT IS AUTHOR
  const { id } = req.params;
  await product.findByIdAndDelete(id);
  req.flash('success','Deleted a Item')
  res.redirect('/allitems');
})


router.get('/', (req, res) => {
  res.render('index');
})



module.exports = router;
