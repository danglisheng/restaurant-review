(function(){
		const currentCache='restaurant-review-v3';
		let	cachearr;
		/* 此函数用来构造缓存URL数组。*/
		function buildCachearr(){
			cachearr=[
			'./',
			// './restaurant.html',
			'./css/styles.css',
			'./data/restaurants.json',
			 './js/dbhelper.js',
			 './js/main.js',
			 './js/restaurant_info.js',
			 './sw.js'
			]
			for(var i=1;i<11;i++) {
				cachearr.push('./img/'+i+'.jpg');
			}
		}
		/* 此函数用来判断是否是对
		 * 非字体资源的跨域请求
		 * 参数：Request对象
		 * 返回值：代表是否跨域的布尔值
		 */
		function CORSReqNotForFont(req) {
			return (req.url.indexOf(location.host)===-1)&&
						 (req.url.indexOf("fonts")===-1);
		}
		/* 为service worker的全局执行上下文对象注册
		 * install事件处理程序，在其回调函数中
		 * 进行静态文件的初始化缓存。
		*/
		self.addEventListener('install',function(event){
			buildCachearr();
			event.waitUntil(
				caches.open(currentCache).then((cache)=>{
					fetch('./restaurant.html').then((response)=>{
						cache.put('./restaurant.html',response);
					})
					return cache.addAll(cachearr);
				}));
			self.skipWaiting();
		})
		/* 为service worker的全局执行上下文对象注册
		 * activate事件处理程序，在其回调函数中
		 * 删除过期的cache
		*/
		self.addEventListener('activate',function(event){
			caches.keys().then((cachesArr)=>{
				cachesArr.forEach((cacheName)=>{
					if(cacheName!==currentCache){
						caches.delete(cacheName);
					}
				})
			})
		});

		/* 为service worker的全局执行上下文对象注册
		 * fetch事件处理程序，在其回调函数中
		 * 针对不同请求返回不同响应。
		*/
		self.addEventListener('fetch',function(event) {
			var req=event.request;
			/* 如果是对非字体资源的跨域请求，则将其改为“no-cors”模式*/
		  var newreq=CORSReqNotForFont(req)?new Request(req.url,{mode:"no-cors"}):req;
		  var restaurantBaseURL="./restaurant.html";
		  /*若请求的资源是restaurant.html,则直接从缓存中返回*/
		  if(req.url.indexOf("restaurant.html")!==-1){
		  	return event.respondWith(caches.open(currentCache).then((cache)=>
		  		{
		  			return cache.match(restaurantBaseURL);
		  		}));
		  }
		  /* 若请求的是其它资源，则查看缓存。
		   * 若缓存中有匹配请求，从缓存中返回响应。
		   * 否则，从网络中请求。
		   */
			event.respondWith(
		    caches.open(currentCache).then(function(cache) {
		      return cache.match(req).then(function (response) {
		        return response || 
		        fetch(newreq).then(function(response) {
		          cache.put(event.request, response.clone());
		          return response;
		        }).
		        catch(function(error){
		        	console.log(error);
		        	return new Response();
		        });
		      });
		    })
		  );
		});
})()
