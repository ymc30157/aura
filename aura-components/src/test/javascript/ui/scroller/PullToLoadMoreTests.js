/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Function.RegisterNamespace("Test.Components.Ui.Scroller");

[Fixture]
Test.Components.Ui.Scroller.PullToLoadMoreTests=function(){

	var targetHelper,
		plugins,
		windowMock=Test.Mocks.NeededMocks.getWindowMock();
	
	windowMock(function(){
		var callback = function (path, fn) {fn();};
		ImportJson("ui.scrollerLib.bootstrap", callback);
		ImportJson("ui.scrollerLib.browserSupport", callback);
		ImportJson("ui.scrollerLib.browserStyles", callback);
		ImportJson("ui.scrollerLib.helpers", callback);
		ImportJson("ui.scrollerLib.CubicBezier", callback);
		ImportJson("ui.scrollerLib.ScrollerJS", callback);
		
		ImportJson("ui.scrollerLib.PullToLoadMore", callback);
		ImportJson("ui.scroller.scrollerHelper",function(path,result){
			targetHelper=result;
		});
		plugins=targetHelper.getScrollerNamespace().plugins;
	});

	[Fixture]
	function InitPTL(){
		[Fact]
		function AppendsPTLcontainer(){
			var PTLplugin,
				neededMocks,
				PTLsurfaceItem;
			
			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				PTLplugin.opts = {};

				neededMocks=Mocks.GetMocks(PTLplugin,{
					"_mergeConfigOptions": function(config){
						return config;
					},
					"on": function(event,action){
						action.call(PTLplugin);
					},
					_setSize: function(){

					},
					scroller: {
						appendChild: function(item){
							PTLsurfaceItem = item;
						}
					}
				});

				neededMocks(function(){
					PTLplugin.init();
				});
			});
			
			Assert.True(
						PTLplugin._ptlIsEnabled()  && 
						PTLsurfaceItem.innerHTML && 
						PTLsurfaceItem.className === 'pullToLoadMore');
		}
	}

	[Fixture]
	function PTLtriggers(){
		
		[Fact]
		function ExecutesPTLtrigger(){
			var PTLplugin,
				neededMocks,
				actual=false;

			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				neededMocks = Mocks.GetMocks(PTLplugin, {
					ptlDOM: {classList: {add: function(_class){}}},
					_ptlTriggered: null,
					_ptlLoading: null,
					ptlLabel:{textContent:''},
					opts: {
						onPullToLoadMore: function(a,b){
							actual = true;
						},
						pullToLoadMoreConfig:{
							labelUpdate:''
						}
					}
				});

				neededMocks(function(){
					PTLplugin.triggerPTL();
				});
			});

			Assert.True(actual);
		}

		[Fact]
		function ExecuteTriggerCallbackToAppendItems(){
			var PTLplugin,
				neededMocks,
				callback,
				itemsLength;

			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				neededMocks = Mocks.GetMocks(PTLplugin, {
					ptlDOM: {classList: {
						add: function(_class){},
						remove: function(_class){}
					}},
					_ptlTriggered: null,
					_ptlLoading: null,
					_ptlSnapTime: null,
					ptlLabel:{textContent:''},
					opts: {
						onPullToLoadMore: function(a,b){
							callback = arguments[0];
						},
						pullToLoadMoreConfig:{
							labelUpdate:''
						}
					},
					appendItems: function(items){
						itemsLength = items.length;
					},
					_resetPosition: function(ptlSnapTime){}
				});

				neededMocks(function(){
					PTLplugin.triggerPTL();
					callback(0,[1,2]);
				});
			});

			Assert.True(itemsLength===2 && !PTLplugin._ptlLoading);
		}

		[Fact]
		function NoAppendIfNoDataProvider(){
			var PTLplugin,
				neededMocks,
				callback,
				appendNotCalled=true;

			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				neededMocks = Mocks.GetMocks(PTLplugin, {
					ptlDOM: {classList: {
						add: function(_class){},
						remove: function(_class){}
					}},
					_ptlTriggered: null,
					_ptlLoading: null,
					_ptlSnapTime: null,
					ptlLabel:{textContent:''},
					opts: {
						onPullToLoadMore: undefined,
						pullToLoadMoreConfig:{
							labelUpdate:''
						}
					},
					appendItems: function(items){
						appendNotCalled = false;
					},
					_resetPosition: function(ptlSnapTime){}
				});

				neededMocks(function(){
					PTLplugin.triggerPTL();
				});
			});

			Assert.True(appendNotCalled && !PTLplugin._ptlLoading);
		}

		[Fact]
		function ExecutesErrorCallbackOnError(){
			var PTLplugin,
				stub,
				neededMocks,
				errorReceived,
				callback,
				appendNotCalled=true;

			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				stub = Stubs.GetObject({
						appendItems: function(items){
							appendNotCalled = false;
						},
						_resetPosition: function(ptlSnapTime){},
						_setPTLErrorState: function(err){}
					},{
					ptlDOM: {classList: {
						add: function(_class){},
						remove: function(_class){}
					}},
					_ptlTriggered: null,
					_ptlLoading: true,
					_ptlSnapTime: null,
					ptlLabel:{textContent:''},
					opts: {
						onPullToLoadMore: function(){
							callback = arguments[0];
						},
						pullToLoadMoreConfig:{
							labelUpdate:''
						}
					}
				});
				neededMocks = Mocks.GetMocks(PTLplugin, stub);

				neededMocks(function(){
					PTLplugin.triggerPTL();
					callback({labelError:'Error'});
					//once when err='Error' and once when setTimeout runs with err=false
					Assert.True(stub._setPTLErrorState.Calls.length===2);
				});
			});
		}
	}

	[Fixture]
	function TogglesPTL(){
		
		[Fact]
		function ShowPTL(){
			var PTLplugin;

			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				PTLplugin.opts = {pullToLoadMore: false};
				PTLplugin.ptlDOM={style:{display:'none'},offsetHeight:1},
				PTLplugin._ptlThreshold;

				PTLplugin.togglePullToLoadMore(true);
			});

			Assert.True(PTLplugin.ptlDOM.style.display === '' && PTLplugin.opts.pullToLoadMore);
		}

		[Fact]
		function HidePTL(){
			var PTLplugin;

			windowMock(function(){
				PTLplugin = new plugins.PullToLoadMore();
				PTLplugin.ptlDOM={style:{display:''}},
				PTLplugin.opts = {pullToLoadMore: true};
				PTLplugin._ptlThreshold;

				PTLplugin.togglePullToLoadMore(false);
			});

			Assert.True(PTLplugin.ptlDOM.style.display === 'none' && 
						!PTLplugin._ptlEnabled 					  &&
						!PTLplugin.opts.pullToLoadMore);
		}
	}
}