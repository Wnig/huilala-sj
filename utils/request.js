import { restUrl } from '../config/requestUrl.js'
class Server {
    constructor() {
        "use strict"
    }

  /**
* 初始化小程序信息接口请求函数
* 同postRequest 不用等待app.js执行完成
*/
  postInitRequest(url, params, callBack, errBack) {
    wx.showLoading({
      title: '正在初始化...',
    })
    wx.request({
      url: restUrl + url,
      data: params,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        wx.hideLoading()
        if (callBack) callBack(res.data)
      },
      fail: function (res) {
        wx.hideNavigationBarLoading()
        if (errBack) errBack()
        wx.showToast({
          title: '后台跑路了',
          icon: 'none'
        })
      }
    })
  }

    /**
     * 第一个参数是请求地址
     * 第二个参数是提交数据
     * 第三个参数是回调函数
     * 第四个参数是错误回调
     * 三四两个参数可不传
     */
    postRequest(url, params, app, callBack, errBack) {
        let c = setInterval(() => {
          if (app.globalData.initLaunch) {
            clearInterval(c)
            if (params.needUser) {
                params[params.needUser] = app.globalData.employeeInfo.id
                delete params.needUser
            }
            wx.request({
                url: restUrl + url,
                data: params,
                method: 'POST',
                header: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                success: function (res) {
                    if (callBack) callBack(res.data)
                },
                fail: function (res) {
                    if (errBack) errBack()
                    wx.showToast({
                        title: '后台跑路了',
                        icon: 'none'
                    })
                }
            })
          }
        }, 100)
    }

    getRequest(url, params, app, callBack) {
        let c = setInterval(() => {
          clearInterval(c)
          if (params.needUser) {
              params[params.needUser] = app.globalData.userInfo.id
              delete params.needUser
          }
          wx.request({
              url: restUrl + url,
              data: params,
              method: 'GET',
              header: {
                  'content-type': 'application/x-www-form-urlencoded'
              },
              success: function (res) {
                  if (callBack) callBack(res.data)
              },
              fail: function (res) {
                  wx.showToast({
                      title: '后台跑路了',
                      icon: 'none'
                  })
              }
          })
        }, 100)
    }
}

export { Server }