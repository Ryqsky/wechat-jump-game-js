function getImageData (src) {
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => {
      img.onerror = img.onload = null;
      let canvas = document.createElement('canvas');
      let width = (canvas.width = img.width);
      let height = (canvas.height = img.height);
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      let imgData = ctx.getImageData(0, 0, width, height);
      resolve(imgData);
    };
    img.onerror = (e) => {
      img.onerror = img.onload = null;
      e.message = '图片获取失败';
      e.code = 1;
      reject(e);
    };
    img.src = src;
  });
}

function tolerenceHelper (r, g, b, rt, gt, bt, t) {
  return r > rt - t && r < rt + t && g > gt - t && g < gt + t && b > bt - t && b < bt + t;
}

function getNextCenter (data, width, height, y = -1) {
  let startY = Math.floor(height / 4);
  let endY = Math.floor(height * 3 / 4);

  // 去除背景色
  let startX = startY * width * 4;
  let r = data[startX],
    g = data[startX + 1],
    b = data[startX + 2];
  let apex = [];
  let pos = [0, 0];
  // 保证从当前小人位置底部点往上
  endY = Math.min(endY, y);
  let endX = width;
  for (let y = startY; y < endY; y++) {
    for (let x = 1; x < endX; x++) {
      let i = y * (width * 4) + x * 4;
      let rt = data[i];
      let gt = data[i + 1];
      let bt = data[i + 2];
      // 不是默认背景颜色 同时不是小人颜色（已经被遮挡）
      if (!tolerenceHelper(rt, gt, bt, r, g, b, 30) && !tolerenceHelper(rt, gt, bt, 0, 255, 0, 1)) {
        //找出顶点
        const targetIndex = (y + 3) * (width * 4) + x * 4;
        const targetR = data[targetIndex];
        const targetG = data[targetIndex + 1];
        const targetB = data[targetIndex + 2];
        console.log(targetR, targetG, targetB);
        let tolerance = 10; // 公差
        let breakWhenRGB = null; // 遇到RGB则退出
        let endY = y + width * (1 / 4);
        let isSingleRecognition = true;
        // 特殊处理
        if (tolerenceHelper(targetR, targetG, targetB, 113, 113, 113, 1)) {
          // 如果是灰色块，则调小公差
          tolerance = 8
        }
        if (tolerenceHelper(targetR, targetG, targetB, 255, 238, 97, 1)) {
          // 如果是黄色块，则调小结束高度
          tolerance = 1;
          endY =  y + width * (1 / 5)
        }
        if (tolerenceHelper(targetR, targetG, targetB, 167, 160, 153, 10)) {
          // 如果是唱片，取消单个识别
          tolerance = 1;
          isSingleRecognition = false;
          endY =  y + width * (1 / 5);
        }
        if (tolerenceHelper(targetR, targetG, targetB, 224, 190, 155, 5)) {
          // 如果是树凳
          endY =  y + width * (1 / 5.3);
        }
        if (tolerenceHelper(targetR, targetG, targetB, 240, 240, 240, 1)) {
          // 如果是士多
          endY =  y + width * (1 / 5);
        }
        if (tolerenceHelper(targetR, targetG, targetB, 255, 255, 255, 1)) {
          // 如果是白色块，可能是纸巾
          tolerance = 1;
          breakWhenRGB = {
            r: 228,
            g: 228,
            b: 228,
            tolerance: 1
          }
        }
        const nextPosiData = getPositionByRGB({
          targetRGB: {
            r: data[targetIndex],
            g: data[targetIndex + 1],
            b: data[targetIndex + 2],
          },
          imageData: data,
          startX: x - width * (1 / 5),
          endX: x + width * (1 / 5),
          startY: y,
          endY,
          height,
          width,
          tolerance,
          isSingleRecognition,
          breakWhenRGB,
        });
        pos[0] = nextPosiData.middleX;
        pos[1] = nextPosiData.middleY;
        apex = [rt, gt, bt, x, y];
        break;
      } else {
        // 背景色涂红
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }
    if (apex.length !== 0) {
      break;
    }
  }
  return pos;
}

function getPositionByRGB (options) {
  const targetRGB = options.targetRGB || {
    r: 0,
    g: 0,
    b: 0,
  };
  const imageData = options.imageData;
  const height = options.height;
  const width = options.width;
  const breakWhenRGB = options.breakWhenRGB || null;
  const isSingleRecognition = options.isSingleRecognition || false;
  if (!imageData) {
    return false;
  }

  let minX = 999999;
  let minY = 999999;
  let maxX = -1;
  let maxY = -1;
  let pos = [0, 0];

  let startY = options.startY || Math.floor(height / 4);
  let endY = options.endY || Math.floor(height * 3 / 4);
  let startX = options.startX || 0;
  let endX = options.endX || width;
  let tolerance = options.tolerance || 16;
  let isFirstMatchY = false;
  for (let y = startY; y < endY; y++) {
    let isThisRowMatchY = false;
    for (let x = startX; x < endX; x++) {
      let i = y * (width * 4) + x * 4;
      let r = imageData[i];
      let g = imageData[i + 1];
      let b = imageData[i + 2];
      if (breakWhenRGB && Math.abs(x - Math.floor((startX + endX) / 2)) < 5 && tolerenceHelper(r, g, b, breakWhenRGB.r, breakWhenRGB.g, breakWhenRGB.b, breakWhenRGB.tolerance || tolerance)) {
        // 如果碰到背景色 就结束当前Y
        console.log('如果碰到背景色 就结束当前Y')
        endY = y;
      }
      if (y > pos[1] && tolerenceHelper(r, g, b, targetRGB.r, targetRGB.g, targetRGB.b, tolerance)) {
        // 将匹配到的像素点设置为红色
        imageData[i] = 0;
        imageData[i + 1] = 255;
        imageData[i + 2] = 0;
        isFirstMatchY = true;
        isThisRowMatchY = true;
        minX = Math.floor(Math.min(minX, x));
        maxX = Math.floor(Math.max(maxX, x));
        maxY = Math.floor(Math.max(maxY, y));
        minY = Math.floor(Math.min(minY, y));
      }
    }
    // 如果已经遇到过y了，后面没有遇到y的时候，中断
    if (isFirstMatchY && !isThisRowMatchY && isSingleRecognition) {
      endY = y;
    }
  }
  let middleX = Math.floor((maxX + minX) / 2);
  let middleY = Math.floor((maxY + minY) / 2);
  // console.log(`this position (x, y)= (${middleX}, ${middleY})`);
  return {
    minX,
    maxX,
    minY,
    maxY,
    middleX,
    middleY,
  };
}

async function getPosition (img) {
  let {data, width, height} = await getImageData(img);
  const imageData = data;
  // 小人现在的位置数据
  const curPosiData = getPositionByRGB({
    targetRGB: {
      r: 40,
      g: 43,
      b: 86,
    },
    imageData,
    height,
    width,
  });
  let pos1 = [curPosiData.middleX, curPosiData.maxY];
  // 遮挡小人
  for (let x = curPosiData.minX - 50; x < curPosiData.maxX + 50; x++) {
    for (let y = curPosiData.minY - 50; y < curPosiData.maxY + 50; y++) {
      let i = y * (width * 4) + x * 4;
      imageData[i] = 0;
      imageData[i + 1] = 255;
      imageData[i + 2] = 0;
    }
  }
  // 遮挡脚下
  const rhombusWidth = Math.floor(width / 4.3);
  let pointX;
  let pointY;
  for (let y = curPosiData.maxY - rhombusWidth; y < curPosiData.maxY + rhombusWidth; y++) {
    for (let x = curPosiData.middleX - rhombusWidth; x < curPosiData.middleX + rhombusWidth; x++) {
      let i = y * (width * 4) + x * 4;
      if (x < curPosiData.middleX) {
        pointX = curPosiData.middleX - rhombusWidth;
        pointY = curPosiData.maxY;
      } else {
        pointX = curPosiData.middleX + rhombusWidth;
        pointY = curPosiData.maxY;
      }
      if (Math.abs((y - pointY) / (x - pointX)) < 0.6) {
        imageData[i] = 0;
        imageData[i + 1] = 255;
        imageData[i + 2] = 0;
      }
    }
  }

  // let pos1 = [0, height];
  let pos2 = getNextCenter(imageData, width, height, pos1[1]);
  return {pos1, pos2, data: imageData, width, height};
}
