// pages/orderDetail/index.js
// 引入SDK核心类
var QQMapWX = require('../../sdk/qqmap-wx-jssdk.js');

// 实例化API核心类
var map = new QQMapWX({
  key: 'FDRBZ-2T7RI-J5MGG-5OOCF-7D7KQ-N4FDM' // 必填
});

import { Server } from '../../utils/request.js'
let server = new Server()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    scale: 14,
    polyline: [],
    point: [],
    showLocation: true,    
    nowLen: 0, //当前文字长度
    textareaValue: '',
    evaluateArr: [{
      name: '车内整洁',
    }, {
      name: '活地图认路准',
    }, {
      name: '驾驶平稳',
    }, {
      name: '态度好服务棒'
    }],
    isEva: false, //是否已评价
    isEvaluate: false, //评价是否填写完整
    label: [],
    nowLon: '',
    nowLat: '',
    lastLon: '',
    lastLat: '',
    nextLon: '',
    nextLat: '',
    pointArr: [],
    distance: [],
    markers: [],
    isUp: false,
    isStart: false,
    rotate: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    wx.setKeepScreenOn({
      keepScreenOn: true
    });
    
    this.setData({
      eval: options.eval,
      obj: JSON.parse(options.obj),
      deviceInfo: app.globalData.deviceInfo
    }, ()=> {
      this.setData({
        initData: true
      });
    });

    console.log(JSON.parse(options.obj));

    this.data.markers = [{
      iconPath: "/images/start.png",
      id: 0,
      latitude: (this.data.obj.tripStatus != '1' && this.data.obj.tripStatus != '2') ? this.data.obj.actualOutLat : this.data.obj.outLat,
      longitude: (this.data.obj.tripStatus != '1' && this.data.obj.tripStatus != '2') ? this.data.obj.actualOutLon : this.data.obj.outLon,
      width: 34,
      height: 34,
    }, {
      iconPath: "/images/end.png",
      id: 1,
      latitude: (this.data.obj.tripStatus != '1' && this.data.obj.tripStatus != '2') ? this.data.obj.actualArriveLat : this.data.obj.arriveLat,
      longitude: (this.data.obj.tripStatus != '1' && this.data.obj.tripStatus != '2') ? this.data.obj.actualArriveLon : this.data.obj.arriveLon,
      width: 34,
      height: 34
    },];

    this.setData({
      markers: this.data.markers
    });    

    console.log('markers:::', this.data.markers);
    this.setData({
      isUp: (this.data.obj.tripStatus != 1 && this.data.tripStatus != 2 ) ? true: false,
    });

    if (this.data.eval == 'yes') {
      if (this.data.obj.tripStatus == '3') {
        this.setData({
          isMask: true,
          isMasks: false
        });
      };
      if (this.data.obj.tripStatus == '4') {
        this.setData({
          isMask: false,
          isMasks: true
        });
      };
    } else {
      this.setData({
        isMask: false,
        isMasks: false
      });
    };

    console.log(this.data.obj);
    this.setData({
      isEva: this.data.obj.tripStatus != '3' ? true : false
    });
    if (this.data.obj.tripStatus == '1') {
      wx.getLocation({
        success: res => {
          console.log(res);
          this.setData({
            nowLon: res.longitude,
            nowLat: res.latitude,
          });
        }
      });
      this.setData({
        scale: 14,
      });
      this.route();
    };
    if (this.data.obj.tripStatus == '2') {
      wx.getLocation({
        success: res => {
          console.log(res);
          this.setData({
            nowLon: res.longitude,
            nowLat: res.latitude,
          });
        }
      });
      this.setData({
        scale: 16,
        showLocation: false
      });
      this.connectRoute();
      this.startTrip();
    };
    if (this.data.obj.tripStatus == '3') {
      this.setData({
        scale: 14,
        nowLon: this.data.obj.actualOutLon,
        nowLat: this.data.obj.actualOutLat,
      });
      this.route();
      this.getEvalLabel();
    };
    if (this.data.obj.tripStatus == '4') {
      this.setData({
        scale: 14,
        nowLon: this.data.obj.actualOutLon,
        nowLat: this.data.obj.actualOutLat,
      });
      this.route();
      this.getEvalData();
    };

    // this.getDriverRoute();
  },

  backPre() {
    clearInterval(this.timer);
    this.socketRefresh = true
    // 退出页面关掉socket连接并销毁音频播放控制器
    wx.navigateBack({
      delta: 1
    }, ()=> {
      if (this.data.isConnect) {
        wx.closeSocket()
      };
    });
  },

  //获取评价标签
  getEvalLabel() {
    let postData = {
      flag: '2', //司机评价乘客
    };
    server.postRequest('mobile/order/evaluateLabel', postData, app, res => {
      console.log(res.data);
      res.data.forEach((item) => {
        item.isSelect = false;
      });
      this.setData({
        evaluateArr: res.data
      });
    });
  },

  //显示已评价信息
  getEvalData() {
    let postData = {
      orderDetailId: this.data.obj.id,
      evaluateUserId: this.data.obj.driverId, //（评价人id）
      evaluatedUserId: this.data.obj.employeeId, //（被评价人id）
    };
    console.log(postData);
    server.postRequest('mobile/order/evaluateInfo', postData, app, res => {
      console.log(res.data);
      this.setData({
        evalObj: res.data
      });
    });
  },

  moveToLocation: function () {
    this.mapCtx.moveToLocation();
  },

  //计算两点之间的角度
  calcAngle(px1, py1, px2, py2) {
    //两点的x、y值
    var x = px2 - px1;
    var y = py2 - py1;
    var hypotenuse = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    //斜边长度
    var cos = x / hypotenuse;
    var radian = Math.acos(cos);
    //求出弧度
    var angle = 180 / (Math.PI / radian);
    //用弧度算出角度
    if (y < 0) {
      angle = -angle;
    } else if ((y == 0) && (x < 0)) {
      angle = 180;
    }
    return angle;
  },

  //显示隐藏详情
  isUpDown() {
    this.setData({
      isUp: !this.data.isUp
    });
  },

  //开始-结束-行程
  isEndOrder(e) {
    let type = e.currentTarget.dataset.type;
    let content = (type == '1') ? '确定开始该行程吗？' : '确定结束该行程吗？';
    wx.showModal({
      title: '提示',
      content: content,
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#FD9105',
      cancelColor: '#666666',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定')
          // orderDetailId、lon、lat、driverFlag（1:司机端行程开始、2:司机端行程结束）
          let postData = {
            orderDetailId: this.data.obj.id,
            lon: this.data.nowLon,
            lat: this.data.nowLat,
            driverFlag: type,
          };
          console.log(postData);
          server.postRequest('mobile/driver/driverUpdateStatus', postData, app, res2 => {
            console.log(res2);
            if (res2.status) {
              if (res2.data.status == "100000") {
                if(type == '1') {
                  this.setData({
                    ['obj.tripStatus']: '2',
                    ['obj.statusText']: '行程中',
                    isUp: false,
                    showLocation: false
                  });
                  this.startTrip();
                } else {
                  this.setData({
                    ['obj.tripStatus']: '3',
                    ['obj.statusText']: '待评价',
                    isUp: true,
                    isEva: false,
                    showLocation: true
                  });
                  this.endTrip();
                  this.route();
                };

                this.tipsAlert('操作成功');
              } else {
                this.tipsAlert(res2.data.msg);
              };
            } else {
              this.tipsAlert(res2.msg);
            };
          });
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  //路线规划
  route() {
    //WebService请求地址，from为起点坐标，to为终点坐标，开发key为必填
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/driving/?from=' + this.data.markers[0].latitude + ',' + this.data.markers[0].longitude + '&to=' + this.data.markers[1].latitude + ',' + this.data.markers[1].longitude + '&heading=175&output=json&callback=cb&key=XYUBZ-WOHH6-H3CSA-MDFDH-FWHHF-TLBKG',
      success: (res) => {
        console.log(res);
        let coors = res.data.result.routes[0].polyline
        for (var i = 2; i < coors.length; i++) {
          coors[i] = coors[i - 2] + coors[i] / 1000000
        }
        // console.log(coors)
        //划线
        var b = [];
        for (var i = 0; i < coors.length; i = i + 2) {
          b[i / 2] = {
            latitude: coors[i],
            longitude: coors[i + 1]
          };
          // console.log(b[i / 2])
        }
        this.setData({
          b: b,
          polyline: [{
            points: b,
            color: "#BBBBBB",
            width: 5,
            dottedLine: false
          }],
        })
      }
    })
  },

  //绘制路线
  drawline() {
    this.setData({
      polyline: [{
        points: this.data.b,
        color: "#BBBBBB",
        width: 5,
        dottedLine: false
      }, {
        points: this.data.point,
        color: '#39C67D',
        width: 2,
        dottedLine: false
      }]
    });
  },

  //获取经纬度
  getlocation() {
    var lat, lng;
    wx.getLocation({
      type: 'gcj02',
      success: (res)=> {
        lat = res.latitude;
        lng = res.longitude;

        // if (this.data.isStart) {
        //   this.setData({
        //     lastLat: this.data.nextLat,
        //     lastLon: this.data.nextLon,
        //     nextLat: res.latitude,
        //     nextLon: res.longitude,
        //   });
        // } else {
        //   this.setData({
        //     lastLat: res.latitude,
        //     lastLon: res.longitude,
        //     nextLat: res.latitude,
        //     nextLon: res.longitude,
        //     isStart: true,
        //   });
        // };

        // this.distance(res.latitude, res.longitude, this.data.obj.actualArriveLat, this.data.obj.actualArriveLon);
        // console.log('距离:::', this.distance(res.latitude, res.longitude, this.data.obj.actualArriveLat, this.data.obj.actualArriveLon));
        // this.setData({
        //   rotate: (this.calcAngle(this.data.lastLat, this.data.lastLon, res.latitude, res.longitude))
        // });
        // console.log('角度::::', this.data.rotate);
        this.data.markers[2] = {
          iconPath: "/images/che@3x.png",
          id: 2,
          latitude: res.latitude,
          longitude: res.longitude,
          width: 25,
          height: 48,
          rotate: 0,
          zIndex: 9999,
          // callout: {
          //   name: '起点',
          //   title: '这是起点啊',
          //   content: '距离终点: ' + this.data.distance.toFixed(2) +'km',
          //   color: '#000',
          //   bgColor: '#fff',
          //   padding: 15,
          //   borderRadius: 100,
          //   fontSize: 14,
          //   display: "ALWAYS",
          // }
        };

        this.setData({
          ['markers[2]']: this.data.markers[2]
        });
        this.data.point.push({ latitude: lat, longitude: lng });
        let pointArr = [];
        pointArr.push({ lat: lat, lon: lng});
        let message = {
          "routeId": this.data.obj.id,
          "openSource": "1",
          "latLng": pointArr
        };
        this.sendMessage(message);
        console.log(pointArr);
        console.log(this.data.point);
      }
    });
  },

  //开始行程
  startTrip(e) {
    this.timer = setInterval(()=> {
      console.log('路线点:::');
      this.getlocation();
      // this.drawline();
    }, 5*1000);
  },

  //结束行程
  endTrip(e) {
    console.log('end');
    clearInterval(this.timer);
    this.setData({
      isConnect: false
    }, ()=> {
      wx.closeSocket()
    });
  },

  //计算距离
  //公式计算（经纬度）
  distance: function (la1, lo1, la2, lo2) {
    var La1 = la1 * Math.PI / 180.0;
    var La2 = la2 * Math.PI / 180.0;
    var La3 = La1 - La2;
    var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
    s = s * 6378.137;//地球半径
    s = Math.round(s * 10000) / 10000;
    console.log("计算结果", s)
    this.setData({
      distance: s
    })
  },

  //司机路线显示
  getDriverRoute() {
    let pointArr = [];
    let lastLon = '';
    let lastLat = '';
    let nextLon = '';
    let nextLat = '';

    this.data.obj.lonLatList.forEach((item, i) => {
      item.latitude = item.lat;
      item.longitude = item.lon;
      if (i == 0) {
        lastLon = item.longitude;
        lastLat = item.latitude;
        nextLon = item.longitude;
        nextLat = item.latitude;
        pointArr.push({
          latitude: item.latitude,
          longitude: item.longitude
        });
      } else {
        if(i == 1) {
          if (lastLon != item.longitude || lastLat != item.latitude) {         
            nextLon = item.longitude;
            nextLat = item.latitude;
            pointArr.push({
              latitude: item.latitude,
              longitude: item.longitude
            });
          } else {
            nextLon = item.longitude;
            nextLat = item.latitude;   
          };
        } else {
          if (lastLon != item.longitude || lastLat != item.latitude) {            
            nextLon = item.longitude;
            nextLat = item.latitude;
            lastLon = nextLon;
            lastLat = nextLat;
            pointArr.push({
              latitude: item.latitude,
              longitude: item.longitude
            });            
          } else {
            nextLon = item.longitude;
            nextLat = item.latitude; 
          };
        };
      };
    });
    console.log(pointArr);

    // console.log(this.data.obj.lonLatList);
    this.setData({
      polyline: [{
        points: pointArr,
        color: '#39C67D',
        width: 4,
        dottedLine: false
      }],
    })
  },

  /**
 * socket连接路线
 */
  connectRoute() {
    wx.showLoading({
      title: '正在连接..',
    })
    wx.connectSocket({
      url: 'ws://abc.smartmapdt.com/huizhan/mobile/websocket/' + this.data.obj.id,
      success: res => {
        console.log('socket连接', res)
      }
    })
  },

  /**
   * 发送消息通用函数
   */
  sendMessage(data, cb) {
    console.log(data);
    wx.sendSocketMessage({
      data: JSON.stringify(data),
      success: res => {
        console.log('发送消息回调', res)
        if (cb) {
          cb()
        }
      }
    })
  },

  preventEvent() { },

  maskcon() {
    return;
  },

  openMask() {
    if (this.data.obj.tripStatus == '3') {
      this.getEvalLabel();
    };
    if (this.data.obj.tripStatus == '4') {
      this.getEvalData();
    };
    if(this.data.isEva) {
      this.setData({
        isMask: false,
        isMasks: true
      });  
    } else {
      this.setData({
        isMask: true,
        isMasks: false
      }); 
    };
  },

  closeMask() {
    this.setData({
      isMask: false,
      isMasks: false
    });
  },

  //五星评价
  evaStarClick(e) {
    this.setData({ 
      userEvaStar: e.currentTarget.dataset.index 
    });

    for (let i = 0; i < this.data.evaluateArr.length; i++) {
      if (this.data.evaluateArr[i].isSelect) {
        this.setData({
          isEvaluate: this.data.userEvaStar ? true: false,
        });
        break;
      } else {
        this.setData({
          isEvaluate: false,
        });
      };
    };
  },

  //多选标签
  selLabel(e) {
    console.log(e);
    let ind = e.currentTarget.dataset.index;

    let evaluateArr = this.data.evaluateArr;
    for (let i = 0; i < evaluateArr.length; i++) {
      if (i == ind) {
        evaluateArr[i].isSelect = !evaluateArr[i].isSelect;
      };
    };

    this.setData({
      evaluateArr: evaluateArr
    }, () => {
      for (let i = 0; i < this.data.evaluateArr.length; i++) {
        if (this.data.evaluateArr[i].isSelect) {
          this.setData({
            isEvaluate: this.data.userEvaStar ? true : false,
          });
          break;
        } else {
          this.setData({
            isEvaluate: false,
          });
        };
      };      
    });
  },

  //评价
  evaluate() {
    if (this.data.isEvaluate) {
      //评价标签转字符串
      for (let i = 0; i < this.data.evaluateArr.length; i++) {
        if (this.data.evaluateArr[i].isSelect) {
          this.data.label[i] = this.data.evaluateArr[i].value;
        } else {
          this.data.label[i] = '';
        };
      };

      for (let i = 0; i < this.data.label.length; i++) {
        if (this.data.label[i] == "" || typeof (this.data.label[i]) == "undefined") {
          this.data.label.splice(i, 1);
          i = i - 1;
        };
      };

      let postData = {
        orderDetailId: this.data.obj.id,
        evaluateUserId: this.data.obj.driverId, //（评价人id）
        evaluatedUserId: this.data.obj.employeeId, //（被评价人id）
        content: this.data.textareaValue,
        score: this.data.userEvaStar,
        label: this.data.label.join(','), //（label存的格式为  车内整洁, 驾驶平稳, 态度好服务棒）
        type: '2', // 类型：2司机对乘客评价，1乘客对司机评价  
      };
      console.log(postData);
      server.postRequest('mobile/order/evaluate', postData, app, res => {
        console.log('评价:::', res);
        if (res.status) {
          if (res.data.status == '100000') {
            this.setData({
              isSuccess: true,
              ['obj.tripStatus']: '4',
              ['obj.statusText']: '已完成'
            });
            this.getEvalData();
            setTimeout(() => {
              this.setData({
                isSuccess: false,
                isEva: true,
              });
              this.closeMask();
            }, 1000);
          };
        };
      });
    };
  },

  //获取文本内容及内容长度
  textCon(e) {
    let len = e.detail.value.length;

    this.setData({
      textareaValue: e.detail.value,
      nowLen: len
    });
  },

  callDriver(e) {
    let item = this.data.obj;
    if (item.tripStatus == '1' || item.tripStatus == '2') {
      wx.makePhoneCall({
        phoneNumber: this.data.obj.passengerPhone
      });
    } else if (item.tripStatus == '3') {
      //行程完成后两小时之后不能打电话
      let updateTime = item.updateDate;
      var now = new Date().getTime();
      var timetamp = new Date(updateTime).getTime();
      var plantamp = 1000 * 60 * 60 * 2 + timetamp;

      if (plantamp > now) {
        wx.makePhoneCall({
          phoneNumber: this.data.obj.passengerPhone
        });
      };
    };
  },

  // 弹窗提示
  tipsAlert(str) {
    wx.showToast({
      title: str,
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 监听socket的连接
    wx.onSocketOpen(() => {
      console.log('WebSocket 已连接！')
      wx.hideLoading();
      this.setData({ isConnect: true })
      let message = {
        "routeId": this.data.obj.id,
        "openSource": "1",
        "latLng": []
      };
      this.sendMessage(message);
    })
    //   监听socket的关闭
    wx.onSocketClose(() => {
      this.setData({ isConnect: false })
      console.log('WebSocket 已关闭！')
    })

    // 监听socket错误
    wx.onSocketError(() => {
      //   wx.hideLoading()
      console.log('WebSocket连接打开失败，请检查！')
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.mapCtx = wx.createMapContext('mymap');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.data.isConnect) {
      wx.closeSocket()
    };
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

})