// const testUrl = '/images/demos/hd1.jpg';
let testUrl = '/images/demos/171124.png';
let id = getQueryStringByName('id');
if (id) {
  testUrl = `/images/demos/${id}.png`
}
const canvas = document.createElement('canvas');

function getQueryStringByName (name) {
  let result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
  if (result == null || result.length < 1) {
    return "";
  }
  return result[1];
}

function recognitionByUrl (testUrl) {
  getPosition(testUrl).then(({pos1, pos2, data, width, height}) => {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);

    const start = pos1[1] * width * 4 + pos1[0] * 4;
    const end = pos2[1] * width * 4 + pos2[0] * 4;
    for (let i = 0; i < data.length; i += 4) {
      if (near(i, start, end, 16)) {
        imgData.data[i] = 255;
        imgData.data[i + 1] = 0;
        imgData.data[i + 2] = 0;
      } else {
        imgData.data[i] = data[i];
        imgData.data[i + 1] = data[i + 1];
        imgData.data[i + 2] = data[i + 2];
      }
      imgData.data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    $('#canvas').append(canvas)
  });
}

recognitionByUrl(testUrl);

function near (i, start, end, t) {
  if ((i > start - t && i < start + t) || (i > end - t && i < end + t)) {
    return true;
  }
  return false;
}

// 获取图片列表
function getTestList () {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/getTestList',
      type: 'GET',
      dataType: 'json',
      success: function (result) {
        if (result && result.files) {
          console.log('获取图片成功');
          const $testList = $('.js-test-list');
          result.files.forEach(fileName => {
            $testList.append(`<li><a href="javascript:void(0);" onclick="recognitionByUrl('/images/demos/${fileName}')">${fileName}</a></li>`);
          });
          resolve(result.files);
        } else {
          reject('获取图片失败')
        }
      }
    });
  });
}
getTestList();

