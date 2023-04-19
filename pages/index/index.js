//index.js
const { $Toast } = require('../../components/base/index');
import { Server } from '../../utils/request.js'
let server = new Server()
//获取应用实例
const app = getApp()

Page({
  data: {
    isFinish: false,
    isMask: false,
    myMenu: [{
      id: '0',
      name: '我的订单',
      url: '../order/index',
    },{
      id: '1',
      name: '账号管理',
      url: '../manage/index?type=zh',
    },{
      id: '2',
      name: '我的乘客',
      url: '../manage/index?type=ck'
    },
    // {
    //  id: '3',
    //   name: '推荐有奖',
    //   url: ''
    // },
    {
      id: '4',
      name: '官方客服',
      url: ''
    }],
    orderStatus: [{
      status: '1',
      name: '待出行',
    }, {
      status: '2',
      name: '行程中',
    }, {
      status: '3',
      name: '待评价',
    }, {
      status: '4',
      name: '已完成',
    }, {
      status: '5',
      name: '已退款',
    },],
    indicatorDots: true,
    interval: 3000,
    duration: 400,
    circular: true,
    current: 1,
    nowData: '',
    week: '',
    hasOrder: true,
  },

  onLoad: function (options) {
    console.log(options);
    this.setData({
      deviceInfo: app.globalData.deviceInfo,
    }, () => {
      this.setData({
        isLogin: app.globalData.isLogin,
        initData: app.globalData.initData,
      });
    });
    // wx.getLocation({
    //   success: res => {
    //     console.log(res);
    //     this.setData({
    //       nowLon: res.longitude,
    //       nowLat: res.latitude,
    //     });
    //   }
    // });
  },

  initData() {
    wx.login({
      success: res => {
        console.log(res);
        let postData = {
          appid: app.globalData.appId,
          code: res.code
        }
        console.log(postData);
        server.postRequest('mobile/driver/initDriverPage', postData, app, res2 => {
          console.log(res2);
          if (res2.status) {
            this.setData({
              isLogin: (res2.data.jumpPage && res2.data.status != '0') ? true : false,
              initData: true,
            });
            if (res2.data.jumpPage) {
              app.globalData.employeeInfo.businessId = res2.data.businessId;
              app.globalData.employeeInfo.id = res2.data.driverId;

              console.log(app.globalData.employeeInfo);
            }
          } else {
            $Toast({ content: res2.msg,duration: 1.5})
          };
        })
      },
      fail: function (res) {
        console.log('获取code失败')
      },
      complete: function (res) { },
    });
  },

  getOrder() {
    let postData = {
      needUser: 'driverId'
    };
    server.postRequest('mobile/driver/todayTripByDriver', postData, app, res => {
      console.log(res);
      if (res.data.driverTodayTrip.length) {
        res.data.driverTodayTrip.forEach((item)=> {
          item.statusText = this.analysisStatus(item.tripStatus);
        });
      };
      this.setData({
        driverTodayTrip: res.data.driverTodayTrip
      });
      console.log(this.data.driverTodayTrip);
    });
  },

  /**
 * 根据订单状态码规则计算当前订单状态
 */
  analysisStatus(sta) {
    console.log(sta);
    let CONTENT
    this.data.orderStatus.forEach(item => {
      if (item.status == sta) CONTENT = item.name
    })
    return CONTENT
  },

  getDate() {
    var l = ["日", "一", "二", "三", "四", "五", "六"];
    var d = new Date().getDay();

    this.setData({
      nowData: this.getdate(),
      week: "星期" + l[d]
    });
  },

  getdate() {
    var now = new Date(),
      y = now.getFullYear(),
      m = now.getMonth() + 1,
      d = now.getDate();
    return m + "月" + d + "日";
  },

  openMask(e) {
    this.setData({
      isMask: true
    });
  },

  closeMask(e) {
    this.setData({
      isMask: false
    });
  },

  bindMask(e) {
   return;
  },

  callDriver(e) {
    let item = e.currentTarget.dataset.item;
    if (item.tripStatus == '1' || item.tripStatus == '2') {
      wx.makePhoneCall({
        phoneNumber: e.currentTarget.dataset.phone
      });
    } else if (item.tripStatus == '3') {
      //行程完成后两小时之后不能打电话
      let updateTime = item.updateDate;
      var now = new Date().getTime();
      var timetamp = new Date(updateTime).getTime();
      var plantamp = 1000 * 60 * 60 * 2 + timetamp;

      if (plantamp > now) {
        wx.makePhoneCall({
          phoneNumber: e.currentTarget.dataset.phone
        });
      };
    };
  },

  enterPage(e) {
    console.log(e);
    let url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },

  enterPage2(e) {
    let id = e.currentTarget.dataset.id;
    let obj = e.currentTarget.dataset.obj;
    let evals = e.currentTarget.dataset.eval;
    wx.navigateTo({
      url: '../orderDetail/index?id=' + id + '&obj=' + JSON.stringify(obj) + '&eval=' + evals,
    });
  },

  isEndOrder(e) {
    wx.getLocation({
      success: res => {
        console.log(res);
        this.setData({
          nowLon: res.longitude,
          nowLat: res.latitude,
        });
      }
    });
    let id = e.currentTarget.dataset.id;
    let type = e.currentTarget.dataset.type;
    let obj = e.currentTarget.dataset.obj;
    let evals = e.currentTarget.dataset.eval;
    let content = (type == '1' ) ? '确定开始该行程吗？': '确定结束该行程吗？';
    wx.showModal({
      title: '提示',
      content: content,
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#FD9105',
      cancelColor: '#666666',
      success: (res)=> {
        if (res.confirm) {
          console.log('用户点击确定')
          // orderDetailId、lon、lat、driverFlag（1:司机端行程开始、2:司机端行程结束）
          let postData = {
            orderDetailId: id,
            lon: this.data.nowLon,
            lat: this.data.nowLat,
            driverFlag: type,
          };
          console.log(postData);
          server.postRequest('mobile/driver/driverUpdateStatus', postData, app, res2 => {
            console.log(res2);
            if (res2.status) {
              if (res2.data.status == "100000") {
                this.getOrder();
                $Toast({
                  content: '操作成功',
                  duration: 1.5
                });
                if(type == '1') {
                  obj.tripStatus = '2';
                  obj.statusText = '行程中';
                  wx.navigateTo({
                    url: '../orderDetail/index?id=' + id + '&obj=' + JSON.stringify(obj) + '&eval=' + evals,
                  });
                } else {
                  obj.tripStatus = '3';
                  obj.statusText = '待评价';
                  wx.navigateTo({
                    url: '../orderDetail/index?id=' + id + '&obj=' + JSON.stringify(obj) + '&eval=' + evals,
                  });
                };
              } else {
                $Toast({
                  content: res2.data.msg,
                  duration: 1.5
                })
              };
            } else {
              $Toast({
                content: res2.msg,
                duration: 1.5
              })
            };

          });
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    }) 
  },

  preventEvent() { },

  getPhoneNumber(e) {
    console.log(e);
    if (e.detail.errMsg == "getPhoneNumber:ok") {
      wx.login({
        success: res => {
          this.setData({
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv,
          });
          let postData = {
            appid: app.globalData.appId,
            code: res.code,
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv,
          }
          console.log(postData);
          server.postRequest('mobile/driver/authorizePhone', postData, app, res2 => {
            console.log(res2);
            if (res2.status) {
              this.setData({
                phone: res2.data
              });
              $Toast({ content: '授权成功', duration: 1.5 })
              this.login();
            } else {
              $Toast({ content: res2.msg, duration: 1.5 })
            };
          })
        }
      })
    };
  },

  login() {
    wx.login({
      success: res => {
        console.log(res);
        let postData = {
          phone: this.data.phone,
          appid: app.globalData.appId,
          code: res.code,
          encryptedData: this.data.encryptedData,
          iv: this.data.iv,
        }
        console.log(postData);
        server.postRequest('mobile/driver/loginDriver', postData, app, res2 => {
          console.log(res2);
          if (res2.data.status == "100002") {
            $Toast({ content: '您还不是司机', duration: 1.5 })
          } else if (res2.data.status == "100000") {
            console.log('登录成功:::');
            this.setData({
              isLogin: true
            });
            app.globalData.employeeInfo.businessId = res2.data.businessId;
            app.globalData.employeeInfo.id = res2.data.id;

            console.log(app.globalData.employeeInfo);
          };
        })
      }
    });
  },

  onShow() {
    this.getDate();
    this.initData();
    this.getOrder();
  },

  onReady: function () {
  },

  /**
 * 页面相关事件处理函数--监听用户下拉动作
 */
  onPullDownRefresh: function () {
    this.getOrder();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },
})
