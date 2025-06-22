const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

// Mongoose schema and model
const userSchema = new mongoose.Schema({
  username: String,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});

const UserModel = mongoose.model('User', userSchema);

// POST /api/users
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new UserModel({
      username: req.body.username,
      log: [],
    });

    const savedUser = await newUser.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const users = await UserModel.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const user = await UserModel.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const formattedDate = date ? new Date(date).toDateString() : new Date().toDateString();

    const exercise = {
      description,
      duration: parseInt(duration),
      date: formattedDate,
    };

    user.log.push(exercise);
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add exercise' });
  }
});

// GET /api/users/:_id/logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const user = await UserModel.findById(req.params._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let log = [...user.log];

    // Filter by date
    if (from || to) {
      const fromDate = from ? new Date(from) : new Date(0);
      const toDate = to ? new Date(to) : new Date();

      log = log.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= fromDate && entryDate <= toDate;
      });
    }

    // Apply limit
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});
