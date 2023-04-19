// pages/reg/index.js
const { $Toast } = require('../../components/base/index');
import { Server } from '../../utils/request.js'
let server = new Server()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isSelected: false,
    username: '',
    phone: '',
    company: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    this.setData({
      phone: options.phone ? options.phone: '',
      wPhone: options.phone ? options.phone : '',
      encryptedData: options.ed ? options.ed : '',
      iv: options.iv ? options.iv : '',
      deviceInfo: app.globalData.deviceInfo
    });
  },

  //输入文本
  inputVal(e) {
    let types = e.currentTarget.dataset.type;

    switch (types) {
      case 'username': this.setData({username: e.detail.value});
        break;
      case 'phone': this.setData({ phone: e.detail.value });
        break;
      case 'company': this.setData({ company: e.detail.value });
        break;
    };

    if (this.data.username != '' && this.data.phone != '' && this.data.company != '' && this.data.isSelected) {
      this.setData({ isFinished: true });
    } else {
      this.setData({ isFinished: false });
    };
  },

  //协议
  rule(e) {
    this.setData({isSelected: !this.data.isSelected});

    if (this.data.username != '' && this.data.phone != '' && this.data.company != '' && this.data.isSelected) {
      this.setData({ isFinished: true });
    } else {
      this.setData({ isFinished: false });
    };
  },

  //完成
  submit(e) {
    if (this.data.username == '' || this.data.phone == '' || this.data.company == '' || !this.data.isSelected) {
      return;
    } else {
      this.setData({ isFinished: true});
      let regPhone = /^[1][3,4,5,7,8,9][0-9]{9}$/;
      if (!regPhone.test(this.data.phone)) {
        $Toast({ content: '请输入正确手机号',duration: 1.5})
      } else {
        wx.login({
          success: res => {
            console.log(res);
            let postData = {
              contactName: this.data.username,
              contactPhone: this.data.phone,
              enterpriseName: this.data.company,
              wechatPhone: this.data.wPhone,
              appid: app.globalData.appId,
              code: res.code,
              encryptedData: this.data.encryptedData,
              iv: this.data.iv,
            }
            console.log(postData);
            server.postRequest('mobile/employee/register', postData, app, res2 => {
              console.log(res2);
              if (res2.status) {
                app.globalData.id = res2.data.id;
                wx.navigateTo({
                  url: '../index/index?role=' + res2.data.role,
                });
              } else {
                $Toast({ content: res2.msg, duration: 1.5 })
              };
            });
          }
        })

      };
    };
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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