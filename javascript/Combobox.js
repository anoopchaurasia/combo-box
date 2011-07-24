(function($) {
	function combobox(list, options, notFoundCallback) {

		var $this = $(this), _selected_pair, _key_list, _text_box, _indexedList, _value_list, _result_box, _btn, _selected_element = $("noelem"), KEY_UP = 38, KEY_DOWN = 40, KEY_ENTER = 13;
		if (!$this.length) {
			throw "No element provided!";
		}
		if (list == null || list == undefined) {
			throw "list size is zero!";
		}
        
		var _settings = {
			defaultText : "",
			maxDisplayResult : 1000,
			triggerAtStart : true,
			hideButton : false,
			showLoadingIcon : false,
			ignoreNumberOfCharacters : 0,
			noFillUpAtStart : false,
			depth : 2,
			hintText : "",
			inputBoxCSS : {},
            onKeyDown: undefined,
            onKeyUp: undefined,
			resultBoxCSS : {},
			inputTabIndex : -1,
			shortKey : "ctrl + shift + c",
			searchFunction : undefined,
			resultFunction : undefined
		};


		_settings = $.extend(_settings, options);

		function getShortKey() {

			var keys = _settings.shortKey.replace(/\s/g, "").toLowerCase()
				.split("+");
			if (keys.length == 0) {
				return false;
			}
			var baseKeys = { ctrlKey:false, shiftKey:false, altKey:false};
			var otherKey = {};
			for( var k in keys ){
				if( keys[ k ].length > 1){
					baseKeys[ keys[ k ] + "Key" ] = true;
				}
				else{

					otherKey[ keys[ k ].toLowerCase() ] = true;
				}
			}
			return { base : baseKeys, other: otherKey };
		}
		function checkMatchKeys( e ){
			var keys = getShortKey( );
			var base = keys.base;
			var other = keys.other;
			var checkMatchKeys = function ( e ){
				if( e["ctrlKey"] == base[ "ctrlKey" ] && e["shiftKey"] == base[ "shiftKey" ] && e["altKey"] == base[ "altKey" ] ){
					if( other[ String.fromCharCode( e.keyCode ).toLowerCase() ] ){
						return true;
					}
				}
				return false;
			};
			 return checkMatchKeys( e );

		}


        // user later
//		function comparator(a, b) {
//			// alphabetical ignore case
//			if (a.k.toUpperCase() > b.k.toUpperCase())
//				return 1;
//			if (b.k.toUpperCase() > a.k.toUpperCase())
//				return -1;
//			return 0;
//		}

		function createTextBox() {

			return $("<input />", {
				"class" : "input_combo",
				"css" : {width: "98%", "height" : $this.height() }
			}).css(_settings.inputBoxCSS).appendTo($this);
		}

		function createResultContainer() {

			var cssProp = {
				'display' : 'none',
				"overflow" : "auto",
				"overflow-x" : "hidden"
			};

			return $("<div />", {
				"class" : "combo_popup",
				css : cssProp
			}).css(_settings.resultBoxCSS).appendTo($this);
		}

		function createBtn() {

			return $("<div />", {
				"class" : "combo_btn"
			}).appendTo($this);
		}
		function createLoadingBtn() {

			return $("<div />", {
				"class" : "combo-loading",
				css : {
					display : 'none'
				}
			}).appendTo($this);
		}
		function ui() {

			$this.css({
				position : "relative"
			}).empty();

			_text_box = createTextBox();
			_result_box = createResultContainer();
			if (!_settings.hideButton) {
				_btn = createBtn();
				_btn.click(textboxClick);
			}
			else if (_settings.showLoadingIcon) {

				_btn = createLoadingBtn();
			}
		}

		function separateInKeyValueList(list) {
			var key_list = [];
			_value_list = [];
			for ( var k = 0, len = list.length; k < len; k++) {
				_value_list.push(list[k].v);
				key_list.push({
					k : list[k].k,
					v : k
				});
			}
			return key_list;
		}
		function indexing(list) {

			var newList = separateInKeyValueList(list);
            _key_list = newList;
			list = null;
			_indexedList = indexSortedArray( newList, _settings.depth, 0 );

			if (_settings.hintText != "") {
				setTextboxValues(_settings.hintText);
			}
			else if ( _settings.triggerAtStart && !_settings.noFillUpAtStart ) {
				_selected_pair = searchResultInIndexedArray(
					_settings.defaultText, _indexedList, _settings )[0];
				_selected_pair = _selected_pair || newList[0];
				setTextboxValues();
				$this.trigger("comboDataChanged", _selected_pair );
			}
			newList = null;
			return _indexedList;
		}

		function textboxKeyUp(e) {

			switch (e.keyCode) {
				case KEY_DOWN :
				case KEY_UP :
					break;
				case KEY_ENTER :
					_selected_element.trigger("click");
					$(this).trigger('blur');
					break;
				default : {
					createPopup($(this).val());
					break;
				}
			}
		}

		function textboxKeyDown(e) {

			switch (e.keyCode) {
				case KEY_DOWN : {
					if (_selected_element.length) {
						if (_selected_element.next().length)
							_selected_element.next().trigger('FocusOn');
					}
					else {
						_selected_element = $("li:first", _result_box);
						_selected_element.trigger('FocusOn');
					}
					break;
				}
				case KEY_UP : {
					if (_selected_element.prev().length)
						_selected_element.prev().trigger('FocusOn');
				}
			}
		}

		function textboxClick() {
			_text_box.select();
			_text_box.focus();
			createPopup();
		}

		function textboxOnFocus() {

			if (_settings.hintText != ''
				&& $.trim(this.value) == $.trim(_settings.hintText)) {
				this.value = '';
				this.style.color = '#000000';
			}

		}

		function textboxOnBlur() {

			if (_settings.hintText != '' && $.trim(this.value) == '') {
				this.value = $.trim(_settings.hintText);
				this.style.color = '#808080';
			}
		}

		function result_mouseEnterEvnt(e) {
			$(e.target).trigger('FocusOn', true);
			return;
		}
		function result_focusOnEvnt(e, data) {

			var target = e.target;
			if (target.nodeName.toUpperCase() != "LI")
				return;
			_selected_element.removeClass("selected");
			var popupHeight = _result_box.height();
			_selected_element = $(target);
			_selected_element.addClass("selected");
			if (!data) {
				_result_box[0].scrollTop = (_selected_element.index() + 1) * 20
					- popupHeight;
			}
			return;
		}
		function result_clickOnEvnt(e) {

			var target = e.target;
			if (target.nodeName.toUpperCase() != "LI")
				return;
			var _clicked_li = $(target);
			var key = _value_list[_clicked_li.attr('key')];
			if (true) {
				_selected_pair = {
					k : _clicked_li.text(),
					v : key
				}
				setTextboxValues();
				if (_selected_pair.v && _selected_pair.v != "") {
					$this.trigger("comboDataChanged", _selected_pair);
				}
			}
			_result_box.hide();
			_text_box.blur();
			return;
		}
		function setTextboxValues(hint) {
			if (hint && hint != "") {
				_text_box.val(hint).css("color", "#cccccc");
			}
			else {
				_text_box.val(_selected_pair.k).css("color", "");
			}
		}

		function createUi(list, searchString) {
			
			if(typeof _settings.resultFunction== "function"){
				
				_settings.resultFunction( list, _value_list );
				return ;
			}
			_result_box.empty().css('display', '');
			if (!list.length && isNaN(searchString)) {

				_result_box.html("It is not present in the list");
				return;
			}

			var ulList = createResultUI(list);
			ulList.appendTo(_result_box);
			(_selected_element = $("li:first", ulList)).trigger("FocusOn");
		}
		var _s_string;
		function createPopup(searchString) {

			_s_string = searchString;
			if( _settings.ignoreNumberOfCharacters == 0){
				searchString = searchString?searchString:"";
			}
			if (searchString == undefined) {
				_result_box.hide();
				return;
			}
			if(searchString.length == 0){
				$this.trigger("combo_data_cleared");
			}
			if (searchString.length < _settings.ignoreNumberOfCharacters) {
				if(searchString.length != 0){
					$this.trigger("combo_data_cleared");
				}
				_result_box.hide();
				return;
			}
            var resultArray;
            if( _settings.searchFunction ){

                resultArray  = _settings.searchFunction( searchString, _key_list );
            }
            else{

                resultArray = searchResultInIndexedArray( searchString,
				_indexedList, _settings );
            }

			if (resultArray.length) {
				createUi(resultArray);
			}
			else if (notFoundCallback) {

				_btn.show();
				notFoundCallback(searchString, function(list) {
					_result_box.empty();
					var newList = separateInKeyValueList(list);
					createUi(newList, searchString);
					_btn.hide();
				});
			}
            else{
            	createUi([]);
                _result_box.hide();
            }
		}

		this.updateKey = function(origKey, value) {

			key = origKey.toString().toLowerCase();
			var temp = _indexedList;
			for ( var m = 0; m <= _settings.depth; m++) {
				temp = temp[key.charAt(m)];
				if (temp == undefined) {
					break;
				}
			}
			if (temp != undefined) {
				for ( var obj in temp) {

					if (temp[obj].k && (temp[obj].k.toLowerCase() == key) ) {
						_value_list[temp[obj].v] = value;						
						break;
					}
				}
			}
			else {

				this.addNewEntry(key, value);
			}
		};

		this.addNewEntry = function( origKey, value ) {

			key = origKey.toString();
			var k = _value_list.length;
			_value_list.push(value);
			var tmpArr = [{
				v : k,
				k : origKey
			}];
			var temp = _indexedList;
			var keyString;
			var indexed = indexSortedArray(tmpArr, _settings.depth, 0	);
			for ( var m = 0; m <= _settings.depth && m < key.length; m++) {

				keyString = key.charAt(m).toLowerCase();
				if (temp[keyString] == undefined) {
					break;
				}
				temp = temp[keyString];
				indexed = indexed[keyString];
			}
			if (temp[keyString] == undefined) {
				temp[keyString] = indexed[keyString];
				
			}
			else {
				temp.push(indexed);
			}
			_key_list.push( tmpArr[0] );
			_value_list.push( value );
		};

		function constructor() {
			ui();
			indexing(list);
			_text_box.attr('tabindex', _settings.inputTabIndex).keyup(
				textboxKeyUp).keydown(textboxKeyDown).click(textboxClick)
				.focus(textboxOnFocus).blur(textboxOnBlur);
			_result_box.mousemove(result_mouseEnterEvnt).bind("FocusOn",
				result_focusOnEvnt).click(result_clickOnEvnt);
			$(document).bind("click", function(e) {
				if (_btn && (_btn.get(0) == e.target))
					return;
				if ((_text_box.get(0) == e.target))
					return;
				_result_box.hide();
			});
			$(document).keydown(
				function(e) {
					if (  checkMatchKeys ( e )) {
						if ( $this[0].offsetLeft != 0
							&& $this[0].offsetTop != 0) {
							textboxClick();
							return false;
						}
					}
					return true;
				});
		}
		constructor();
		return this;
	}
	function createResultUI(list) {

		var $ul = $('<ul/>', {});
		var i = 0;
		$ul.attr("tabindex", 2);
		var obj = "";
		var len = list.length;
		for (; i < len; i++) {
			obj += "<li style='line-height:20px;display: block; cursor: pointer' key='"
				+ list[i].v + "'>" + list[i].k + "</li>";
		}
		($ul).html(obj);
		return $ul;
	}
	function searchResultInIndexedArray(searchString, indexedArray, _settings) {
		searchString = searchString.toLowerCase();
		function searchStr(indexedArray, depth, start) {
			var ch, resultArray = indexedArray, strlen = searchString.length, len = strlen < depth
				? strlen
				: depth;
			for ( var i = start; i < len; i++) {
				ch = searchString.charAt(i);
				resultArray = resultArray[ch];
				if (!resultArray)
					return [];
			}
			if (strlen > len) {
				var localIndexedArray = indexSortedArray(resultArray,
					strlen - 1, len);
				resultArray = searchStr(localIndexedArray, strlen + 1, len);
			}
			return resultArray;
		}
		var totalResults = 0;
		function convertResultIntoArray(searchedList, len, maxListLen) {

			if (!searchedList)
				return [];
			var resultArray = [], k;
			if ( searchedList[0] && typeof searchedList[0].k != "object" && typeof searchedList[0].k != "undefined" ) {
				for (k in searchedList) {
					var val = searchedList[k].k;
					if ( val.length >= len && maxListLen > totalResults ){						
						totalResults++;
						resultArray.push( searchedList[k] );
                    }else{                    	
                    	break;
                    }
				}
				return resultArray;
			}
			for ( var i in searchedList ) {
				resultArray  = resultArray.concat(convertResultIntoArray(
					searchedList[i], len, maxListLen));				 
				 if( totalResults >= maxListLen ){					 
					 break;
				 }
			}
			return resultArray;
		}
		var searchedArray = searchStr(indexedArray, _settings.depth + 1,
			0);
		return convertResultIntoArray( searchedArray, searchString.length, _settings.maxDisplayResult);
	}
	
	function indexSortedArray( list, maxDepth, currentDepth) {

		var indexed = {};
		function setString( clone, str ){
            var ch;
            for( var m = currentDepth; m< maxDepth; m++ ){
               ch = str.charAt(m).toLowerCase();
               clone[ ch ] = clone[ ch ] || { };
               clone = clone[ ch ];
            }
            ch = str.charAt( m ).toLowerCase( );
            clone[ ch ] = clone[ ch ]||[ ];
            return clone[ ch ];
        }
        function createIndexArray( list ){

            var kTh;
            for( var k =0, len = list.length; k<len; k++ ){
                kTh = list[ k ];
                 setString( indexed, kTh.k ).push( kTh );

            }
            return indexed;
        }
		return createIndexArray( list );
	}
	$.fn.createCombobox = combobox;
})(jQuery);