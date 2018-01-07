const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const util = require('util');
const fsReaddirPromise = util.promisify(fs.readdir);
const opn = require('opn');

const app = express();

// 常规处理
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (err, req, res, next) {
  res.json = function (data) {
    res.send(JSON.stringify(data));
  };
  next();
});


// 跳一跳接口
const router = express.Router();
const utils = require('./utils.js');
router.post('/', async function (req, res, next) {
  try {
    await utils.iJump(req.body.distance);
    res.json({error: 0});
  } catch (e) {
    res.json({error: 1});
  }
});
router.post('/getscreencap', async function (req, res, next) {
  try {
    await utils.refreshScreencap();
    res.json({error: 0});
  } catch (e) {
    res.json({error: 1});
  }
});
app.use('/jumponejump', router);
app.use('/getTestList', async function (req, res, next) {
  const files = await fsReaddirPromise('./public/images/demos');
  res.json({files});
})


// 404 500 处理
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send('error');
});

// 启动
const port = process.env.PORT || '9000';
const server = app.listen(port);
server.on('listening', _ => {
  console.log(`Listening on http://localhost:${port}`);
  opn(`http://localhost:${port}`);
})
