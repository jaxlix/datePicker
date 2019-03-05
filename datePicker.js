(function (window, document, Math) {
    function Scroll(id, params) {
        this.scroller = document.querySelector(id);
        this.childNode = this.scroller.childNodes[0];
        this.options = {
            step: true,
            defaultPlace: 0,
            callback: null
        };
        this.startPageY = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.offsetTop = 0;
        this.scrollerHeight = this.scroller.clientHeight;
        this.childNodeHeight = this.childNode.clientHeight;
        this.scrollHeight = this.childNodeHeight - this.scrollerHeight;
        var childNodes = this.childNode.childNodes;
        this.stepLen = childNodes.length > 0 ? childNodes[0].clientHeight : 0;
        for (var i in params) {
            this.options[i] = params[i]
        }
        var defaultPlace = this.options.defaultPlace ? this.options.defaultPlace : 0;
        this.scrollTo(0, defaultPlace);
        this._start();
        this._move();
        this._end()
    }
    Scroll.prototype = {
        _start: function () {
            var self = this;
            self.scroller.addEventListener('touchstart', function (e) {
                e.stopPropagation();
                e.preventDefault();
                self.startTime = self.getTime();
                var touches = e.touches ? e.touches[0] : e;
                self.startPageY = touches.pageY;
                self.browserVendor('transition', 'none')
            }, false)
        },
        _move: function () {
            var self = this;
            self.scroller.addEventListener('touchmove', function (e) {
                e.stopPropagation();
                e.preventDefault();
                var timestamp = self.getTime();
                var touches = e.touches ? e.touches[0] : e;
                var diffPageY = touches.pageY - self.startPageY;
                var movePageY = diffPageY + self.offsetTop;
                if (timestamp - self.endTime > 300 && Math.abs(diffPageY) < 10) {
                    return
                }
                if (movePageY > 0) {
                    movePageY /= 3
                } else if (Math.abs(movePageY) > Math.abs(self.scrollHeight)) {
                    movePageY = Math.abs(self.scrollHeight) - Math.abs(movePageY);
                    movePageY = movePageY / 3 - self.scrollHeight
                }
                self.browserVendor('transform', 'translate(0, ' + movePageY + 'px)')
            }, false)
        },
        _end: function () {
            var self = this;
            self.scroller.addEventListener('touchend', function (e) {
                e.stopPropagation();
                e.preventDefault();
                self.endTime = self.getTime();
                var duration = self.endTime - self.startTime;
                var touches = e.changedTouches ? e.changedTouches[0] : e;
                var offsetHeight = touches.pageY - self.startPageY;
                self.offsetTop += offsetHeight;
                if ((self.offsetTop > 0) || (Math.abs(self.offsetTop) > Math.abs(self.scrollHeight))) {
                    self.browserVendor('transition', 'all 500ms')
                } else if (duration < 300) {
                    var speed = Math.abs(offsetHeight) / duration;
                    var moveTime = duration * speed * 20;
                    moveTime = moveTime > 2000 ? 2000 : moveTime;
                    self.offsetTop += offsetHeight * speed * 10;
                    self.browserVendor('transitionProperty', 'all');
                    self.browserVendor('transitionDuration', moveTime + 'ms');
                    self.browserVendor('transitionTimingFunction', 'cubic-bezier(0.1, 0.57, 0.1, 1)')
                } else {
                    self.browserVendor('transition', 'all 500ms')
                }
                if (self.offsetTop > 0) {
                    self.offsetTop = 0
                } else if (Math.abs(self.offsetTop) > Math.abs(self.scrollHeight)) {
                    self.offsetTop = -self.scrollHeight
                }
                if (self.options.step && self.stepLen > 0) {
                    var nowEndY = self.offsetTop;
                    var h = Math.abs(nowEndY % self.stepLen);
                    var halfHeight = self.stepLen / 2;
                    var moveY = (h >= halfHeight) ? (nowEndY - self.stepLen + h) : (nowEndY + h);
                    var index = parseInt(Math.abs(moveY) / self.stepLen);
                    self.options.callback({
                        index: index,
                        node: self.childNode.childNodes
                    });
                    self.offsetTop = moveY
                }
                self.browserVendor('transform', 'translate(0, ' + self.offsetTop + 'px)')
            }, false)
        },
        scrollTo: function (x, y, time) {
            var self = this;
            if (time && time > 0) {
                self.browserVendor('transitionProperty', 'all');
                self.browserVendor('transitionDuration', time + 'ms');
                self.browserVendor('transitionTimingFunction', 'cubic-bezier(0.1, 0.57, 0.1, 1)')
            } else {
                self.browserVendor('transition', 'none')
            }
            y = -y;
            self.offsetTop = y;
            self.browserVendor('transform', 'translate(0, ' + y + 'px)')
        },
        refresh: function () {
            this.childNode = this.scroller.childNodes[0];
            this.startPageY = 0;
            this.startTime = 0;
            this.endTime = 0;
            this.offsetTop = 0;
            this.scrollerHeight = this.scroller.clientHeight;
            this.childNodeHeight = this.childNode.clientHeight;
            this.scrollHeight = this.childNodeHeight - this.scrollerHeight;
            var childNodes = this.childNode.childNodes;
            this.stepLen = childNodes.length > 0 ? childNodes[0].clientHeight : 0;
            this.scrollTo(0, 0, 500)
        },
        browserVendor: function (styleStr, value) {
            var self = this;
            var vendors = ['t', 'WebkitT', 'MozT', 'msT', 'OT'],
                styleObj, len = vendors.length;
            var elementStyle = self.childNode.style;
            for (var i = 0; i < len; i += 1) {
                styleObj = vendors[i] + styleStr.substr(1);
                if (styleObj in elementStyle) {
                    elementStyle[styleObj] = value
                }
            }
        },
        getTime: function () {
            return parseInt(new Date().getTime())
        }
    };

    function DatePicker(params) {
        this.scrollArray = [];
        this.textArray = [];
        this.isScrollTo = false;
        this.monthLen = 30;
        this.options = {
            "title": '请选择日期',
            "type": "3",
            "maxYear": "",
            "minYear": "",
            "separator": "-",
            "defaultValue": '',
            "callBack": null
        };
        params = this.setDefaultOptions(params);
        for (var i in params) {
            this.options[i] = params[i]
        }
        this.defaultArray = ['', '', '', '', ''];
        if (this.options.defaultValue) {
            var defaultValue = this.options.defaultValue + "";
            var separator = this.options.separator;
            var dvArray = defaultValue.replace(/\:|\s/g, "-").split(separator);
            if (dvArray.length > 0) {
                for (var num = 0; num < dvArray.length; num += 1) {
                    this.defaultArray[num] = dvArray[num]
                }
            }
        }
        this.FillData();
        this.eventClick()
    }
    DatePicker.prototype = {
        FillData: function () {
            var self = this;
            self.enterNodesBlur();
            var modalbox = document.querySelector(".zx_mask");
            if (modalbox) {
                document.body.removeChild(modalbox)
            }
            var title = self.options.title ? self.options.title : '请选择日期';
            var modalParent = document.createElement("div");
            modalParent.className = "zx_mask";
            var picker_list = '<div class="zx_select showPicker"><header><button class="nav_left picker-cancel">取消</button><h1>' + title + '</h1><button class="nav_right picker-ok">确定</button></header><div class="ub" id="wrapper-parent"><div class="ub-f1 picker-wrapper" id="dp-wrapper0"><ul></ul></div>';
            if (self.options.type > 0) {
                picker_list += '<div class="ub-f1 picker-wrapper" id="dp-wrapper1"><ul></ul></div>'
            }
            if (self.options.type > 2) {
                picker_list += '<div class="ub-f1 picker-wrapper" id="dp-wrapper2"><ul></ul></div>'
            }
            if (self.options.type == 4) {
                picker_list += '<div class="ub-f1 picker-wrapper" id="dp-wrapper3"><ul></ul></div><div class="ub-f1 picker-wrapper" id="dp-wrapper4"><ul></ul></div>'
            }
            if(self.options.type == 5){
                picker_list += '<div class="ub-f1 picker-wrapper" id="dp-wrapper3"><ul></ul></div>'
            }
            picker_list += '<div class="sel_top"></div><div class="sel_bottom"></div>';
            picker_list += '<div class="sel_middle"></div></div></div>';
            modalParent.innerHTML = picker_list;
            document.body.appendChild(modalParent);
            var listWidth = parseFloat(100 / self.options.num).toFixed(3) + "%";
            var pickerWrapperArr = document.querySelectorAll('.picker-wrapper');
            for (var i = 0; i < pickerWrapperArr.length; i += 1) {
                pickerWrapperArr[i].style.fontSize = "16px";
                pickerWrapperArr[i].style.minWidth = listWidth;
                pickerWrapperArr[i].style.maxWidth = listWidth
            }
            //0:年，1:年月, 2:时分, 3:年月日，4:年月日时分, 5:年月日上午下午
            switch (self.options.type) {
                case 0:
                    document.querySelector('#wrapper-parent').style.padding = "0 15%";
                    self.getYearList(0, self.defaultArray[0]);
                    break;
                case 1:
                    document.querySelector('#wrapper-parent').style.padding = "0 15%";
                    self.getYearList(0, self.defaultArray[0]);
                    self.getMonthList(1, self.defaultArray[1]);
                    break;
                case 2:
                    document.querySelector('#wrapper-parent').style.padding = "0 15%";
                    self.getHourList(0, self.defaultArray[0]);
                    self.getMinutesList(1, self.defaultArray[1]);
                    break;
                case 3:
                    self.getYearList(0, self.defaultArray[0]);
                    self.getMonthList(1, self.defaultArray[1]);
                    self.getDayList(2, self.defaultArray[2]);
                    break;
                case 4:
                    self.getYearList(0, self.defaultArray[0]);
                    self.getMonthList(1, self.defaultArray[1]);
                    self.getDayList(2, self.defaultArray[2]);
                    self.getHourList(3, self.defaultArray[3]);
                    self.getMinutesList(4, self.defaultArray[4]);
                    break;
                case 5:
                    self.getYearList(0, self.defaultArray[0]);
                    self.getMonthList(1, self.defaultArray[1]);
                    self.getDayList(2, self.defaultArray[2]);
                    self.getAfternoon(3);
                    break;
                default:
                    break
            }
            setTimeout(function () {
                document.querySelector('.zx_select').style.height = '245px'
            }, 0)
        },
        scrollInit: function (index, num) {
            var self = this;
            var wrapperList = document.querySelector('#dp-wrapper0').childNodes[0];
            var itemHeight = wrapperList.childNodes[0].clientHeight;
            var id = '#dp-wrapper' + index;
            self.scrollArray[index] = new Scroll(id, {
                step: itemHeight,
                defaultPlace: itemHeight * num,
                callback: function (params) {
                    var num = params.index + 2;
                    var node = params.node[num];
                    self.SetItemList(index, node);
                    if (self.options.type == 3 || self.options.type == 4) {
                        var nowPlace = self.textArray[2].value;
                        if (nowPlace > self.monthLen) {
                            var moveLen = (self.monthLen - 1) * itemHeight;
                            self.textArray[2].value = self.monthLen;
                            setTimeout(function () {
                                self.scrollArray[2].scrollTo(0, moveLen, 500)
                            }, 0)
                        }
                    }
                }
            });
            self.add_EventListen()
        },
        SetItemList: function (index, nowScroll) {
            var self = this;
            if (nowScroll) {
                var nowItem = {};
                nowItem.value = nowScroll.attributes[0].value;
                nowItem.type = nowScroll.innerHTML
            } else {
                var nowItem = ""
            }
            self.textArray[index] = nowItem;
            self.getMonthLength()
        },
        setDefaultItem: function (index, dateValue) {
            var self = this;
            var nowItem = {};
            nowItem.value = dateValue;
            self.textArray[index] = nowItem
        },
        getYearList: function (index, defaultValue) {
            var self = this;
            var list = '<li></li><li></li>',
                defaultNum = '';
            var maxYear = self.options.maxYear;
            var minYear = self.options.minYear;
            if (defaultValue) {
                var num = 0,
                    isMatch = false;
                for (var i = maxYear; i > minYear; i -= 1) {
                    if (defaultValue == i) {
                        isMatch = true;
                        defaultNum = num;
                        self.setDefaultItem(index, i)
                    }
                    list += '<li data-value="' + i + '">' + i + '年</li>';
                    num += 1
                }
                if (!isMatch) {
                    self.setDefaultItem(index, maxYear)
                }
            } else {
                for (var i = maxYear; i > minYear; i -= 1) {
                    list += '<li data-value="' + i + '">' + i + '年</li>'
                }
                self.setDefaultItem(index, maxYear)
            }
            list += '<li></li><li></li>';
            document.querySelector('#dp-wrapper' + index).childNodes[0].innerHTML = list;
            setTimeout(function () {
                self.scrollInit(index, defaultNum)
            }, 0)
        },
        getMonthList: function (index, defaultValue) {
            var self = this;
            var list = '<li></li><li></li>',
                defaultNum = '';
            var unit = "月",
                prefix = "0";
            if (defaultValue) {
                var num = 0,
                    isMatch = false;
                for (var i = 1; i <= 12; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    if (defaultValue == i) {
                        isMatch = true;
                        defaultNum = num;
                        self.setDefaultItem(index, count)
                    }
                    list += '<li data-value="' + count + '">' + count + unit + '</li>';
                    num += 1
                }
                if (!isMatch) {
                    self.setDefaultItem(index, '01')
                }
            } else {
                for (var i = 1; i <= 12; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    list += '<li data-value="' + count + '">' + count + unit + '</li>'
                }
                self.setDefaultItem(index, prefix + 1)
            }
            list += '<li></li><li></li>';
            document.querySelector('#dp-wrapper' + index).childNodes[0].innerHTML = list;
            setTimeout(function () {
                self.scrollInit(index, defaultNum)
            }, 0)
        },
        getDayList: function (index, defaultValue) {
            var self = this;
            var list = '<li></li><li></li>',
                defaultNum = '';
            var unit = "日",
                prefix = "0";
            if (defaultValue) {
                var num = 0,
                    isMatch = false;
                for (var i = 1; i <= 31; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    if (defaultValue == count) {
                        isMatch = true;
                        defaultNum = num;
                        self.setDefaultItem(index, count)
                    }
                    list += '<li data-value="' + count + '">' + count + unit + '</li>';
                    num += 1
                }
                if (!isMatch) {
                    self.setDefaultItem(index, '01')
                }
            } else {
                for (var i = 1; i <= 31; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    list += '<li data-value="' + count + '">' + count + unit + '</li>'
                }
                self.setDefaultItem(index, prefix + 1)
            }
            list += '<li></li><li></li>';
            document.querySelector('#dp-wrapper' + index).childNodes[0].innerHTML = list;
            setTimeout(function () {
                self.scrollInit(index, defaultNum)
            }, 0)
        },
        getHourList: function (index, defaultValue) {
            var self = this;
            var list = '<li></li><li></li>',
                defaultNum = '';
            var unit = "时",
                prefix = "0";
            if (defaultValue) {
                var num = 0,
                    isMatch = false;
                for (var i = 0; i <= 23; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    if (defaultValue == count) {
                        isMatch = true;
                        defaultNum = num;
                        self.setDefaultItem(index, count)
                    }
                    list += '<li data-value="' + count + '">' + count + unit + '</li>';
                    num += 1
                }
                if (!isMatch) {
                    self.setDefaultItem(index, '01')
                }
            } else {
                for (var i = 0; i <= 23; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    list += '<li data-value="' + count + '">' + count + unit + '</li>'
                }
                self.setDefaultItem(index, prefix + 1)
            }
            list += '<li></li><li></li>';
            document.querySelector('#dp-wrapper' + index).childNodes[0].innerHTML = list;
            setTimeout(function () {
                self.scrollInit(index, defaultNum)
            }, 0)
        },
        getMinutesList: function (index, defaultValue) {
            var self = this;
            var list = '<li></li><li></li>',
                defaultNum = '';
            var unit = "分",
                prefix = "0";
            if (defaultValue) {
                var num = 0,
                    isMatch = false;
                for (var i = 0; i <= 59; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    if (defaultValue == count) {
                        isMatch = true;
                        defaultNum = num;
                        self.setDefaultItem(index, count)
                    }
                    list += '<li data-value="' + count + '">' + count + unit + '</li>';
                    num += 1
                }
                if (!isMatch) {
                    self.setDefaultItem(index, '01')
                }
            } else {
                for (var i = 0; i <= 59; i += 1) {
                    var count = i < 10 ? prefix + i : i;
                    list += '<li data-value="' + count + '">' + count + unit + '</li>'
                }
                self.setDefaultItem(index, prefix + 1)
            }
            list += '<li></li><li></li>';
            document.querySelector('#dp-wrapper' + index).childNodes[0].innerHTML = list;
            setTimeout(function () {
                self.scrollInit(index, defaultNum)
            }, 0)
        },
        getAfternoon: function(index){
            var self = this;
            var list = '<li></li><li></li>',
                defaultNum = '';
            list += '<li data-value="上午">上午</li><li data-value="下午">下午</li>';
            self.setDefaultItem(index, '上午');
            list += '<li></li><li></li>';
            document.querySelector('#dp-wrapper' + index).childNodes[0].innerHTML = list;
            setTimeout(function () {
                self.scrollInit(index, defaultNum)
            }, 0)
        },
        HidePicker: function () {
            var self = this;
            document.querySelector('.zx_select').style.height = '0';
            self.remove_EventListen();
            setTimeout(function () {
                var modalBox = document.querySelector('.zx_mask');
                document.body.removeChild(modalBox);
                self.destroy();
            }, 200)
        },
        eventClick: function () {
            var self = this;
            document.querySelector('.picker-cancel').addEventListener("touchstart", function (e) {
                e.stopPropagation();
                e.preventDefault();
                self.HidePicker()
            });
            document.querySelector('.picker-ok').addEventListener("touchstart", function (e) {
                e.stopPropagation();
                e.preventDefault();
                var inputValue = '';
                for (var i = 0; i < self.textArray.length; i += 1) {
                    if (i == 0) {
                        inputValue += self.textArray[i].value
                    } else {
                        if (self.options.type == 2) {
                            inputValue += ":" + self.textArray[i].value
                        } else if (self.options.type == 4) {
                            if (i == 3) {
                                inputValue += " " + self.textArray[i].value
                            } else if (i == 4) {
                                inputValue += ":" + self.textArray[i].value
                            } else {
                                inputValue += self.options.separator + self.textArray[i].value
                            }
                        } else if(self.options.type == 5){
                            if (i == 3) {
                                inputValue += " " + self.textArray[i].value
                            } else {
                                inputValue += self.options.separator + self.textArray[i].value
                            }
                        } else {
                            inputValue += self.options.separator + self.textArray[i].value
                        }
                    }
                }
                if (self.options.callBack) {
                    self.options.callBack(inputValue)
                }
                self.HidePicker()
            })
        },
        setDefaultOptions: function (params) {
            var self = this;
            var date = new Date();
            var nowYear = date.getFullYear();
            var nowMonth = date.getMonth() + 1;
            var nowDay = date.getDate();
            var nowHour = date.getHours();
            var nowMin = date.getMinutes();
            var type = parseInt(params.type);
            if (type && (type < 0 || type > 5)) {
                params.type = 3
            } else {
                if (type == 0) {
                    params.type = 0
                } else {
                    params.type = type ? type : 3
                }
            }
            params.separator = params.separator ? params.separator : "-";
            nowMonth = nowMonth < 10 ? "0" + nowMonth : nowMonth;
            nowDay = nowDay < 10 ? "0" + nowDay : nowDay;
            nowHour = nowHour < 10 ? "0" + nowHour : nowHour;
            nowMin = nowMin < 10 ? "0" + nowMin : nowMin;
            if (!params.defaultValue || params.defaultValue == "") {
                if (params.type == 0) {
                    params.defaultValue = nowYear
                } else if (params.type == 1) {
                    params.defaultValue = nowYear + params.separator + nowMonth
                } else if (params.type == 2) {
                    params.defaultValue = nowHour + ":" + nowMin
                } else if (params.type == 3 || params.type == 5) {
                    params.defaultValue = nowYear + params.separator + nowMonth + params.separator + nowDay;
                } else if (params.type == 4) {
                    params.defaultValue = nowYear + params.separator + nowMonth + params.separator + nowDay + " " + nowHour + ":" + nowMin
                }
            }
            params.maxYear = params.maxYear ? params.maxYear : (nowYear + 100);
            params.minYear = params.minYear ? params.minYear : (nowYear - 100);
            return params
        },
        getMonthLength: function () {
            var self = this;
            if (self.options.type == 3 || self.options.type == 4) {
                var nowYear = self.textArray[0].value;
                var nowMonth = self.textArray[1].value;
                var leap = self.isLeap(nowYear);
                if (nowMonth == "02") {
                    self.monthLen = 28 + leap
                } else if (nowMonth == "01" || nowMonth == "03" || nowMonth == "05" || nowMonth == "07" || nowMonth == "08" || nowMonth == "10" || nowMonth == "12") {
                    self.monthLen = 31
                } else {
                    self.monthLen = 30
                }
            }
        },
        isLeap: function (year) {
            if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) {
                return 1
            }
            return 0
        },
        enterNodesBlur: function () {
            var inputArr = document.querySelectorAll('input');
            for (var m = 0; m < inputArr.length; m += 1) {
                inputArr[m].blur()
            }
            var textareaArr = document.querySelectorAll('textarea');
            for (var n = 0; n < textareaArr.length; n += 1) {
                textareaArr[n].blur()
            }
        },
        touchDefault: function (e) {
            e.preventDefault()
        },
        touchStop: function (e) {
            e.stopPropagation();
            e.preventDefault()
        },
        add_EventListen: function () {
            var self = this;
            document.addEventListener('touchmove', self.touchDefault, false)
        },
        remove_EventListen: function () {
            var self = this;
            document.removeEventListener('touchmove', self.touchDefault, false)
        },
        destroy: function () {
            var self = this;
            self.options = null;
            self.scrollArray = [];
            self.textArray = [];
            self.isScrollTo = false;
            self.monthLen = 30
        }
    };
    if (typeof module != 'undefined' && module.exports) {
        module.exports = DatePicker
    } else {
        window.DatePicker = DatePicker
    }
})(window, document, Math);