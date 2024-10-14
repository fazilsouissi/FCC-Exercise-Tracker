const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL); // Connect to the database

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const UserSchema = new Schema({
  username: { type: String },
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_Id: { type: String, required: true },
  description: { type: String },
  duration: { type: Number },
  date: { type: Date },
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).select("_id username"); 
    if (!users) {
      res.send("No users found");
    }
    else {
      res.json(users);

    }
  } catch (error) {
    console.log(error);
  }
});


app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  try {
    const user = await User.findById(_id);
    if (!user) {
      res.send("User not found");
    } else {
      let exercises = await Exercise.find({ user_Id: _id });
      if (from) {
        exercises = exercises.filter((exercise) => exercise.date >= new Date(from));
      }
      if (to) {
        exercises = exercises.filter((exercise) => exercise.date <= new Date(to));
      }
      if (limit) {
        exercises = exercises.slice(0, limit);
      }
      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises.map((exercise) => ({
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString(),
        })),
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/users", async (req, res) => {
  console.log(req.body);
  const userObj = new User({ username: req.body.username });
  try {
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(_id);
    if (!user) {
      res.send("User not found");
    } else {
      const exerciseObj = new Exercise({
        user_Id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration : exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (error) {
    console.log(error);
    res.send("Error");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
