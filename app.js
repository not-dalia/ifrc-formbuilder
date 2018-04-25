var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql');
const bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');




var app = express();
var connection = mysql.createConnection({
  host: process.env.AWS_DB_HOST,
  user: process.env.AWS_DB_USER,
  password: process.env.AWS_DB_PASS,
  database: process.env.AWS_DB_NAME,
  ssl: "Amazon RDS",
  charset: 'utf8mb4'
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);

app.get('/', function (req, res, next) {
  connection.query('SELECT * FROM forms', req.params.workshopPath, function (error, result, fields) {
    if (error || result.length == 0) {
      next(createError(404));
      return;
    }
    let tasks = result.map(el => { return {title: el.form_title, form_id: el.jotform_id} })
    console.log(result[0]);
    res.render('formselect', { title: 'FormBuilder', tasks: tasks });
  })
});


app.post('/generate_workshop', function (req, res, next) {
  try {
    if (!req.body.title || !req.body.language || !req.body.tasks) throw new Error('Missing fields')
    let path = req.body.title.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "") + Date.now();
    let workshop = {
      workshop_name: req.body.title,
      language: req.body.language,
      selected_tasks: JSON.stringify({ tasks: req.body.tasks }),
      path: path
    }
    connection.query('INSERT INTO generated_workshops SET ? ', workshop, function (error, results, fields) {
      if (error) {
        res.json({ success: false, error: error });
        return;
      }
      res.json({ success: true, path: 'https://ifrc-formbuilder.herokuapp.com/workshops/' + path });
    })
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/workshops/:workshopPath', function (req, res, next) {
  try {
    if (!req.params.workshopPath) throw new Error('Invalid URL');
    connection.query('SELECT * FROM generated_workshops WHERE path = ? ', req.params.workshopPath, function (error, result, fields) {
      if (error || result.length == 0) {
        next(createError(404));
        return;
      }
      console.log(result[0]);
      res.render('workshop', { title: result[0].workshop_name, language: result[0].language, tasks: JSON.parse(result[0].selected_tasks).tasks, path:  result[0].path, showHeaderLinks: true});
    })
  } catch (err) {
    next(createError(404));
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
