/**
 * Created by beiwan on 2017/12/29.
 */
const util = require('util');
const fs = require('fs');
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const fsCopyFile = util.promisify(fs.copyFile);
const fsMkdir = util.promisify(fs.mkdir);

const ADB_PATH = 'D:/adb/adb';
const SCREENCAP_REMOTE_PATH = '/sdcard/screencap.png';
const SCREENCAP_PATH = path.resolve('.', 'public/images/jump_screencap');

// 系数，如果感觉差一点点，可以微调该系数
const BOOM = 2.12;

jumpGo = async (timeout) => {
  let r = Math.random() * 20;
  if (timeout > 0 && !isNaN(timeout)) {
    const {stdout} = await exec(`${ADB_PATH} shell input swipe ${r + 10} ${r + 20} ${r - 10} ${r - 2} ${timeout}`);
    console.log(stdout, timeout);
  }
};

fetchScreenCap = async () => {
  try {
    const {stdout, stderr} = await exec(`${ADB_PATH} shell screencap -p ${SCREENCAP_REMOTE_PATH}`);
  } catch (e) {
    console.log(e);
  }
  console.log('fetch...');
};

pullScreenCap = async () => {
  try {
    const {stdout, stderr} = await exec(
      `${ADB_PATH} pull ${SCREENCAP_REMOTE_PATH} ${SCREENCAP_PATH}/screencap.png`,
      []
    );
  } catch (e) {
    console.log(e);
  }
  console.log('pull...');
};

copyImg = async () => {
  // 先创建目录
  try {
    await fsMkdir(path.resolve(__dirname, './public/images/history'));
  } catch (e) {
    // e
  }
  // 再复制文件
  try {
    const now = new Date();
    const fileName = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
    await fsCopyFile(`${SCREENCAP_PATH}/screencap.png`, `${path.resolve(__dirname, './public/images/history')}/${fileName}.png`);
  } catch (e) {
    console.log(e);
  }
};

jumpByDistance = async (distance) => {
  await jumpGo(Math.floor(distance * BOOM));
};

refreshScreenCap = async () => {
  await fetchScreenCap();
  await pullScreenCap();
  await copyImg();
};

module.exports = {
  jumpByDistance,
  refreshScreenCap
};
