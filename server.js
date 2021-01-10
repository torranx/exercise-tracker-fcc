require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', () => console.log('DB Connected'));

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: {
    type: String, 
    required: true
    }
});
const exerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
});
let Exercise = mongoose.model('Exercise', exerSchema);
let User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.post("/api/exercise/new-user", (req,res) => {
  let user = req.body.username;
  User.find({
    username: user
  }, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      if (data.length > 0) {
        res.send("Username already taken")
      } else {
        new User({
          username: user
        })
        .save((err, data) => {
          if (err) {
            console.log(err)
          }
          res.json({
            username: data['username'],
            _id: data['_id']
          })
        })
      }
    }
  })
})

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      console.log(err)
    }
    res.json(data)
  })
});

app.post('/api/exercise/add', (req,res) => {
  let eDescription = req.body.description;
  let eDuration = req.body.duration;
  let eDate = req.body.date;
  let userId = req.body.userId;
  User.find({
    _id: userId
  }, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      if (data.length > 0) {
        new Exercise({
          userId: data['0']._id,
          description: eDescription,
          duration: eDuration,
          date: (!eDate) ? new Date() : eDate
        }).save((err, exercise) => {
          if (err) {
            console.log(err)
          }
          res.json({
            username: data['0'].username,
            _id: exercise['userId'],
            description: exercise['description'],
            duration: exercise['duration'],
            date: exercise['date'].toDateString()
          })
        })
      } else {
        res.send("Unknown userId");
      }
    }
  });
});

app.get('/api/exercise/log', (req, res) => {
  let id = req.query.userId;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let limit = req.query.limit;
  Exercise.find({
    userId: id
  }, (err, exercise) => {
    if (err) {
      console.log(err)
    } else {
      if (exercise.length > 0) {
        User.findById(exercise['0'].userId, (err, user) => {
          if (err) {
            console.log(err)
          };
          let totalCount = 0;
          let logArr = [];
          let fromObj = new Date(fromDate);
          let toObj = new Date(toDate);

          for (let i = 0; i < exercise.length; i++) {
            if (totalCount == limit) {
              break;
            }
            const data = {
              description: exercise[i].description,
              duration: exercise[i].duration,
              date: exercise[i].date.toDateString()
            }
            if (exercise[i].date >= fromObj && exercise[i].date <= toObj) {
              console.log('test2')
              totalCount += 1;
              logArr.push(data);
            } else if (exercise[i].date >= fromObj && !toDate) {
              console.log('test1')
              totalCount += 1;
              logArr.push(data);
            } else if (!fromDate && !toDate) {
              totalCount += 1;
              logArr.push(data)
            }
          };
          res.json({
            _id: user['_id'],
            username: user['username'],
            count: totalCount,
            log: logArr 
          })
        })
      }
    }
  })
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
