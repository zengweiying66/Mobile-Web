// 入口函数，页面加载完成之后执行
window.onload = function() {
	search();
	downTime();
	bannerEffect();
};
// 搜索栏
function search() {
	// 1. 获取当前banner元素的高度
	var banner = document.querySelector('.hm_banner');
	var bannerHeight = banner.offsetHeight;
	// 获取header搜索块元素
	var search = document.querySelector('.hm_header');
	// 监听屏幕滚动
	window.onscroll = function() {
		// 2. 获取当前屏幕滚动时，banner滚动出屏幕的距离，也就是当前整个文档滚动出屏幕的高度。同时处理兼容性。
		var offsetTop = document.body.scrollTop || document.documentElement.scrollTop;
		// 3. 计算比例值，获取透明度，设置背景颜色的样式
		var opacity = 0; // 默认透明度为0
		// 判断如果当banner还没有完全滚出屏幕，才有必要去计算并设置透明度
		if (offsetTop < bannerHeight) {
			opacity = offsetTop / bannerHeight;
			// 设置样式
			search.style.backgroundColor = 'rgba(201,21,35,' + opacity + ')';
		}
	}
}
// 倒计时
function downTime() {
	// 获取用于展示时间的span
	var spans = document.querySelector('.sk_time').querySelectorAll('span');
	// 设置初始的倒计时时间（以秒为单位）
	var totalTime = 1 * 60 * 60;
	// 开启定时器
	var timer = setInterval(() => {
		totalTime--;
		// 判断倒计时时间是否已经完成
		if (totalTime < 0) {
			clearInterval(timer); // 清除时钟
			return;
		}
		// 获取剩余时间中的 时分秒
		var h = Math.floor(totalTime / 3600); // 获取小时数
		var m = Math.floor(totalTime % 3600 / 60); // 获取分钟数
		var s = Math.floor(totalTime % 60); // 获取秒钟数
		// 赋值，将时间填充到span中
		spans[0].innerHTML = Math.floor(h / 10);
		spans[1].innerHTML = Math.floor(h % 10);
		spans[3].innerHTML = Math.floor(m / 10);
		spans[4].innerHTML = Math.floor(m % 10);
		spans[6].innerHTML = Math.floor(s / 10);
		spans[7].innerHTML = Math.floor(s % 10);
	}, 1000);
}
// 轮播图
function bannerEffect() {
	// 在开始位置添加原始的最后一张图片
	// 在结束位置添加原始的第一张图片
	// 获取轮播图结构
	var banner = document.querySelector('.hm_banner');
	var imgBox = banner.querySelector('ul:first-of-type');
	// 获取原始的第一张图片
	var first = imgBox.querySelector('li:first-of-type');
	// 获取原始的最后一张图片
	var last = imgBox.querySelector('li:last-of-type');
	// 在首尾插入两张图片   cloneNode：复制一个DOM元素
	imgBox.appendChild(first.cloneNode(true));
	// insertBefore(需要插入的DOM元素, 位置)
	imgBox.insertBefore(last.cloneNode(true), imgBox.firstChild);

	// 设置对应的样式
	// 获取所有图片li元素
	var lis = imgBox.querySelectorAll('li');
	// 获取li元素的数量
	var count = lis.length;
	// 获取banner的宽度
	var bannerWidth = banner.offsetWidth;
	// 设置图片盒子的宽度
	imgBox.style.width = count * bannerWidth + 'px';
	// 设置每一个li元素的宽度
	for (var i = 0; i < lis.length; i++) {
		lis[i].style.width = bannerWidth + 'px';
	}

	// 定义图片索引，图片已经有一个宽度的默认偏移
	var index = 1;
	imgBox.style.left = -bannerWidth + 'px'; // 设置默认的偏移
	// 当屏幕变化的时候，重新计算宽度
	window.onresize = function() {
		// 获取banner的宽度，覆盖全局的宽度值
		bannerWidth = banner.offsetWidth;
		// 设置图片盒子的宽度
		imgBox.style.width = count * bannerWidth + 'px';
		// 设置每一个li元素的宽度
		for (var i = 0; i < lis.length; i++) {
			lis[i].style.width = bannerWidth + 'px';
		}
		// 重新设置偏移
		imgBox.style.left = -index * bannerWidth + 'px';
	};

	// 实现点标记
	var setIndicator = function(index) {
		var indicators = banner.querySelector('ul:last-of-type').querySelectorAll('li');
		// 先清除其他li元素的active样式
		for (var i = 0; i < indicators.length; i++) {
			indicators[i].classList.remove('active');
		}
		// 为当前li元素添加active样式
		indicators[index - 1].classList.add('active');
	}

	var timerId;
	// 实现自动轮播
	var startTime = function() {
		timerId = setInterval(function() {
			// 变换索引
			index++;
			// 添加过渡效果
			imgBox.style.transition = 'left 0.5s ease-in-out';
			// 设置偏移
			imgBox.style.left = (-index * bannerWidth) + 'px';
			// 判断是否到最后一张，如果是则回到索引1的位置
			setTimeout(function() {
				if (index == count - 1) {
					index = 1;
					// 如果一个元素的某个属性之前添加过过渡效果，那么过渡属性会一直存在，如果不想要，则需要清除过渡效果
					// 关闭过渡效果
					imgBox.style.transition = 'none';
					// 偏移到指定的位置
					imgBox.style.left = (-index * bannerWidth) + 'px';
				}
			}, 500);
		}, 2000);
	}
	startTime();

	// 实现手动轮播，注意touch事件的触发，必须保证元素有具体的宽高值，如果宽高为0，则不会进行触发。
	// 记录开始坐标值、滑动过程中的坐标值、两者的差异值
	var startX, moveX, distanceX;
	// 标记当前过渡效果是否已经执行完毕
	var isEnd = true; // 默认没有加过渡效果，标记当前过渡效果是否已经执行完毕
	// 为图片添加触摸开始事件
	imgBox.addEventListener('touchstart', function(e) {
		// 清除定时器
		clearInterval(timerId);
		// 获取当前手指的起始位置
		startX = e.targetTouches[0].clientX;
	});

	// 为图片添加触摸滑动过程事件
	imgBox.addEventListener('touchmove', function(e) {
		if (isEnd == true) {
			// console.log('touchmove');
			// 记录手指在滑动过程中的位置
			moveX = e.targetTouches[0].clientX;
			// 计算坐标的差异
			distanceX = moveX - startX;
			// 为了保证效果正常，将之前可能添加的过渡样式清除
			imgBox.style.transition = 'none';
			// 实现元素的偏移  left参照最原始的坐标
			// 本次的滑动操作应该基于之前轮播图已经偏移的距离
			imgBox.style.left = (-index * bannerWidth + distanceX) + 'px';
		}
	});

	// 为图片添加触摸结束事件
	// 判断当前滑动的距离，如果超出指定的范围就翻页，否则回弹
	imgBox.addEventListener('touchend', function(e) {
		// 松开手指，标记当前过渡效果正在执行
		isEnd = false;
		// 获取当前滑动的距离，判断距离是否超出指定的范围 100px
		if (Math.abs(distanceX) > 100) {
			// 判断滑动的方向
			if (distanceX > 0) {
				index--; // 上一张
			} else {
				index++; // 下一张
			}
			// 翻页，下一张图
			imgBox.style.transition = 'left 0.5s ease-in-out';
			imgBox.style.left = -index * bannerWidth + 'px';
		} else if (Math.abs(distanceX) > 0) { //得保证用户确实进行过滑动操作
			// 回弹
			imgBox.style.transition = 'left 0.5s ease-in-out';
			imgBox.style.left = -index * bannerWidth + 'px';
		}
		// 将上一次move所产生的数据重置为0
		startX = 0;
		moveX = 0;
		distanceX = 0;
	});

	// webkitTransitionEnd：可以监听当前元素的过渡效果执行完毕，当一个元素的过渡效果执行完毕的时候，会触发这个事件
	imgBox.addEventListener('webkitTransitionEnd', function() {
		//console.log('webkitTransitionEnd');
		// 如果到了最后一张(count - 1)，回到索引1
		// 如果到了第一张(0)，回到索引count-2
		if (index == count - 1) {
			index = 1;
			// 清除过渡
			imgBox.style.transition = 'none';
			// 设置偏移
			imgBox.style.left = -index * bannerWidth + 'px';
		} else if (index == 0) {
			index = count - 2;
			// 清除过渡
			imgBox.style.transition = 'none';
			// 设置偏移
			imgBox.style.left = -index * bannerWidth + 'px';
		}
		// 设置标记
		setIndicator(index);
		setTimeout(function() {
			isEnd = true;
			// 清除之前添加的定时器
			clearInterval(timerId);
			// 重新开启定时器
			startTime();
		}, 1000);
	});
}