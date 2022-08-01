require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const dns = require('node:dns');

let bodyParser = require('body-parser');
let bodyP = bodyParser.urlencoded({extended: false});

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  short_url: Number
})

const urlModel = mongoose.model('Url', urlSchema)



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyP);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});





// www = good
// https | http :// = must be present but bad for dns
// slash at end = bad for dns
// no slashes at all for dns
app.post('/api/shorturl', (req, res) => {
  let check = req.body.url;

  if(/(https|http)\:\/\//.test(check)){
    check = check.replace(/(https|http)\:\/\//, '')
  }

  if(/\/.*/.test(check)){
    check = check.replace(/\/.*/, '')
  }

  dns.lookup(check, (err, addresses, family) => {
    if(err){
      console.log(err);
      res.json({error: 'invalid url'});
  }else{
      let urlInstance = new urlModel({
        original_url: req.body.url
      });
    
      urlInstance.save(function(err, data){
        if(err) return console.error(err);
    
        urlModel.findOne({original_url: data.original_url}).select({original_url: true, short_url: true}).exec((err, result) => {
          if(err) return console.log(err)
          console.log(result)
            res.json({
              "original_url": result.original_url, 
              "short_url": result.short_url
            });
          });
      });
    }
  });
});

  // console.log(check)
  // if(check != 'found'){
  //   res.json({error: 'invalid url'})
  // }else{
  //   let urlInstance = new urlModel({
  //     original_url: req.body.url
  //   });
  
  //   urlInstance.save(function(err, data){
  //     if(err) return console.error(err);
  
  //     urlModel.findOne({original_url: data.original_url}).select({original_url: true, short_url: true}).exec((err, result) => {
  //       if(err) return console.log(err)
  //       console.log(result)
  //         res.json({
  //           "original_url": result.original_url, 
  //           "short_url": result.short_url
  //         });
  //       });
  //   });
  // }



// function(err, result){
//   res.json({
//     "original_url": result.original_url, 
//     "short_url": result.short_url
//   });
// }




app.get('/api/shorturl/:url', (req, res) => {
  console.log(req.params.url)
  urlModel.findOne({short_url: req.params.url}, function(err, data){
    if(err) return console.log(err)
    console.log(data)
    res.redirect(data.original_url)
  });
});







// app.post('api/shorturl', function(){})














app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
