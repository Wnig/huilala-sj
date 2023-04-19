//app.js
import { Server } from 'utils/request.js'
let server = new Server()
App({
  onLaunch: function () {
    //更新代码
    this.updateApp();
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.getSystemInfo({
      success: res => {
        if (res.errMsg === 'getSystemInfo:ok') {
          this.globalData.deviceInfo = res
        }
        console.log('设备信息:', res)
      }
    })

    // 登录-初始化数据
    wx.login({
      success: res => {
        console.log(res);
        let postData = {
          appid: this.globalData.appId,
          code: res.code
        }
        console.log(postData);
        server.postInitRequest('mobile/driver/initDriverPage', postData, res2 => {
          console.log(res2);
          if (res2.status) {
            if (res2.data.jumpPage) {
              this.globalData.isLogin = (res2.data.jumpPage && res2.data.status != '0') ? true : false;
              this.globalData.initData = true;
              this.globalData.employeeInfo.businessId = res2.data.businessId;
              this.globalData.employeeInfo.id = res2.data.driverId;
              console.log('globalData:::', this.globalData);
            };
            this.globalData.initLaunch = true
          };
        })
      },
      fail: function (res) {
        console.log('获取code失败')
      },
      complete: function (res) { },
    });
  },
  //版本更新
  updateApp() {
    const updateManager = wx.getUpdateManager()

    //监听向微信后台请求检查更新结果事件
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log(res.hasUpdate)
    })

    //监听小程序有版本更新事件
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })

    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
    })
  },
  globalData: {
    userInfo: null,
    appId: 'wx2293be8e7c6651e0',
    employeeInfo: {},
    isLogin: '',
    initData: '',
  }
})