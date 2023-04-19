// pages/detail/index.js
import { Server } from '../../utils/request.js'
let server = new Server()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isSear: false,
    isSearch: '0',
    pageNum: 0,
    pageSize: 4,
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
      name: '已取消',
    }, {
      status: '6',
      name: '已退款',
    },],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    this.setData({
      orderId: options.id ? options.id : '', 
      deviceInfo: app.globalData.deviceInfo
    });
  },

  getInit() {
    let postData = {};
    if (this.data.isSearch == '1') {
      postData = {
        needUser: 'driverId',
        isSearch: '1', //true:搜索行程列表，false:普通行程列表
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        content: this.data.searchText
      };   
    } else {
      postData = {
        needUser: 'driverId',
        isSearch: '0', //true:搜索行程列表，false:普通行程列表
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
      };   
    };

    console.log('::::', postData);
    server.postRequest('mobile/order/findOrderDetail', postData, app, res => {
      console.log(res);
      this._initDataCallback(res.data)
    });
  },

  backPre() {
    wx.navigateBack({
      delta: 1
    });
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

  //确认搜索
  onConfirm() {
    if (this.data.searchText != '') {
      this.setData({
        isSearch: '1',
        pageNum: 0,
        isSear: false,
      }, ()=> {
        this.getInit();
      });
    }
  },

  //清空输入框的内容
  deleteSearchText() {
    this.setData({
      searchText: '',
      searchList: []
    });
  },

  //搜索框输入事件
  onInput(e) {
    this.setData({
      searchText: e.detail.value,
      isSearch: '1',
      deleteBtn: true,
      isSear: true,
    });
    this.getSearchList();
  },

  //搜索提示列表
  getSearchList() {
  let postData = {};
    postData = {
      needUser: 'driverId',
      content: this.data.searchText,
    }

    server.postRequest('mobile/order/smartShow', postData, app, res => {
      console.log(res);
      this.setData({
        searchList: res.data
      });
      // console.log(this.data.searchList);
    });
  },

  //选择搜索列表的某条字段
  selSearchItem(e) {
    this.setData({
      searchText: e.currentTarget.dataset.item
    });
  },

  /**
* 初始化数据回调函数
*/
  _initDataCallback(data) {
    console.log('列表数据', data)
    for (let i = 0; i < data.orderDetailList.length; i++) {
      data.orderDetailList[i].statusText = this.analysisStatus(data.orderDetailList[i].tripStatus);
    };
    let orderDetailList = data.orderDetailList;

    this.setData({
      orderDetailList: orderDetailList,
      initData: true,
      hasMore: data.totalPage > this.data.pageNum + 1 ? true : false,
      pageNum: this.data.pageNum += 1
    })
  },

  /**
   * 加载更多数据
   */
  getMoreCallback(data) {
    for (let i = 0; i < this.data.orderDetailList.length; i++) {
      this.data.orderDetailList[i].statusText = this.analysisStatus(this.data.orderDetailList[i].tripStatus);
    };
    let orderDetailList = this.data.orderDetailList

    orderDetailList = orderDetailList.concat(data.orderDetailList);
    this.setData({
      orderDetailList: orderDetailList,
      hasMore: data.totalPage > this.data.pageNum + 1 ? true : false,
      pageNum: this.data.pageNum += 1
    })
    this.isLoading = false
  },

  /**
 * 上拉加载
 */
  onScrollBottom() {
    console.log('上拉加载:::');
    if (this.data.hasMore && !this.isLoading) {
      this.isLoading = true

      let postData = {};
      if (this.data.isSearch == '1') {
        if (this.data.orderId == '') {
          postData = {
            needUser: 'employeeId',
            // orderDetailStatus: ,
            isTodayTrip: '1', //字符串
            isSearch: '1', //true:搜索行程列表，false:普通行程列表
            pageNum: this.data.pageNum,
            pageSize: this.data.pageSize,
            content: this.data.searchText
          };
        } else {
          postData = {
            needUser: 'employeeId',
            // orderDetailStatus: ,
            isTodayTrip: '', //字符串
            isSearch: '1', //true:搜索行程列表，false:普通行程列表
            pageNum: this.data.pageNum,
            pageSize: this.data.pageSize,
            content: this.data.searchText,
            orderId: this.data.orderId
          };
        };
      } else {
        if (this.data.orderId == '') {
          postData = {
            needUser: 'employeeId',
            // orderDetailStatus: ,
            isTodayTrip: '1', //字符串
            isSearch: '0', //true:搜索行程列表，false:普通行程列表
            pageNum: this.data.pageNum,
            pageSize: this.data.pageSize,
          };
        } else {
          postData = {
            needUser: 'employeeId',
            // orderDetailStatus: ,
            isTodayTrip: '', //字符串
            isSearch: '0', //true:搜索行程列表，false:普通行程列表
            pageNum: this.data.pageNum,
            pageSize: this.data.pageSize,
            orderId: this.data.orderId
          };
        };
      };
      server.postRequest('mobile/order/findOrderDetail', postData, app, res => {
        console.log(res);
        this.getMoreCallback(res.data)
      });
    }
  },

  /**
  * 根据订单状态码规则计算当前订单状态
  */
  analysisStatus(sta) {
    let CONTENT
    this.data.orderStatus.forEach(item => {
      if (item.status == sta) CONTENT = item.name
    })
    return CONTENT
  },

  enterPage(e) {
    let id = e.currentTarget.dataset.id;
    let obj = e.currentTarget.dataset.obj;
    let evals = e.currentTarget.dataset.eval;
    wx.navigateTo({
      url: '../orderDetail/index?id=' + id + '&obj=' + JSON.stringify(obj) + '&eval=' + evals,
    });
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
    this.setData({
      pageNum: 0
    });
    this.getInit();
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