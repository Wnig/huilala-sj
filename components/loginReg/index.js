const { $Toast } = require('../../components/base/index');
import restUrl from '../../config/requestUrl.js'
import { Server } from '../../utils/request.js'
let server = new Server()
const app = getApp()

Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
    mode: {
      type: String,
      value: '',
    },
  },
  data: {
    phone: '',
  },
  methods: {
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
                  $Toast({content: '授权成功',duration: 1.5})
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
  },
});
