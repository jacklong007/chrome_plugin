// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var loopInterval, executing;

function $(id) {

	return document.getElementById(id);
}

window.onload = function () {

	$("btnTiming").onclick = function () {
		getAndSetParam(1);
	}
	$("btnExec").onclick = function () {
		getAndSetParam(0);
	}
	$("btnCircle").onclick = function () {
		var text = $("btnCircle").innerText;
		if (text.indexOf('循环中') > -1) {
			$("btnCircle").innerText = '循环';
		} else {
			getAndSetParam(2);
		}
	}

}


function getAndSetParam(mode) {
	console.log('点击事件' + mode)
	//var timingTime = $("timingDate").value;
	var execCount = $("execCount").value * 1;//次数
	var execInterval = $("execInterval").value * 1;//间隔
	var elementList = $("elementList").value;//间隔
	var hour = $("timingHours").value;//时
	var minute = $("timingMinute").value;//
	var second = $("timingSecends").value;//时
	var milli = $("timingMs").value;//时
	if (!hour || !second || !minute || !milli || !execCount || !execInterval || !elementList) {
		alert("数据不正确");
		return;

	}
	//时，分，秒，毫秒的格式
	var timeArr = []; //timingTime.split(',');
	timeArr.push(hour);
	timeArr.push(minute);
	timeArr.push(second);
	timeArr.push(milli);
	if (timeArr.length < 4) { alert('定时时间格式错误!'); return; }

	var t = new Date();
	t.setHours(timeArr[0]);
	t.setMinutes(timeArr[1]);
	t.setSeconds(timeArr[2]);
	t.setMilliseconds(timeArr[3]);//timingTime:t,
	var obj = { execCount, execInterval, mode, elementList, 'timingTime': t, timeArr };
	if (elementList.indexOf('[') == 0) {
		obj.clickList = JSON.parse(elementList);
	}

	if (mode == 1) {
		$("btnTiming").innerText = '定时中';
	}
	else if (mode == 0) {
		$("btnExec").innerText = '执行中';
		executing = true;
	}
	else if (mode == 2) {
		obj.circleInterval = $("execCircle").value * 1;
		$("btnCircle").innerText = '循环中';
	}
	sendMessageToContentScript(obj, function (res) {
		console.log('接收到js脚本' + res);
	})

}
// 监听来自content-script的消息   chrome.runtime.onMessage
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

	console.log('收到来自content-script的消息：', request, sender, sendResponse);
	if (request.cmd == 'done') {
		this.onCompleted(request.mode);
	}

	sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
});


function sendMessageToContentScript(msg, callback) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
			if (callback) callback(response);
		});
	});
}
//领取结束
function onCompleted(mode) {
	if (mode == 1) {
		$("btnTiming").innerText = '定时';
	}
	else if (mode == 0) {
		$("btnExec").innerText = '立即执行';
	}
	executing = false;


}


