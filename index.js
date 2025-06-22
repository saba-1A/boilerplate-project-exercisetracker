const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const userSchema = new mongoose.Schema({
  username: String,
  log: [mongoose.Schema.Types.Mixed]
})

let UserModel = mongoose.model('User', userSchema)

app.post('/api/users', (req, res) => {
  
  const newUser = new UserModel({
    username: req.body.username,
    log: []
  })
  
  newUser.save((err, data) => {
    if (err) return console.error(err);
    
    UserModel.findOne({username: req.body.username}, (err, data) => {
      if (err) return console.error(err)
      res.send({username: req.body.username, _id: data._id})
    })
  })
})

app.get('/api/users', (req, res) => {
  UserModel.find({}, (err, data) =>{
    if (err) return console.error(err)
    res.send(data)
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
   
  const { description, duration } = req.body
  const date = req.body.date ? new Date(req.body.date) : new Date()
  const id = req.params._id
  
  UserModel.findById({_id: id}, (err, data) => {
    if (err) return console.error(err)

    const updatedLog = [...data.log, {description, duration: Number(duration), date: date.toDateString()}]
    
    UserModel.findOneAndUpdate({_id: id}, {log: updatedLog}, {new: true}, (err, updateDoc) => {
      if (err) return console.error(err)
    })
    
      res.send({_id: id, username: data.username, date: date.toDateString(), duration: Number(duration), description})
  })

})

app.get('/api/users/:_id/logs', (req, res) => {
  
   UserModel.findById({_id: req.params._id}, (err, data) => {
     if (err) return console.error(err)
     let log = data.log

     if (req.query.from && req.query.to) {
       const start = new Date(req.query.from)
       const end = new Date(req.query.to)
       log = log.filter(item => new Date(item.date) >= start && new Date(item.date) <= end)
              .sort((a, b) => new Date(a.date) - new Date(b.date))
     }

     log = req.query.limit ? data.log.slice(0, req.query.limit) : data.log

     const count = log.length
     
     res.send({username: data.username, count: count, _id: req.params._id, log: log})
    
   })

})
