var express = require('express');
const res = require('express/lib/response');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;


const product = require('../models/products');
const multer  = require('multer')

const app = express();

const {storage} = require('../cloudinary')
const upload = multer({ storage })

const user = require('../models/user')

var ensureLoggedIn = ensureLogIn();


var router = express.Router();

const isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const findproduct = await product.findById(id);

  if (!findproduct.author.equals(req.user._id)) {
    console.log('error', 'You do not have permission to do that!');
    return res.redirect('items')
  }
  next();
}

const isApproved = async(req,res,next)=>{
  const {id} = req.params;
  const findproduct = await product.findById(id);
  if(!isApproved){
    return res.redirect('/items');
  }
  console.log('hello');
  next();
}

router.use((req,res,next)=>{
   res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next()
})


/* GET home page. */
router.get('/', (req, res) => {
  res.render('index');

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
  console.log(products);
  res.render('items.ejs', { products });
})

// router.get('/profile', (req, res) => {
//   res.render('profile')
// })

router.get('/items/new', ensureLoggedIn, async (req, res) => {
  res.render('new.ejs');
})
router.get('/category/:id',async (req,res)=>{
  const id = req.params.id;
  const foundproduct = await product.find({'category':id})
  console.log(foundproduct);
  res.render('category',{foundproduct,id})
})

router.get('/items/:id', ensureLoggedIn,isApproved, async (req, res) => {
  const { id } = req.params;
  const singleproduct = await product.findById(id);
  console.log(singleproduct);
  
  res.render('itemviewpage', { singleproduct});
})
router.get('/admin',async (req,res)=>{
  if(req.query.password=='password'){
    //this is not the way to implement admin page securely but due to time doing it like this;
  const products = await product.find({});
   res.render('profile',{products});
  }else{
  res.redirect('/admin');
  //flash you dont have access
  }
})
router.post('/approve/:id',async(req,res)=>{
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
  console.log(newitem);
  res.redirect('/items');
 // console.log(req.body,req.files);
  
 
})

router.get('/wishlist',ensureLoggedIn,async(req,res)=>{
    
    var founduser = await user.find({id:req.user.id})
    .populate('wishlistedItems')
    .exec(); 
    console.log(founduser);
    var products = founduser[0].wishlistedItems;
    res.render('wishlist',{products});
})


router.post('/wishlist/:id', ensureLoggedIn, async (req, res) => {
  const { id } = req.params;
  const founduser = await user.find({'wishlistedItems':{$in: [id]}}); // and user id should match 
 console.log(founduser,'user');
  if(!founduser.length){
    console.log('here');
    await user.updateOne(
      { id:req.user.id},
      { $push: { 'wishlistedItems': id } }
   )
   req.flash('success','Added to Wishlist')
  }else{
    //already in wishlist
   
    console.log('there');
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

router.post('/delete/:id', ensureLoggedIn, async (req, res) => {
  //IMPLEMENT IS AUTHOR
  const { id } = req.params;
  await product.findByIdAndDelete(id);
  res.redirect('/items');
})
router.get('/', (req, res) => {
  res.render('index');
})



module.exports = router;
