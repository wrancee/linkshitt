'use strict';

function LinkGame(config) {
  if (!(this instanceof LinkGame)) {
    return new LinkGame(config);
  }
  this.score = 0; // 得分
  this.$box = $('#' + (config.boxId || 'game'));
  this.cellWidth = config.cellWidth || 45; // 每格的的宽度
  this.cellHeight = config.cellHeight || 45; // 每格的高度
  //this.cols = config.cols + 2 || 8; // 列数
  //this.rows = config.rows + 2 || 6; // 行数
  this.level = config.level || 0; // 等级
  this.rows = 6 ; // Number of rows
  this.cols = 6 ;
  this.leftDisorderTime = 5; // 剩余重排次数
  this.gifts = [ // 小图片集合
    'images/metashit/angit.png',
    'images/metashit/baseshit.png',
    'images/metashit/bloodyshit.png',
    'images/metashit/GoldenShit.png',

    'images/metashit/Shitcorn.png',
    'images/metashit/gentleshit.png',
    'images/metashit/grashit.png',

    'images/metashit/harris.png',
    'images/metashit/neon shity.png',
    'images/metashit/tigna.png',

    'images/metashit/trump.png',
    'images/metashit/paper.png',
    'images/metashit/plunger.png',

    'images/metashit/biden.png',
    'images/metashit/cyberpapper.png',
    'images/metashit/gangshiter.png',
  ];
  this.nums = [
    'assets/0.png',
    'assets/1.png',
    'assets/2.png',
    'assets/3.png',
    'assets/4.png',
    'assets/5.png',
    'assets/6.png',
    'assets/7.png',
    'assets/8.png',
    'assets/9.png',
  ];
  this.xnums = [
    'assets/x0.png',
    'assets/x1.png',
    'assets/x2.png',
    'assets/x3.png',
    'assets/x4.png',
    'assets/x5.png',
  ];
  this.pnums = [
    'assets/p0.png',
    'assets/p1.png',
    'assets/p2.png',
    'assets/p3.png',
    'assets/p4.png',
    'assets/p5.png',
    'assets/p6.png',
    'assets/p7.png',
    'assets/p8.png',
    'assets/p9.png',
  ];
  return this;
}

LinkGame.prototype = {
  init: function (isReset) {
    var self = this;
    this.stack = [];
    this.iconTypeCount = this.level * 3 + 4; // 图片的种类
    this.count = (this.rows - 2) * (this.cols - 2); // 图片的总数
    this.remain = this.count; // 剩余的未有消去的图片
    this.pictures = []; // 图片集合
    this.linkPictures = [];
    this.preClickInfo = null; // 上一次被点中的图片信息
    this.lastMatchedPic = null;
    this.leftTime = 100; // 剩余时间
    this.points = []; // 图片可以相消时的拐点集合
    this.timmer = setInterval(function () {
      self.updateCountDown();
    }, 1000);
    this.createMap();
    this.disorder();
    !isReset && this.bindDomEvents();
    this.updateLevel();
    this.domUpdateScore();
    this.domRemoveActiveAll();
  },
  reset: function () {
    this.init(true);
  },
  nextLevel: function () {
    clearInterval(this.timmer);
    if (this.level === 1){
      $('.level1').removeClass('hidden');
    }
    else if (this.level === 2) {
      $('.level2').removeClass('hidden');
    }
    else if (this.level === 3) {
      $('.level3').removeClass('hidden');
    }
    else if (this.level === 4) {
      $('.level4').removeClass('hidden');
    }
    else if (this.level === 5) {
      $('.level5').removeClass('hidden');
    }

  },
  // 模板替换
  replaceTpl: function (tpl, data) {
    return tpl.replace(/\${(\w+)}/ig, function (match, $1) {
      return data[$1];
    });
  },
  // 合并数组，并把相同的元素排除掉
  mergeArray: function (target, source) {
    source.forEach(function (e) {
      if (target.indexOf(e) === -1) {
        target.push(e);
      }
    })
  },
  // 生成一定范围内的随机数
  random: function (min, max) {
    return parseInt((Math.random() * max) + min);
  },
  // 交换对象属性
  swapProperties: function (obj1, obj2, properties) {
    properties.forEach(function (property) {
      var temp = obj1[property];
      obj1[property] = obj2[property];
      obj2[property] = temp;
    });
  },
  // 克隆对象（浅克隆）
  cloneObj: function (source) {
    var target = {};
    for (var pro in source) {
      source.hasOwnProperty(pro) && (target[pro] = source[pro]);
    }
    return target;
  },
  // 获取历史记录
  getHistoryScore: function () {
    return window.localStorage.getItem('highestScore') || 0;
  },
  // 保存最高分
  setHistoryScore: function (score) {
    var highestScore = this.getHistoryScore('highestScore');
    if (score > highestScore) {
      window.localStorage.setItem('highestScore', score);
    }

  },

  updateDomNumbers: function ($container, value, type) {
    var numList = [];
    var nums = type === 1 ? this.nums : (type === 2 ? this.xnums : this.pnums);
    $container.html('');
    do {
      numList.push(value % 10);
      value = parseInt(value / 10);
    } while (value > 0);

    while (numList.length) {
      $container.append(this.replaceTpl('<img src="${src}" />', {
        src: nums[numList.pop()]
      }));
    }
  },

  updateCountDown: function () {
    --this.leftTime;
    if (this.leftTime < 0) {
      clearInterval(this.timmer);
      this.gameOver();
      return;
    }
    this.updateDomNumbers($('.time'), this.leftTime, 1);
  },

  gameOver: function () {
    $('.game-over').removeClass('hidden');
    $('audio').get(0).pause();
    $('audio').get(1).play();
    this.updateDomNumbers($('.current-score'), this.score, 3);
    this.setHistoryScore(this.score);
  },

  gameWin: function () {
    $('.game-win').removeClass('hidden');
    this.updateDomNumbers($('.current'), this.score, 3);
    this.setHistoryScore(this.score);
  },

  updateLevel: function () {
    this.updateDomNumbers($('.level'), this.level + 1, 1);
  },

  createMap: function () {
    var count = 0;
    for (var row = 0; row < this.rows; row++) {
      this.pictures.push([]);
      for (var col = 0; col < this.cols; col++) {
        // 边界元素
        if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
          this.pictures[row].push({
            row: row,
            col: col,
            isEmpty: true,
            isBoundary: true
          });

          // 内部元素
        } else {
          this.pictures[row].push({
            row: row,
            col: col,
            isEmpty: false,
            index: count,
            pic: this.gifts[parseInt(count / 2) % this.iconTypeCount],
            width: this.cellWidth,
            height: this.cellHeight,
            isBoundary: false
          });
          count++;
        }

      }
    }
  },
  // 打乱顺序
  disorder: function () {
    var pictures = this.pictures;
    var random = this.random.bind(this);
    for (var i = 0; i < this.count * 10; i++) {
      // 随机选中2张图片，调用this.swapProperties交换俩人的pic和isEmpty属性
      var picture1 = pictures[random(1, this.rows - 2)][random(1, this.cols - 2)];
      var picture2 = pictures[random(1, this.rows - 2)][random(1, this.cols - 2)];
      this.swapProperties(picture1, picture2, ['pic', 'isEmpty']);
    }
    this.renderMap();
    this.updateDisorderTime();
  },

  updateDisorderTime: function () {
    this.updateDomNumbers($('.disorder'), this.leftDisorderTime, 2);
  },
  renderMap: function () {
    this.$box.html(''); // 将视图清空
    var html = '';
    var pictures = this.pictures;
    var tpl = '<td><div class="pic-box ${empty}" data-row="${row}" data-col="${col}" data-index="${index}"><img class="pic" draggable=false src="${pic}" width=${width} height=${height} /></div></td>';
    for (var row = 1; row < this.rows - 1; row++) {
      html += '<tr class="game-row">';
      for (var col = 1; col < this.cols - 1; col++) {
        var picture = this.cloneObj(pictures[row][col]);
        picture.empty = picture.isEmpty ? 'empty' : '';
        html += this.replaceTpl(tpl, picture);
      }
      html += '</tr>';
    }
    this.$box.html(html);
  },

  // 检测连通性
  checkMatch: function (curClickInfo) {
    var pictures = this.pictures,
      preClickInfo = this.preClickInfo ? this.preClickInfo : {},
      preRow = +preClickInfo.row,
      preCol = +preClickInfo.col,
      preIndex = +preClickInfo.index,
      curRow = +curClickInfo.row,
      curCol = +curClickInfo.col,
      curIndex = +curClickInfo.index;

    // 如果点击的图片是空白的，则退出
    if (pictures[curRow][curCol].isEmpty) {
      return;
    }
  
    if (preIndex === curIndex) {
      var isActive = this.isActive(preIndex);
      if (isActive) {
        this.domRemoveActive(preIndex);
      } 
      else{
        this.domAddActive(curIndex);
      }
      return;
    }

    this.preClickInfo = curClickInfo;
    this.domAddActive(curIndex);
    if (preIndex !== preIndex) { // NaN
      return;
    }
    if (pictures[preRow][preCol].pic !== pictures[curRow][curCol].pic) {
      this.domRemoveActive(preIndex);
      return;
    }
    var isActive = this.isActive(preIndex);
    if (isActive){
      if (this.canCleanup(preCol, preRow, curCol, curRow)) {
        this.linkPictures = [];
        for (var i = 0; i < this.points.length - 1; i++) {
          this.mergeArray(this.linkPictures, this.countPoints(this.points[i], this.points[i + 1]));
        }
        this.drawLine();
        this.updateStatus(preRow, preCol, curRow, curCol, preIndex, curIndex);

        this.lastMatchedPic = pictures[preRow][preCol].pic;
      } else {
        this.domRemoveActive(preIndex);
      }
    }
  },

  isActive: function(index) {
    return $('.game-row .pic-box').eq(index).hasClass('active');
  },

  countPoints: function (start, end) {
    var points = [];
    var pictures = this.pictures;
    if (start[0] === end[0]) { // 同列
      var x = start[0];
      if (start[1] > end[1]) { // 从下到上
        for (var i = start[1]; i >= end[1]; i--) {
          points.push(pictures[i][x]);
        }
      } else { // 从上到下
        for (var i = start[1]; i <= end[1]; i++) {
          points.push(pictures[i][x]);
        }
      }
    } else if (start[1] === end[1]) { // 同行
      var y = start[1];
      if (start[0] > end[0]) { // 从右到左
        for (var i = start[0]; i >= end[0]; i--) {
          points.push(pictures[y][i]);
        }
      } else { // 从左到右
        for (var i = start[0]; i <= end[0]; i++) {
          points.push(pictures[y][i]);
        }
      }
    }
    return points;
  },

  domAddActive: function (index) {
    $('.game-row .pic-box').eq(index).addClass('active');
    return this;
  },
  domRemoveActive: function (index) {
    $('.game-row .pic-box').eq(index).removeClass('active');
    return this;
  },
  domRemoveActiveAll: function () {
    $('.game-row .pic-box').removeClass('active');
    return this;
  },

  domAddEmpty: function (index) {
    $('.game-row .pic-box').eq(index).addClass('empty').removeClass('active');
    return this;
  },

  // 记分
  domUpdateScore: function () {
    this.updateDomNumbers($('.scoring'), this.score, 1);
  },
  
  // 连线
  drawLine: function (callback) {
    var $canvas = $('#canvas');
    if (!$canvas[0].getContext('2d')) return; // 不支持Canvas
    var linkList = this.linkPictures;
    var coordinate = [];
    var c = 0
    if (this.cols !== 12){
      c = (12 - this.cols)/2 * 80
    }
    for (var i = 0; i < linkList.length; i++) {
      var x = linkList[i].col === 0 ? 0 : (linkList[i].col === this.cols - 1 ? $('#game').width() : c + linkList[i].col * 80 - 40);
      var y = linkList[i].row === 0 ? 0 : (linkList[i].row === this.rows - 1 ? $('#game').height() : linkList[i].row * 80 - 40);
      coordinate.push([x, y]);
    }
    var ctx = $canvas[0].getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = "#fbff98";
    ctx.fillStyle = "#fbff98";
    ctx.lineWidth = 4;
    ctx.save();
    for (var i = 0; i < linkList.length; i++) {
      if (i === 0) {
        ctx.moveTo(coordinate[i][0], coordinate[i][1]);
      }
      ctx.lineTo(coordinate[i][0], coordinate[i][1]);
    }
    ctx.stroke();
    ctx.restore();
    $canvas.removeClass('hidden');
    setTimeout(function () {
      ctx.clearRect(0, 0, 800, 800);
      $canvas.addClass('hidden');
    }, 200);

  },

  updateStatus: function (preRow, preCol, curRow, curCol, preIndex, curIndex) {
    var self = this;
    this.remain -= 2;
    this.score += 10 * (this.linkPictures.length - 1);
    this.preClickInfo = null;
    this.domUpdateScore();
    setTimeout(function () {
      self.pictures[preRow][preCol].isEmpty = true;
      self.pictures[curRow][curCol].isEmpty = true;
      self.domAddEmpty(preIndex).domAddEmpty(curIndex);
      if (self.remain === 0) {
        ++self.level;
        self.nextLevel();
      }
    }, 200);
  },
  isRowEmpty: function (x1, y1, x2, y2) {
    if (y1 != y2) {
      return false;
    }
    x1 > x2 && (x1 = x1 + x2, x2 = x1 - x2, x1 = x1 - x2); //强制x1比x2小
    for (var j = x1 + 1; j < x2; ++j) { //from (x2,y2+1) to (x2,y1-1);
      if (!this.pictures[y1][j].isEmpty) {
        return false;
      }
    }
    return true;
  },
  isColEmpty: function (x1, y1, x2, y2) {
    if (x1 != x2) {
      return false;
    }
    y1 > y2 && (y1 = y1 + y2, y2 = y1 - y2, y1 = y1 - y2); //强制y1比y2小

    for (var i = y1 + 1; i < y2; ++i) { //from (x2+1,y2) to (x1-1,y2);
      if (!this.pictures[i][x1].isEmpty) {
        return false;
      }
    }
    return true;
  },

  addPoints: function () {
    var args = arguments,
      len = args.length,
      i = 0;

    for (; i < len;) {
      this.points.push(args[i++]);
    }
  },
  // 判断两个坐标是否可以相互消除
  canCleanup: function (x1, y1, x2, y2) {
    this.points = [];
    if (x1 === x2) {
      if (1 === y1 - y2 || 1 === y2 - y1) { //相邻
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else if (this.isColEmpty(x1, y1, x2, y2)) { //直线
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else { //两个拐点	(优化)
        var i = 1;
        while ((x1 + i < this.cols) && this.pictures[y1][x1 + i].isEmpty) {
          if (!this.pictures[y2][x2 + i].isEmpty) {
            break;
          } else {
            if (this.isColEmpty(x1 + i, y1, x1 + i, y2)) {
              this.addPoints([x1, y1], [x1 + i, y1], [x1 + i, y2], [x2, y2]);
              return true;
            }
            i++;
          }
        }
        i = 1;
        while ((x1 - i >= 0) && this.pictures[y1][x1 - i].isEmpty) {
          if (!this.pictures[y2][x2 - i].isEmpty) {
            break;
          } else {
            if (this.isColEmpty(x1 - i, y1, x1 - i, y2)) {
              this.addPoints([x1, y1], [x1 - i, y1], [x1 - i, y2], [x2, y2]);
              return true;
            }
            i++;
          }
        }

      }
    }

    if (y1 === y2) { //同行
      if (1 === x1 - x2 || 1 === x2 - x1) {
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else if (this.isRowEmpty(x1, y1, x2, y2)) {
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else {
        var i = 1;
        while ((y1 + i < this.rows) && this.pictures[y1 + i][x1].isEmpty) {
          if (!this.pictures[y2 + i][x2].isEmpty) {
            break;
          } else {
            if (this.isRowEmpty(x1, y1 + i, x2, y1 + i)) {
              this.addPoints([x1, y1], [x1, y1 + i], [x2, y1 + i], [x2, y2]);
              return true;
            }
            i++;
          }
        }
        i = 1;
        while ((y1 - i >= 0) && this.pictures[y1 - i][x1].isEmpty) {
          if (!this.pictures[y2 - i][x2].isEmpty) {
            break;
          } else {
            if (this.isRowEmpty(x1, y1 - i, x2, y1 - i)) {
              this.addPoints([x1, y1], [x1, y1 - i], [x2, y1 - i], [x2, y2]);
              return true;
            }
            i++;
          }
        }
      }
    }

    //一个拐点
    if (this.isRowEmpty(x1, y1, x2, y1) && this.pictures[y1][x2].isEmpty) { // (x1,y1) -> (x2,y1)
      if (this.isColEmpty(x2, y1, x2, y2)) { // (x1,y2) -> (x2,y2)
        this.addPoints([x1, y1], [x2, y1], [x2, y2]);
        return true;
      }
    }
    if (this.isColEmpty(x1, y1, x1, y2) && this.pictures[y2][x1].isEmpty) {
      if (this.isRowEmpty(x1, y2, x2, y2)) {
        this.addPoints([x1, y1], [x1, y2], [x2, y2]);
        return true;
      }
    }

    //不在一行的两个拐点
    if (x1 != x2 && y1 != y2) {
      i = x1;
      while (++i < this.cols) {
        if (!this.pictures[y1][i].isEmpty) {
          break;
        } else {
          if (this.isColEmpty(i, y1, i, y2) && this.isRowEmpty(i, y2, x2, y2) && this.pictures[y2][i].isEmpty) {
            this.addPoints([x1, y1], [i, y1], [i, y2], [x2, y2]);
            return true;
          }
        }
      }

      i = x1;
      while (--i >= 0) {
        if (!this.pictures[y1][i].isEmpty) {
          break;
        } else {
          if (this.isColEmpty(i, y1, i, y2) && this.isRowEmpty(i, y2, x2, y2) && this.pictures[y2][i].isEmpty) {
            this.addPoints([x1, y1], [i, y1], [i, y2], [x2, y2]);
            return true;
          }
        }
      }

      i = y1;
      while (++i < this.rows) {
        if (!this.pictures[i][x1].isEmpty) {
          break;
        } else {
          if (this.isRowEmpty(x1, i, x2, i) && this.isColEmpty(x2, i, x2, y2) && this.pictures[i][x2].isEmpty) {
            this.addPoints([x1, y1], [x1, i], [x2, i], [x2, y2]);
            return true;
          }
        }
      }

      i = y1;
      while (--i >= 0) {
        if (!this.pictures[i][x1].isEmpty) {
          break;
        } else {
          if (this.isRowEmpty(x1, i, x2, i) && this.isColEmpty(x2, i, x2, y2) && this.pictures[i][x2].isEmpty) {
            this.addPoints([x1, y1], [x1, i], [x2, i], [x2, y2]);
            return true;
          }
        }
      }
    }

    return false;
  },

  bindDomEvents: function () {
    var self = this;
    $('.wrapper').on('click', '.pic-box', function () {
      var supportDataSet = this.dataset ? true : false;
      var data = { // 兼容IE不支持dataset
        row: supportDataSet ? this.dataset.row : this.getAttribute('data-row'),
        col: supportDataSet ? this.dataset.col : this.getAttribute('data-col'),
        index: supportDataSet ? this.dataset.index : this.getAttribute('data-index')
      }
      self.checkMatch(data);
    }).on('click', '.disorder', function (event) {
      self.leftDisorderTime-- > 0 && self.disorder();
    }).on('click', '.level1', function (event) {
      self.rows = 6 + self.level;
      self.cols = 6 + self.level*2;
      self.reset();
      $('.level1').addClass('hidden');
    }).on('click', '.level2', function (event) {
      self.rows = 6 + self.level;
      self.cols = 6 + self.level*2;
      self.reset();
      $('.level2').addClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(2).play();
      setTimeout(function () {
        $('audio').get(2).pause();
        $('audio').get(0).play();
      }, 3000);
    }).on('click', '.level3', function (event) {
      self.rows = 6 + self.level;
      self.cols = 6 + self.level*2;
      self.reset();
      $('.level3').addClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(3).play();
      setTimeout(function () {
        $('audio').get(3).pause();
        $('audio').get(0).play();
      }, 1200);
    }).on('click', '.level4', function (event) {
      self.reset();
      $('.level4').addClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(4).play();
      $('.brandon').removeClass('hidden');
      setTimeout(function () {
        $('audio').get(4).pause();
        $('audio').get(0).play();
      }, 3000);
    }).on('click', '.level5', function (event) {
      $('.level5').addClass('hidden');
      $('.game-win').removeClass('hidden');
    }).on('click', '.replay-btn', function () {
      $('audio').get(1).pause();
      $('audio').get(0).play();
      self.score = 0;
      self.level = 0;
      self.rows = 6;
      self.cols = 6;
      self.leftDisorderTime = 5;
      $('.game-over').addClass('hidden');
      self.reset();
    });

    window.onbeforeunload = function (event) {
      return confirm("游戏可能会终止，您确定要刷新？");
    };
  },

  unbindDomEvents: function() {
    $('.wrapper').off('click', '.pic-box');
    $('.wrapper').off('click', '.disorder');
    $('.wrapper').off('click', '.level1');
    $('.wrapper').off('click', '.level2');
    $('.wrapper').off('click', '.level3');
    $('.wrapper').off('click', '.level4');
    $('.wrapper').off('click', '.level5');
    $('.wrapper').off('click', '.replay-btn');
  }
};


//bonus stage after level5
function bonusStage(config) {
  if (!(this instanceof bonusStage)) {
    return new bonusStage(config);
  }
  this.score = 0; // 得分
  this.$box = $('#' + (config.boxId || 'game'));
  this.cellWidth = config.cellWidth || 45; // 每格的的宽度
  this.cellHeight = config.cellHeight || 45; // 每格的高度
  this.cols = config.cols + 2 ; // 列数
  this.rows = config.rows + 2 ; // 行数
  this.level = -1; // 等级
  this.leftTime = 61; // 剩余时间
  this.leftDisorderTime = 1; // 剩余重排次数
  this.gifts = [ // 小图片集合
    'images/metashit/harris2.png',
    'images/metashit/trump2.png',
    'images/metashit/biden2.png',
    'images/metashit/satoshi.png',
    'images/metashit/boo.png',
  ];
  this.nums = [
    'assets/0.png',
    'assets/1.png',
    'assets/2.png',
    'assets/3.png',
    'assets/4.png',
    'assets/5.png',
    'assets/6.png',
    'assets/7.png',
    'assets/8.png',
    'assets/9.png',
  ];
  this.xnums = [
    'assets/x0.png',
    'assets/x1.png',
    'assets/x2.png',
    'assets/x3.png',
    'assets/x4.png',
    'assets/x5.png',
  ];
  this.pnums = [
    'assets/p0.png',
    'assets/p1.png',
    'assets/p2.png',
    'assets/p3.png',
    'assets/p4.png',
    'assets/p5.png',
    'assets/p6.png',
    'assets/p7.png',
    'assets/p8.png',
    'assets/p9.png',
  ];
  return this;
}

bonusStage.prototype = {
  init: function (isReset) {
    var self = this;
    this.stack = [];
    this.iconTypeCount = 5; // 图片的种类
    this.count = (this.rows - 2) * (this.cols - 2); // 图片的总数
    this.remain = this.count; // 剩余的未有消去的图片
    this.pictures = []; // 图片集合
    this.linkPictures = [];
    this.preClickInfo = null; // 上一次被点中的图片信息
    this.lastMatchedPic = null;
    this.points = []; // 图片可以相消时的拐点集合
    this.timmer = setInterval(function () {
      self.updateCountDown();
    }, 1000);
    this.createMap();
    this.disorder();
    !isReset && this.bindDomEvents();
    this.updateLevel();
    this.domUpdateScore();
    this.domRemoveActiveAll();
  },
  reset: function () {
    this.init(true);
  },
  nextLevel: function () {
    clearInterval(this.timmer);
    if (this.lastMatchedPic === "images/metashit/trump2.png"){
      $('.trump').removeClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(5).play();

      //setTimeout(function () {
        //$('audio').get(3).pause();
        //$('.trump').addClass('hidden');
        //$('.level1').removeClass('hidden');
      //}, 5000);
    }
    else if (this.lastMatchedPic === "images/metashit/harris2.png"){
      $('.harris').removeClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(2).play();
    }
    else if (this.lastMatchedPic === "images/metashit/biden2.png"){
      $('.biden').removeClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(4).play();
    }
    else if (this.lastMatchedPic === "images/metashit/boo.png"){
      $('.boo').removeClass('hidden');
      $('audio').get(0).pause();
      $('audio').get(6).play();
    }
    else if (this.lastMatchedPic === "images/metashit/satoshi.png"){
      $('.satoshi').removeClass('hidden');
      $('audio').get(0).pause();
    }
  },
  // 模板替换
  replaceTpl: function (tpl, data) {
    return tpl.replace(/\${(\w+)}/ig, function (match, $1) {
      return data[$1];
    });
  },
  // 合并数组，并把相同的元素排除掉
  mergeArray: function (target, source) {
    source.forEach(function (e) {
      if (target.indexOf(e) === -1) {
        target.push(e);
      }
    })
  },
  // 生成一定范围内的随机数
  random: function (min, max) {
    return parseInt((Math.random() * max) + min);
  },
  // 交换对象属性
  swapProperties: function (obj1, obj2, properties) {
    properties.forEach(function (property) {
      var temp = obj1[property];
      obj1[property] = obj2[property];
      obj2[property] = temp;
    });
  },
  // 克隆对象（浅克隆）
  cloneObj: function (source) {
    var target = {};
    for (var pro in source) {
      source.hasOwnProperty(pro) && (target[pro] = source[pro]);
    }
    return target;
  },
  // 获取历史记录
  getHistoryScore: function () {
    return window.localStorage.getItem('highestScore') || 0;
  },
  // 保存最高分
  setHistoryScore: function (score) {
    var highestScore = this.getHistoryScore('highestScore');
    if (score > highestScore) {
      window.localStorage.setItem('highestScore', score);
    }

  },

  updateDomNumbers: function ($container, value, type) {
    var numList = [];
    var nums = type === 1 ? this.nums : (type === 2 ? this.xnums : this.pnums);
    $container.html('');
    do {
      numList.push(value % 10);
      value = parseInt(value / 10);
    } while (value > 0);

    while (numList.length) {
      $container.append(this.replaceTpl('<img src="${src}" />', {
        src: nums[numList.pop()]
      }));
    }
  },

  updateCountDown: function () {
    --this.leftTime;
    if (this.leftTime < 0) {
      clearInterval(this.timmer);
      this.gameOver();
      return;
    }
    this.updateDomNumbers($('.time'), this.leftTime, 1);
  },

  updateLevel: function () {
    this.updateDomNumbers($('.level'), this.level + 1, 1);
  },

  createMap: function () {
    var count = 0;
    for (var row = 0; row < this.rows; row++) {
      this.pictures.push([]);
      for (var col = 0; col < this.cols; col++) {
        // 边界元素
        if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
          this.pictures[row].push({
            row: row,
            col: col,
            isEmpty: true,
            isBoundary: true
          });

          // 内部元素
        } else {
          this.pictures[row].push({
            row: row,
            col: col,
            isEmpty: false,
            index: count,
            pic: this.gifts[parseInt(count / 2) % this.iconTypeCount],
            width: this.cellWidth,
            height: this.cellHeight,
            isBoundary: false
          });
          count++;
        }

      }
    }
  },
  // 打乱顺序
  disorder: function () {
    var pictures = this.pictures;
    var random = this.random.bind(this);
    for (var i = 0; i < this.count * 10; i++) {
      // 随机选中2张图片，调用this.swapProperties交换俩人的pic和isEmpty属性
      var picture1 = pictures[random(1, this.rows - 2)][random(1, this.cols - 2)];
      var picture2 = pictures[random(1, this.rows - 2)][random(1, this.cols - 2)];
      this.swapProperties(picture1, picture2, ['pic', 'isEmpty']);
    }
    this.renderMap();
    this.updateDisorderTime();
  },

  updateDisorderTime: function () {
    this.updateDomNumbers($('.disorder'), this.leftDisorderTime, 2);
  },
  renderMap: function () {
    this.$box.html(''); // 将视图清空
    var html = '';
    var pictures = this.pictures;
    var tpl = '<td><div class="pic-box ${empty}" data-row="${row}" data-col="${col}" data-index="${index}"><img class="pic" draggable=false src="${pic}" width=${width} height=${height} /></div></td>';
    for (var row = 1; row < this.rows - 1; row++) {
      html += '<tr class="game-row">';
      for (var col = 1; col < this.cols - 1; col++) {
        var picture = this.cloneObj(pictures[row][col]);
        picture.empty = picture.isEmpty ? 'empty' : '';
        html += this.replaceTpl(tpl, picture);
      }
      html += '</tr>';
    }
    this.$box.html(html);
  },

  // 检测连通性
  checkMatch: function (curClickInfo) {
    var pictures = this.pictures,
      preClickInfo = this.preClickInfo ? this.preClickInfo : {},
      preRow = +preClickInfo.row,
      preCol = +preClickInfo.col,
      preIndex = +preClickInfo.index,
      curRow = +curClickInfo.row,
      curCol = +curClickInfo.col,
      curIndex = +curClickInfo.index;

    // 如果点击的图片是空白的，则退出
    if (pictures[curRow][curCol].isEmpty) {
      return;
    }
  
    if (preIndex === curIndex) {
      var isActive = this.isActive(preIndex);
      if (isActive) {
        this.domRemoveActive(preIndex);
      } 
      else{
        this.domAddActive(curIndex);
      }
      return;
    }

    this.preClickInfo = curClickInfo;
    this.domAddActive(curIndex);
    if (preIndex !== preIndex) { // NaN
      return;
    }
    if (pictures[preRow][preCol].pic !== pictures[curRow][curCol].pic) {
      this.domRemoveActive(preIndex);
      return;
    }
    var isActive = this.isActive(preIndex);
    if (isActive){
      if (this.canCleanup(preCol, preRow, curCol, curRow)) {
        this.linkPictures = [];
        for (var i = 0; i < this.points.length - 1; i++) {
          this.mergeArray(this.linkPictures, this.countPoints(this.points[i], this.points[i + 1]));
        }
        this.drawLine();
        this.updateStatus(preRow, preCol, curRow, curCol, preIndex, curIndex);

        this.lastMatchedPic = pictures[preRow][preCol].pic;
      } else {
        this.domRemoveActive(preIndex);
      }
    }
  },

  isActive: function(index) {
    return $('.game-row .pic-box').eq(index).hasClass('active');
  },

  countPoints: function (start, end) {
    var points = [];
    var pictures = this.pictures;
    if (start[0] === end[0]) { // 同列
      var x = start[0];
      if (start[1] > end[1]) { // 从下到上
        for (var i = start[1]; i >= end[1]; i--) {
          points.push(pictures[i][x]);
        }
      } else { // 从上到下
        for (var i = start[1]; i <= end[1]; i++) {
          points.push(pictures[i][x]);
        }
      }
    } else if (start[1] === end[1]) { // 同行
      var y = start[1];
      if (start[0] > end[0]) { // 从右到左
        for (var i = start[0]; i >= end[0]; i--) {
          points.push(pictures[y][i]);
        }
      } else { // 从左到右
        for (var i = start[0]; i <= end[0]; i++) {
          points.push(pictures[y][i]);
        }
      }
    }
    return points;
  },

  domAddActive: function (index) {
    $('.game-row .pic-box').eq(index).addClass('active');
    return this;
  },
  domRemoveActive: function (index) {
    $('.game-row .pic-box').eq(index).removeClass('active');
    return this;
  },
  domRemoveActiveAll: function () {
    $('.game-row .pic-box').removeClass('active');
    return this;
  },

  domAddEmpty: function (index) {
    $('.game-row .pic-box').eq(index).addClass('empty').removeClass('active');
    return this;
  },

  // 记分
  domUpdateScore: function () {
    this.updateDomNumbers($('.scoring'), this.score, 1);
  },
  
  // 连线
  drawLine: function (callback) {
    var $canvas = $('#canvas');
    if (!$canvas[0].getContext('2d')) return; // 不支持Canvas
    var linkList = this.linkPictures;
    var coordinate = [];
    for (var i = 0; i < linkList.length; i++) {
      var x = linkList[i].col === 0 ? 0 : (linkList[i].col === this.cols - 1 ? $('#game').width() : linkList[i].col * 80 - 40);
      var y = linkList[i].row === 0 ? 0 : (linkList[i].row === this.rows - 1 ? $('#game').height() : linkList[i].row * 80 - 40);
      coordinate.push([x, y]);
    }
    var ctx = $canvas[0].getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = "#fbff98";
    ctx.fillStyle = "#fbff98";
    ctx.lineWidth = 4;
    ctx.save();
    for (var i = 0; i < linkList.length; i++) {
      if (i === 0) {
        ctx.moveTo(coordinate[i][0], coordinate[i][1]);
      }
      ctx.lineTo(coordinate[i][0], coordinate[i][1]);
    }
    ctx.stroke();
    ctx.restore();
    $canvas.removeClass('hidden');
    setTimeout(function () {
      ctx.clearRect(0, 0, 800, 800);
      $canvas.addClass('hidden');
    }, 200);

  },

  updateStatus: function (preRow, preCol, curRow, curCol, preIndex, curIndex) {
    var self = this;
    this.remain -= 2;
    this.score += 10 * (this.linkPictures.length - 1);
    this.preClickInfo = null;
    this.domUpdateScore();
    setTimeout(function () {
      self.pictures[preRow][preCol].isEmpty = true;
      self.pictures[curRow][curCol].isEmpty = true;
      self.domAddEmpty(preIndex).domAddEmpty(curIndex);
      if (self.remain === 0) {
        ++self.level;
        self.nextLevel();
      }
    }, 200);
  },
  isRowEmpty: function (x1, y1, x2, y2) {
    if (y1 != y2) {
      return false;
    }
    x1 > x2 && (x1 = x1 + x2, x2 = x1 - x2, x1 = x1 - x2); //强制x1比x2小
    for (var j = x1 + 1; j < x2; ++j) { //from (x2,y2+1) to (x2,y1-1);
      if (!this.pictures[y1][j].isEmpty) {
        return false;
      }
    }
    return true;
  },
  isColEmpty: function (x1, y1, x2, y2) {
    if (x1 != x2) {
      return false;
    }
    y1 > y2 && (y1 = y1 + y2, y2 = y1 - y2, y1 = y1 - y2); //强制y1比y2小

    for (var i = y1 + 1; i < y2; ++i) { //from (x2+1,y2) to (x1-1,y2);
      if (!this.pictures[i][x1].isEmpty) {
        return false;
      }
    }
    return true;
  },

  addPoints: function () {
    var args = arguments,
      len = args.length,
      i = 0;

    for (; i < len;) {
      this.points.push(args[i++]);
    }
  },
  // 判断两个坐标是否可以相互消除
  canCleanup: function (x1, y1, x2, y2) {
    this.points = [];
    if (x1 === x2) {
      if (1 === y1 - y2 || 1 === y2 - y1) { //相邻
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else if (this.isColEmpty(x1, y1, x2, y2)) { //直线
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else { //两个拐点	(优化)
        var i = 1;
        while ((x1 + i < this.cols) && this.pictures[y1][x1 + i].isEmpty) {
          if (!this.pictures[y2][x2 + i].isEmpty) {
            break;
          } else {
            if (this.isColEmpty(x1 + i, y1, x1 + i, y2)) {
              this.addPoints([x1, y1], [x1 + i, y1], [x1 + i, y2], [x2, y2]);
              return true;
            }
            i++;
          }
        }
        i = 1;
        while ((x1 - i >= 0) && this.pictures[y1][x1 - i].isEmpty) {
          if (!this.pictures[y2][x2 - i].isEmpty) {
            break;
          } else {
            if (this.isColEmpty(x1 - i, y1, x1 - i, y2)) {
              this.addPoints([x1, y1], [x1 - i, y1], [x1 - i, y2], [x2, y2]);
              return true;
            }
            i++;
          }
        }

      }
    }

    if (y1 === y2) { //同行
      if (1 === x1 - x2 || 1 === x2 - x1) {
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else if (this.isRowEmpty(x1, y1, x2, y2)) {
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else {
        var i = 1;
        while ((y1 + i < this.rows) && this.pictures[y1 + i][x1].isEmpty) {
          if (!this.pictures[y2 + i][x2].isEmpty) {
            break;
          } else {
            if (this.isRowEmpty(x1, y1 + i, x2, y1 + i)) {
              this.addPoints([x1, y1], [x1, y1 + i], [x2, y1 + i], [x2, y2]);
              return true;
            }
            i++;
          }
        }
        i = 1;
        while ((y1 - i >= 0) && this.pictures[y1 - i][x1].isEmpty) {
          if (!this.pictures[y2 - i][x2].isEmpty) {
            break;
          } else {
            if (this.isRowEmpty(x1, y1 - i, x2, y1 - i)) {
              this.addPoints([x1, y1], [x1, y1 - i], [x2, y1 - i], [x2, y2]);
              return true;
            }
            i++;
          }
        }
      }
    }

    //一个拐点
    if (this.isRowEmpty(x1, y1, x2, y1) && this.pictures[y1][x2].isEmpty) { // (x1,y1) -> (x2,y1)
      if (this.isColEmpty(x2, y1, x2, y2)) { // (x1,y2) -> (x2,y2)
        this.addPoints([x1, y1], [x2, y1], [x2, y2]);
        return true;
      }
    }
    if (this.isColEmpty(x1, y1, x1, y2) && this.pictures[y2][x1].isEmpty) {
      if (this.isRowEmpty(x1, y2, x2, y2)) {
        this.addPoints([x1, y1], [x1, y2], [x2, y2]);
        return true;
      }
    }

    //不在一行的两个拐点
    if (x1 != x2 && y1 != y2) {
      i = x1;
      while (++i < this.cols) {
        if (!this.pictures[y1][i].isEmpty) {
          break;
        } else {
          if (this.isColEmpty(i, y1, i, y2) && this.isRowEmpty(i, y2, x2, y2) && this.pictures[y2][i].isEmpty) {
            this.addPoints([x1, y1], [i, y1], [i, y2], [x2, y2]);
            return true;
          }
        }
      }

      i = x1;
      while (--i >= 0) {
        if (!this.pictures[y1][i].isEmpty) {
          break;
        } else {
          if (this.isColEmpty(i, y1, i, y2) && this.isRowEmpty(i, y2, x2, y2) && this.pictures[y2][i].isEmpty) {
            this.addPoints([x1, y1], [i, y1], [i, y2], [x2, y2]);
            return true;
          }
        }
      }

      i = y1;
      while (++i < this.rows) {
        if (!this.pictures[i][x1].isEmpty) {
          break;
        } else {
          if (this.isRowEmpty(x1, i, x2, i) && this.isColEmpty(x2, i, x2, y2) && this.pictures[i][x2].isEmpty) {
            this.addPoints([x1, y1], [x1, i], [x2, i], [x2, y2]);
            return true;
          }
        }
      }

      i = y1;
      while (--i >= 0) {
        if (!this.pictures[i][x1].isEmpty) {
          break;
        } else {
          if (this.isRowEmpty(x1, i, x2, i) && this.isColEmpty(x2, i, x2, y2) && this.pictures[i][x2].isEmpty) {
            this.addPoints([x1, y1], [x1, i], [x2, i], [x2, y2]);
            return true;
          }
        }
      }
    }

    return false;
  },

  bindDomEvents: function () {
    var self = this;
    $('.wrapper').on('click', '.pic-box', function () {
      var supportDataSet = this.dataset ? true : false;
      var data = { // 兼容IE不支持dataset
        row: supportDataSet ? this.dataset.row : this.getAttribute('data-row'),
        col: supportDataSet ? this.dataset.col : this.getAttribute('data-col'),
        index: supportDataSet ? this.dataset.index : this.getAttribute('data-index')
      }
      self.checkMatch(data);
    }).on('click', '.disorder', function (event) {
      self.leftDisorderTime-- > 0 && self.disorder();
    });

    window.onbeforeunload = function (event) {
      return confirm("游戏可能会终止，您确定要刷新？");
    };
  },
  unbindDomEvents: function() {
    $('.wrapper').off('click', '.pic-box');
    $('.wrapper').off('click', '.disorder');
  }
};

//Limited time game
function LinkGame2(config) {
  if (!(this instanceof LinkGame2)) {
    return new LinkGame2(config);
  }
  this.score = 0; // 得分
  this.$box = $('#' + (config.boxId || 'game'));
  this.cellWidth = config.cellWidth || 45; // 每格的的宽度
  this.cellHeight = config.cellHeight || 45; // 每格的高度
  this.cols = config.cols + 2 ; // 列数
  this.rows = config.rows + 2 ; // 行数
  this.level = config.level || 0; // 等级
  this.leftTime = 201; // 剩余时间
  this.leftDisorderTime = 5; // 剩余重排次数
  this.gifts = [ // 小图片集合
    'images/metashit/angit.png',
    'images/metashit/baseshit.png',
    'images/metashit/bloodyshit.png',
    'images/metashit/GoldenShit.png',

    'images/metashit/Shitcorn.png',
    'images/metashit/gentleshit.png',
    'images/metashit/grashit.png',

    'images/metashit/necroshit.png',
    'images/metashit/neon shity.png',
    'images/metashit/harris.png',

    'images/metashit/paper.png',
    'images/metashit/plunger.png',
    'images/metashit/shyberpunk.png',

    'images/metashit/cyberpapper.png',
    'images/metashit/flush button.png',
    'images/metashit/gangshiter.png',
  ];
  this.nums = [
    'assets/0.png',
    'assets/1.png',
    'assets/2.png',
    'assets/3.png',
    'assets/4.png',
    'assets/5.png',
    'assets/6.png',
    'assets/7.png',
    'assets/8.png',
    'assets/9.png',
  ];
  this.xnums = [
    'assets/x0.png',
    'assets/x1.png',
    'assets/x2.png',
    'assets/x3.png',
    'assets/x4.png',
    'assets/x5.png',
  ];
  this.pnums = [
    'assets/p0.png',
    'assets/p1.png',
    'assets/p2.png',
    'assets/p3.png',
    'assets/p4.png',
    'assets/p5.png',
    'assets/p6.png',
    'assets/p7.png',
    'assets/p8.png',
    'assets/p9.png',
  ];
  return this;
}

LinkGame2.prototype = {
  init2: function (isReset) {
    var self = this;
    this.stack = [];
    this.iconTypeCount = 16; // 图片的种类
    this.count = (this.rows - 2) * (this.cols - 2); // 图片的总数
    this.remain = this.count; // 剩余的未有消去的图片
    this.pictures = []; // 图片集合
    this.linkPictures = [];
    this.preClickInfo = null; // 上一次被点中的图片信息
    this.points = []; // 图片可以相消时的拐点集合
    this.timmer = setInterval(function () {
      self.updateCountDown();
    }, 1000);
    this.createMap();
    this.disorder();
    !isReset && this.bindDomEvents();
    this.updateLevel();
    this.domUpdateScore();
    this.domRemoveActiveAll();
  },
  reset: function () {
    this.init2(true);
  },
  nextLevel: function () {
    clearInterval(this.timmer);
    this.reset();
  },
  // 模板替换
  replaceTpl: function (tpl, data) {
    return tpl.replace(/\${(\w+)}/ig, function (match, $1) {
      return data[$1];
    });
  },
  // 合并数组，并把相同的元素排除掉
  mergeArray: function (target, source) {
    source.forEach(function (e) {
      if (target.indexOf(e) === -1) {
        target.push(e);
      }
    })
  },
  // 生成一定范围内的随机数
  random: function (min, max) {
    return parseInt((Math.random() * max) + min);
  },
  // 交换对象属性
  swapProperties: function (obj1, obj2, properties) {
    properties.forEach(function (property) {
      var temp = obj1[property];
      obj1[property] = obj2[property];
      obj2[property] = temp;
    });
  },
  // 克隆对象（浅克隆）
  cloneObj: function (source) {
    var target = {};
    for (var pro in source) {
      source.hasOwnProperty(pro) && (target[pro] = source[pro]);
    }
    return target;
  },
  // 获取历史记录
  getHistoryScore: function () {
    return window.localStorage.getItem('highestScore') || 0;
  },
  // 保存最高分
  setHistoryScore: function (score) {
    var highestScore = this.getHistoryScore('highestScore');
    if (score > highestScore) {
      window.localStorage.setItem('highestScore', score);
    }

  },

  updateDomNumbers: function ($container, value, type) {
    var numList = [];
    var nums = type === 1 ? this.nums : (type === 2 ? this.xnums : this.pnums);
    $container.html('');
    do {
      numList.push(value % 10);
      value = parseInt(value / 10);
    } while (value > 0);

    while (numList.length) {
      $container.append(this.replaceTpl('<img src="${src}" />', {
        src: nums[numList.pop()]
      }));
    }
  },

  updateCountDown: function () {
    --this.leftTime;
    if (this.leftTime < 0) {
      clearInterval(this.timmer);
      this.gameOver();
      return;
    }
    this.updateDomNumbers($('.time'), this.leftTime, 1);
  },

  gameOver: function () {
    $('.time-out').removeClass('hidden');
    $('audio').get(0).pause();
    $('audio').get(1).play();
    this.updateDomNumbers($('.current-score3'), this.score, 3);
    this.setHistoryScore(this.score);
  },

  updateLevel: function () {
    this.updateDomNumbers($('.level'), this.level + 1, 1);
  },

  createMap: function () {
    var count = 0;
    for (var row = 0; row < this.rows; row++) {
      this.pictures.push([]);
      for (var col = 0; col < this.cols; col++) {
        // 边界元素
        if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
          this.pictures[row].push({
            row: row,
            col: col,
            isEmpty: true,
            isBoundary: true
          });

          // 内部元素
        } else {
          this.pictures[row].push({
            row: row,
            col: col,
            isEmpty: false,
            index: count,
            pic: this.gifts[parseInt(count / 2) % this.iconTypeCount],
            width: this.cellWidth,
            height: this.cellHeight,
            isBoundary: false
          });
          count++;
        }

      }
    }
  },
  // 打乱顺序
  disorder: function () {
    var pictures = this.pictures;
    var random = this.random.bind(this);
    for (var i = 0; i < this.count * 10; i++) {
      // 随机选中2张图片，调用this.swapProperties交换俩人的pic和isEmpty属性
      var picture1 = pictures[random(1, this.rows - 2)][random(1, this.cols - 2)];
      var picture2 = pictures[random(1, this.rows - 2)][random(1, this.cols - 2)];
      this.swapProperties(picture1, picture2, ['pic', 'isEmpty']);
    }
    this.renderMap();
    this.updateDisorderTime();
  },

  updateDisorderTime: function () {
    this.updateDomNumbers($('.disorder'), this.leftDisorderTime, 2);
  },
  renderMap: function () {
    this.$box.html(''); // 将视图清空
    var html = '';
    var pictures = this.pictures;
    var tpl = '<td><div class="pic-box ${empty}" data-row="${row}" data-col="${col}" data-index="${index}"><img class="pic" draggable=false src="${pic}" width=${width} height=${height} /></div></td>';
    for (var row = 1; row < this.rows - 1; row++) {
      html += '<tr class="game-row">';
      for (var col = 1; col < this.cols - 1; col++) {
        var picture = this.cloneObj(pictures[row][col]);
        picture.empty = picture.isEmpty ? 'empty' : '';
        html += this.replaceTpl(tpl, picture);
      }
      html += '</tr>';
    }
    this.$box.html(html);
  },

  // 检测连通性
  checkMatch: function (curClickInfo) {
    var pictures = this.pictures,
      preClickInfo = this.preClickInfo ? this.preClickInfo : {},
      preRow = +preClickInfo.row,
      preCol = +preClickInfo.col,
      preIndex = +preClickInfo.index,
      curRow = +curClickInfo.row,
      curCol = +curClickInfo.col,
      curIndex = +curClickInfo.index;

    // 如果点击的图片是空白的，则退出
    if (pictures[curRow][curCol].isEmpty) {
      return;
    }
  
    if (preIndex === curIndex) {
      var isActive = this.isActive(preIndex);
      if (isActive) {
        this.domRemoveActive(preIndex);
      } 
      else{
        this.domAddActive(curIndex);
      }
      return;
    }

    this.preClickInfo = curClickInfo;
    this.domAddActive(curIndex);
    if (preIndex !== preIndex) { // NaN
      return;
    }
    if (pictures[preRow][preCol].pic !== pictures[curRow][curCol].pic) {
      this.domRemoveActive(preIndex);
      return;
    }
    var isActive = this.isActive(preIndex);
    if (isActive){
      if (this.canCleanup(preCol, preRow, curCol, curRow)) {
        this.linkPictures = [];
        for (var i = 0; i < this.points.length - 1; i++) {
          this.mergeArray(this.linkPictures, this.countPoints(this.points[i], this.points[i + 1]));
        }
        this.drawLine();
        this.updateStatus(preRow, preCol, curRow, curCol, preIndex, curIndex);
      } else {
        this.domRemoveActive(preIndex);
      }
    }
  },

  isActive: function(index) {
    return $('.game-row .pic-box').eq(index).hasClass('active');
  },

  countPoints: function (start, end) {
    var points = [];
    var pictures = this.pictures;
    if (start[0] === end[0]) { // 同列
      var x = start[0];
      if (start[1] > end[1]) { // 从下到上
        for (var i = start[1]; i >= end[1]; i--) {
          points.push(pictures[i][x]);
        }
      } else { // 从上到下
        for (var i = start[1]; i <= end[1]; i++) {
          points.push(pictures[i][x]);
        }
      }
    } else if (start[1] === end[1]) { // 同行
      var y = start[1];
      if (start[0] > end[0]) { // 从右到左
        for (var i = start[0]; i >= end[0]; i--) {
          points.push(pictures[y][i]);
        }
      } else { // 从左到右
        for (var i = start[0]; i <= end[0]; i++) {
          points.push(pictures[y][i]);
        }
      }
    }
    return points;
  },

  domAddActive: function (index) {
    $('.game-row .pic-box').eq(index).addClass('active');
    return this;
  },
  domRemoveActive: function (index) {
    $('.game-row .pic-box').eq(index).removeClass('active');
    return this;
  },
  domRemoveActiveAll: function () {
    $('.game-row .pic-box').removeClass('active');
    return this;
  },

  domAddEmpty: function (index) {
    $('.game-row .pic-box').eq(index).addClass('empty').removeClass('active');
    return this;
  },

  // 记分
  domUpdateScore: function () {
    this.updateDomNumbers($('.scoring'), this.score, 1);
  },
  
  // 连线
  drawLine: function (callback) {
    var $canvas = $('#canvas');
    if (!$canvas[0].getContext('2d')) return; // 不支持Canvas
    var linkList = this.linkPictures;
    var coordinate = [];
    for (var i = 0; i < linkList.length; i++) {
      var x = linkList[i].col === 0 ? 0 : (linkList[i].col === this.cols - 1 ? $('#game').width() : linkList[i].col * 80 - 40);
      var y = linkList[i].row === 0 ? 0 : (linkList[i].row === this.rows - 1 ? $('#game').height() : linkList[i].row * 80 - 40);
      coordinate.push([x, y]);
    }
    var ctx = $canvas[0].getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = "#fbff98";
    ctx.fillStyle = "#fbff98";
    ctx.lineWidth = 4;
    ctx.save();
    for (var i = 0; i < linkList.length; i++) {
      if (i === 0) {
        ctx.moveTo(coordinate[i][0], coordinate[i][1]);
      }
      ctx.lineTo(coordinate[i][0], coordinate[i][1]);
    }
    ctx.stroke();
    ctx.restore();
    $canvas.removeClass('hidden');
    setTimeout(function () {
      ctx.clearRect(0, 0, 800, 800);
      $canvas.addClass('hidden');
    }, 200);

  },

  updateStatus: function (preRow, preCol, curRow, curCol, preIndex, curIndex) {
    var self = this;
    this.remain -= 2;
    this.score += 10 * (this.linkPictures.length - 1);
    this.preClickInfo = null;
    this.domUpdateScore();
    setTimeout(function () {
      self.pictures[preRow][preCol].isEmpty = true;
      self.pictures[curRow][curCol].isEmpty = true;
      self.domAddEmpty(preIndex).domAddEmpty(curIndex);
      if (self.remain === 0) {
        ++self.level;
        self.nextLevel();
      }
    }, 200);
  },
  isRowEmpty: function (x1, y1, x2, y2) {
    if (y1 != y2) {
      return false;
    }
    x1 > x2 && (x1 = x1 + x2, x2 = x1 - x2, x1 = x1 - x2); //强制x1比x2小
    for (var j = x1 + 1; j < x2; ++j) { //from (x2,y2+1) to (x2,y1-1);
      if (!this.pictures[y1][j].isEmpty) {
        return false;
      }
    }
    return true;
  },
  isColEmpty: function (x1, y1, x2, y2) {
    if (x1 != x2) {
      return false;
    }
    y1 > y2 && (y1 = y1 + y2, y2 = y1 - y2, y1 = y1 - y2); //强制y1比y2小

    for (var i = y1 + 1; i < y2; ++i) { //from (x2+1,y2) to (x1-1,y2);
      if (!this.pictures[i][x1].isEmpty) {
        return false;
      }
    }
    return true;
  },

  addPoints: function () {
    var args = arguments,
      len = args.length,
      i = 0;

    for (; i < len;) {
      this.points.push(args[i++]);
    }
  },
  // 判断两个坐标是否可以相互消除
  canCleanup: function (x1, y1, x2, y2) {
    this.points = [];
    if (x1 === x2) {
      if (1 === y1 - y2 || 1 === y2 - y1) { //相邻
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else if (this.isColEmpty(x1, y1, x2, y2)) { //直线
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else { //两个拐点	(优化)
        var i = 1;
        while ((x1 + i < this.cols) && this.pictures[y1][x1 + i].isEmpty) {
          if (!this.pictures[y2][x2 + i].isEmpty) {
            break;
          } else {
            if (this.isColEmpty(x1 + i, y1, x1 + i, y2)) {
              this.addPoints([x1, y1], [x1 + i, y1], [x1 + i, y2], [x2, y2]);
              return true;
            }
            i++;
          }
        }
        i = 1;
        while ((x1 - i >= 0) && this.pictures[y1][x1 - i].isEmpty) {
          if (!this.pictures[y2][x2 - i].isEmpty) {
            break;
          } else {
            if (this.isColEmpty(x1 - i, y1, x1 - i, y2)) {
              this.addPoints([x1, y1], [x1 - i, y1], [x1 - i, y2], [x2, y2]);
              return true;
            }
            i++;
          }
        }

      }
    }

    if (y1 === y2) { //同行
      if (1 === x1 - x2 || 1 === x2 - x1) {
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else if (this.isRowEmpty(x1, y1, x2, y2)) {
        this.addPoints([x1, y1], [x2, y2]);
        return true;
      } else {
        var i = 1;
        while ((y1 + i < this.rows) && this.pictures[y1 + i][x1].isEmpty) {
          if (!this.pictures[y2 + i][x2].isEmpty) {
            break;
          } else {
            if (this.isRowEmpty(x1, y1 + i, x2, y1 + i)) {
              this.addPoints([x1, y1], [x1, y1 + i], [x2, y1 + i], [x2, y2]);
              return true;
            }
            i++;
          }
        }
        i = 1;
        while ((y1 - i >= 0) && this.pictures[y1 - i][x1].isEmpty) {
          if (!this.pictures[y2 - i][x2].isEmpty) {
            break;
          } else {
            if (this.isRowEmpty(x1, y1 - i, x2, y1 - i)) {
              this.addPoints([x1, y1], [x1, y1 - i], [x2, y1 - i], [x2, y2]);
              return true;
            }
            i++;
          }
        }
      }
    }

    //一个拐点
    if (this.isRowEmpty(x1, y1, x2, y1) && this.pictures[y1][x2].isEmpty) { // (x1,y1) -> (x2,y1)
      if (this.isColEmpty(x2, y1, x2, y2)) { // (x1,y2) -> (x2,y2)
        this.addPoints([x1, y1], [x2, y1], [x2, y2]);
        return true;
      }
    }
    if (this.isColEmpty(x1, y1, x1, y2) && this.pictures[y2][x1].isEmpty) {
      if (this.isRowEmpty(x1, y2, x2, y2)) {
        this.addPoints([x1, y1], [x1, y2], [x2, y2]);
        return true;
      }
    }

    //不在一行的两个拐点
    if (x1 != x2 && y1 != y2) {
      i = x1;
      while (++i < this.cols) {
        if (!this.pictures[y1][i].isEmpty) {
          break;
        } else {
          if (this.isColEmpty(i, y1, i, y2) && this.isRowEmpty(i, y2, x2, y2) && this.pictures[y2][i].isEmpty) {
            this.addPoints([x1, y1], [i, y1], [i, y2], [x2, y2]);
            return true;
          }
        }
      }

      i = x1;
      while (--i >= 0) {
        if (!this.pictures[y1][i].isEmpty) {
          break;
        } else {
          if (this.isColEmpty(i, y1, i, y2) && this.isRowEmpty(i, y2, x2, y2) && this.pictures[y2][i].isEmpty) {
            this.addPoints([x1, y1], [i, y1], [i, y2], [x2, y2]);
            return true;
          }
        }
      }

      i = y1;
      while (++i < this.rows) {
        if (!this.pictures[i][x1].isEmpty) {
          break;
        } else {
          if (this.isRowEmpty(x1, i, x2, i) && this.isColEmpty(x2, i, x2, y2) && this.pictures[i][x2].isEmpty) {
            this.addPoints([x1, y1], [x1, i], [x2, i], [x2, y2]);
            return true;
          }
        }
      }

      i = y1;
      while (--i >= 0) {
        if (!this.pictures[i][x1].isEmpty) {
          break;
        } else {
          if (this.isRowEmpty(x1, i, x2, i) && this.isColEmpty(x2, i, x2, y2) && this.pictures[i][x2].isEmpty) {
            this.addPoints([x1, y1], [x1, i], [x2, i], [x2, y2]);
            return true;
          }
        }
      }
    }

    return false;
  },

  bindDomEvents: function () {
    var self = this;
    $('.wrapper').on('click', '.pic-box', function () {
      var supportDataSet = this.dataset ? true : false;
      var data = { // 兼容IE不支持dataset
        row: supportDataSet ? this.dataset.row : this.getAttribute('data-row'),
        col: supportDataSet ? this.dataset.col : this.getAttribute('data-col'),
        index: supportDataSet ? this.dataset.index : this.getAttribute('data-index')
      }
      self.checkMatch(data);
    }).on('click', '.disorder', function (event) {
      self.leftDisorderTime-- > 0 && self.disorder();
    });

    window.onbeforeunload = function (event) {
      return confirm("游戏可能会终止，您确定要刷新？");
    };
  },
  unbindDomEvents: function() {
    $('.wrapper').off('click', '.pic-box');
    $('.wrapper').off('click', '.disorder');
  }
};


//log in functions
$(function () {
  $('.login-btn').click(async function () {
      if (window.solana && window.solana.isPhantom) {
          try {
              await window.solana.connect();
              let defAddress = window.solana.publicKey;
              const address = defAddress.toString();
              $('#wallet-address').text(`Connected wallet address: ${address}`);

              const isRegistered = await checkAddressRegistration(address);
                if (isRegistered) {
                  await loginWithWallet(address);
                  $('audio').get(0).play();
                  $('.login').addClass('hidden');
                  $('.init-box').removeClass('hidden');
                } else {
                    console.log('The address is not registered.');
                    $('.login').addClass('hidden');
                    $('.newPlayer').removeClass('hidden');
                }
            } catch (error) {
                console.error('Failed to connect to the wallet:', error);
            }
        } else {
            alert('Please install a Solana wallet extension like Phantom.');
        }
  });
});

$(function () {
  $('.claim').click(async function () {
    const address = $('#wallet-address').text();
        if (address) {
            await claimAndRegisterUser(address);
        } else {
            alert('No wallet address found. Please connect your wallet first.');
        }
  });
});

async function checkAddressRegistration(address) {
  try {
      const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/isAddressRegistered', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nativeAddress: address }),
      });

      if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.data; // Assuming 'data' field in the response contains the registration status
  } catch (error) {
      console.error('Error checking address registration:', error);
      return false;
  }
}

async function loginWithWallet(address) {
  const nonce = Date.now().toString();
  const message = `Login with wallet: ${address}, nonce: ${nonce}`;
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await window.solana.signMessage(encodedMessage, 'utf8');

  try {
      const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/loginWithWallet', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              nativeAccount: address,
              nonce: nonce,
              sign: signature,
          }),
      });

      if (!response.ok) {
          throw new Error(`Login API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Login successful, JWT token:', result.Access);
      // Store the JWT token or handle it as needed
  } catch (error) {
      console.error('Error logging in:', error);
  }
}

async function claimAndRegisterUser(address) {
  const nonce = Date.now().toString();
  const userName = generateRandomUsername();
  const tokenSymbol = "OShit";
  const brand = "OShit";
  const message = `I am registering for this game SHIT Match for token OShit with my address ${address} with nonce ${nonce}`;
  
  try {
    // Sign the message with the wallet
    const signedMessage = await window.solana.signMessage(new TextEncoder().encode(message), 'utf8');

    // Prepare the transaction to be signed
    const { transaction, encodedTx } = await prepareTransaction(address);

    // Sign the transaction with the wallet
    const signedTransaction = await window.solana.signTransaction(transaction);
    const encodedTransaction = bs58.encode(signedTransaction.serialize());
    console.log('Transaction signed successfully.');

    // Call the API to register and claim the token
    const response = await fetch('https://testnet.oshit.io/meme/api/v1/sol/game/claimAndRegisterUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand: brand,
        tokenSymbol: tokenSymbol,
        encodedTx: encodedTransaction,
        userName: userName,
        nonce: nonce,
        sign: bs58.encode(signedMessage.signature || ''),
      }),
    });

    if (!response.ok) {
      throw new Error(`Claim and register API request failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Claim and register successful, Transaction ID:', result.txId);
    // Handle the transaction ID as needed
  } catch (error) {
    console.error('Error claiming and registering user:', error);
  }
}

// Helper function to prepare the transaction
async function prepareTransaction(address) {
  // Create and set up the transaction
  const transaction = new Transaction();
  
  // Add example instructions; adjust based on your use case
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: address,
      toPubkey: address,
      lamports: 1000, // Example amount
    })
  );
  
  // Serialize and encode the transaction
  const encodedTx = bs58.encode(transaction.serialize());
  
  return { transaction, encodedTx };
}

function generateRandomUsername() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let username = 'User_';
  for (let i = 0; i < 8; i++) {
      username += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return username;
}

async function signTransaction(address) {
  const transaction = new Uint8Array([/* ...transaction bytes... */]);

  const signedTransaction = await window.solana.signTransaction(transaction);

  const encodedTx = btoa(String.fromCharCode(...signedTransaction));
  return encodedTx;
}



$(function () {
  $('.start-game').click(function () {
    $('audio').get(0).play();
    $('.login').addClass('hidden');
    $('.game-box').removeClass('hidden');
    var gameConfig = {
      cellWidth: 45,
      cellHeight: 45,
      level: 0,
    }
    window.linkgame = new LinkGame(gameConfig);
    linkgame.init();
  });
});

$(function () {
  $('.start-btn1').click(function () {
    $('audio').get(0).play();
    $('.init-box').addClass('hidden');
    $('.normalbg').removeClass('hidden');
    setTimeout(function () {
      $('.normalbg').addClass('hidden');
      $('.game-box').removeClass('hidden');
    }, 2400);
    var gameConfig = {
      cellWidth: 45,
      cellHeight: 45,
      level: 0,
    }
    window.linkgame = new LinkGame(gameConfig);
    linkgame.init();
  });
});

$(function () {
  $('.start-btn2').click(function () {
    $('audio').get(0).play();
    $('.init-box').addClass('hidden');
    $('.limitedbg').removeClass('hidden');
    setTimeout(function () {
      $('.limitedbg').addClass('hidden');
      $('.game-box').removeClass('hidden');
    }, 2400);
    var gameConfig = {
      cellWidth: 45,
      cellHeight: 45,
      rows: 7,
      cols: 10,
      level: 0,
    }
    window.linkgame = new LinkGame2(gameConfig);
    linkgame.init2();
  });
});


$(function () {
  $('.back-btn').click(function () {
    window.linkgame.unbindDomEvents();
    $('.init-box').removeClass('hidden');
    $('.game-box').addClass('hidden');
    $('.game-over').addClass('hidden');
  });
});

$(function () {
  $('.back-btn2').click(function () {
    window.linkgame.unbindDomEvents();
    $('.init-box').removeClass('hidden');
    $('.game-box').addClass('hidden');
    $('.game-win').addClass('hidden');
  });
});

$(function () {
  $('.back-btn3').click(function () {
    window.linkgame.unbindDomEvents();
    $('.init-box').removeClass('hidden');
    $('.game-box').addClass('hidden');
    $('.time-out').addClass('hidden');
  });
});

$(function () {
  $('.logo').click(function () {
    //rules appear
    $('audio').get(0).play();
    $('.init-box').addClass('hidden');
    $('.game-box').removeClass('hidden');
    var gameConfig = {
      cellWidth: 45,
      cellHeight: 45,
      rows: 7,
      cols: 10,
    }
    window.linkgame = new bonusStage(gameConfig);
    linkgame.init();
  });
});

$(function () {
  $('.rule').click(function () {
    $('audio').get(0).play();
    $('.login').addClass('hidden');
    $('.game-box').removeClass('hidden');
    var gameConfig = {
      cellWidth: 45,
      cellHeight: 45,
      rows: 7,
      cols: 10,
    }
    window.linkgame = new bonusStage(gameConfig);
    linkgame.init();
  });
});

$(function () {
  $('.bag-btn').click(function () {
    $('.bag').removeClass('hidden');
    $('.init-box').addClass('hidden');
  });
});

$(function () {
  $('.close').click(function () {
    $('.bag').addClass('hidden');
    $('.init-box').removeClass('hidden');
  });
});

const images = [
  'images/background/bg1.png',
  'images/background/bg2.png',
  'images/background/bg3.png',
  'images/background/n1.png',
  'images/background/n2.png',
  'images/background/n3.png',
  'images/background/n4.png',
  'images/background/n5.png',
  'images/background/n6.png',
  'images/background/n7.png',
  'images/background/n8.png',
  'images/background/n9.png',
  'images/background/n10.png',
  'images/background/n11.png',
  'images/background/l1.png',
  'images/background/l2.png',
  'images/background/l3.png',
  'images/background/l4.png',
  'images/background/l5.png',
  'images/background/l6.png',
  'images/background/l7.png',
  'images/background/l8.png',
  'images/background/l9.png',
  'images/background/l10.png',
  'images/background/l11.png',
  'images/background/l12.png',

];

function preloadImages(imageArray, callback) {
  let loadedImages = 0;
  const totalImages = imageArray.length;

  for (let i = 0; i < totalImages; i++) {
      const img = new Image();
      img.src = imageArray[i];
      img.onload = () => {
          loadedImages++;
          if (loadedImages === totalImages && callback) {
              callback();
          }
      };
  }
}

window.onload = () => {
  preloadImages(images, () => {
      document.querySelector('.normalbg').classList.add('animation-start');
  });
};

