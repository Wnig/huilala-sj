Component({

  properties: {
    
  },

  attached () {
    this._initAnimation()
  },

  ready () {
    this.animation.opacity(1).step()
    this.setData({ animationFade: this.animation.export()})
  },

  methods: {
    _initAnimation () {
      let animation = wx.createAnimation({
        timingFunction: "ease",
        duration: 400
      })
      this.animation = animation
    },
    close () {
      this.animation.opacity(0).step()
      this.setData({ animationFade: this.animation.export() })
      setTimeout(() => {
        this.triggerEvent('onClose')
      }, 400)
    },
    prevent () {}
  }
});
