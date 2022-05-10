
function $(id) {

var eles=document.querySelectorAll(id);
if(eles&&eles.length>0) return eles;
	if (id[0] == '#') {
		id = id.substr(1);
		return document.getElementById(id);
	}
	if (id[0] == '.') {
		id = id.substr(1);
		return document.getElementsByClassName(id);
	}

	return document.getElementsByTagName(id);
}

// 监听来自content-script的消息  chrome.runtime.onMessage.
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log('收到来自后台的消息：');
	console.log(request, sender, sendResponse);
	if (request && request.execCount) {
		request.execCount = request.execCount * 1;
		this.exec(request);
		sendResponse("contentjs已经收到消息")
		return
	}
	sendResponse('我是前台，我已收到你的消息：' + JSON.stringify(request));
});


function sendMessageToChrome(message, callback) {
	//  chrome.runtime.sendMessage
	chrome.runtime.sendMessage(message, callback);
}

var eles;
var requestObj;
var circleInterval = 0;
function exec(param) {
	requestObj = param;
	eles = param.elementList.trim().split(/\s+/);
	var execCount = param.execCount * 1;
	//立即执行
	if (param.mode == 0) {
		function selfExcu() {
			if (execCount == 0) {
				sendMessageToChrome({ cmd: 'done', mode: param.mode }, function () {
					console.log('发送立即执行完成到插件成功!', new Date())
				});
				return;
			}
			--execCount;
			setTimeout(function () {
				doClicks(param);
				selfExcu();
			}, param.execInterval);

		}
		selfExcu();

	} else if (param.mode == 1) {//定时
		var now = new Date();
		var interval, execInterval;
		console.log("准备定时", new Date());
		var t = new Date();
		var timeArr = param.timeArr;
		t.setHours(timeArr[0]);
		t.setMinutes(timeArr[1]);
		t.setSeconds(timeArr[2]);
		t.setMilliseconds(timeArr[3]);
		interval = setInterval(function () {
			now = new Date();
			if (now.getHours() == t.getHours() && now.getMinutes() >= t.getMinutes() && now.getSeconds() >= t.getSeconds() && now.getMilliseconds() >= t.getMilliseconds()) {
				clearInterval(interval);
				console.log("开始执行定时", new Date());
				execInterval = setInterval(function () {
					if (execCount == 0) {
						clearInterval(execInterval);
						sendMessageToChrome({ cmd: 'done', mode: param.mode }, function () {
							console.log('发送定时完成到插件成功!', new Date())
						});
						return;
					}
					--execCount;
					doClicks(param);

				}, param.execInterval);
			}

		}, 50);
	} else if (param.mode == 2) {
		clearInterval(circleInterval);
		param.mode = 0;
		exec(param);
		var that = this;
		circleInterval = setInterval(function () {
			console.log('循环执行一次', new Date());
			requestObj.next2Click = undefined;
			that.exec(requestObj);

		}, param.circleInterval * 1000);

	}
}
function doClicks(param, model) {

	if (!model && requestObj.clickList && (!requestObj.next2Click || requestObj.next2Click == -1)) {
		return afterReload();
	}

	console.log('执行一次', new Date());
	for (var i = 0; i < eles.length; i++) {
		var selector = eles[i].trim();
		var ele = $(selector);
		if (!selector || !ele) return;
		try {
			//
			if (typeof ele == 'function' || ele.length > 0) {
				for (var i = 0; i < ele.length; i++) {
					ele[i].click();
				}
			} else
				ele.click();
		} catch (e) {
			console.error("执行点击事件出错", e, ele, selector);
		}

	}
}
//执行窗体重载的点击
function afterReload() {
	var clickElement;
	//第一次过来
	if (requestObj.next2Click === undefined) {
		if (requestObj.clickList.length < 0) return;
		requestObj.next2Click = 0;
		clickElement = requestObj.clickList[requestObj.next2Click];
		doSingleConfigClick(clickElement);
	} else {
		//窗体重载后
		clickElement = requestObj.clickList[requestObj.next2Click];
		eles = clickElement.elements;
		doClicks(null, 1);
		//延迟指定时间后,继续下一个执行
		requestObj.next2Click++;
		var that = this;
		//最后一个了
		if (requestObj.next2Click > requestObj.clickList.length - 1) {
			requestObj.next2Click = undefined;
			restartCircle();
		} else {
			var timeOut = clickElement.timeOut;
			clickElement = requestObj.clickList[requestObj.next2Click];
			setTimeout(function () {
				that.doSingleConfigClick(clickElement);
			}, timeOut);
		}
	}

}

function doSingleConfigClick(obj) {
	var that = this;
	if (obj.reload) {
		var search = setQueryString('contentjs', encodeURIComponent(JSON.stringify(requestObj)));
		location.search = search;
	} else {//立即点击执行的
		eles = obj.elements;
		doClicks(null, 1);
		//延迟指定时间后,继续下一个执行
		requestObj.next2Click++;
		//最后一个了
		if (requestObj.next2Click > requestObj.clickList.length - 1) {
			requestObj.next2Click = undefined;
			restartCircle();
		} else {
			var timeOut = obj.timeOut;
			obj = requestObj.clickList[requestObj.next2Click];
			setTimeout(function () {
				that.doSingleConfigClick(obj);
			}, timeOut);
		}
	}
}

function restartCircle() {
	var that = this;
	if (requestObj.next2Click == undefined && requestObj.circleInterval && !circleInterval)//重新进循环
		setTimeout(function () {
			exec(requestObj);
		}, requestObj.circleInterval * 1000);
}


window.onload = function () {
	console.log("这是content脚本加载", new Date());
	//[{"loadedDelay":10000,"timeOut":50,"elements":[".wmTaskV3GiftBtn-btn"],"reload":true},{"loadedDelay":10000,"timeOut":50,"elements":[".wmTaskV3GiftBtn-btn"],"reload":true}]
	//从URL中取得请求数据
	var str = this.decodeURIComponent(this.getQueryStringByName("contentjs"));
	var that = this;
	if (str) {
		requestObj = JSON.parse(str);
		console.log("加载requestobj", this.requestObj);
		if (this.requestObj.next2Click > -1 && this.requestObj.next2Click < this.requestObj.clickList.length) {
			var clickObj = this.requestObj.clickList[requestObj.next2Click];
			setTimeout(function () {
				that.afterReload();
			}, clickObj.loadedDelay);

		} else if (this.requestObj.circleInterval && this.requestObj.next2Click === undefined) {
			that.setTimeout(function () {
				//重载页面后的循环问题
				that.exec(that.requestObj);
			}, that.requestObj.circleInterval * 1000);

		}
	}
}




//根据QueryString参数名称获取值

function getQueryStringByName(name) {

	var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));

	if (result == null || result.length < 1) {

		return "";

	}

	return result[1];

}

function setQueryString(key, value) {

	var str = location.search;
	if (!str)
		str = "?";
	if (!getQueryStringByName(key))
		return str += '&' + key + '=' + value;
	return str.replace(new RegExp("(?<=[\?\&]" + key + "=)([^\&]+)", "i"), value);

}


