/**
 * guiders.js
 *
 * version 1.2.0
 *
 * Developed at Optimizely. (www.optimizely.com)
 * We make A/B testing you'll actually use.
 *
 * Released under the Apache License 2.0.
 * www.apache.org/licenses/LICENSE-2.0.html
 *
 * Questions about Guiders or Optimizely?
 * Email us at jeff+pickhardt@optimizely.com or hello@optimizely.com.
 *
 * Enjoy!
 */

var guiders = (function($) {
  var guiders = {};
  
  guiders.version = "1.2.0";

  guiders._defaultSettings = {
    attachTo: null,
    buttons: [],
    buttonCustomHTML: "",
    classString: null,
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    highlight: null,
    isHashable: true,
    offset: {
        top: null,
        left: null
    },
    onShow: null,
	onHide: null,
    overlay: false,
    position: 0, // 1-12 follows an analog clock, 0 means centered
    title: "Sample title goes here",
    width: 400,
    xButton: true, // this places a closer "x" button in the top right of the guider
	live: false
  };

  guiders._htmlSkeleton = [
    "<div class='guider'>",
    "  <div class='guider_content'>",
    "    <h1 class='guider_title'></h1>",
    "    <div class='guider_close'></div>",
    "    <p class='guider_description'></p>",
    "    <div class='guider_buttons'>",
    "    </div>",
    "  </div>",
    "  <div class='guider_arrow'>",
    "  </div>",
    "</div>"
  ].join("");

  guiders._arrowSize = 26; // = arrow's width and height
  guiders._currentGuiderID = null;
  guiders._guiders = {};
  guiders._lastCreatedGuiderID = null;
  guiders._closeButtonTitle = "Close";
  guiders._nextButtonTitle = "Next";
  guiders._prevButtonTitle = "Previous";
  guiders._zIndexForHighlight = 10001;

  guiders._addButtons = function(myGuider) {	
    // Add buttons
    var guiderButtonsContainer = myGuider.elem.find(".guider_buttons");
	
	//Clear the button container
	guiderButtonsContainer.empty();
  
    if (myGuider.buttons === null || myGuider.buttons.length === 0) {
      guiderButtonsContainer.remove();
      return;
    }
	else if(guiderButtonsContainer.length === 0) {
		guiderButtonsContainer = $('<div></div>', { "class" : "guider_buttons" }).appendTo(myGuider.elem.find('.guider_content'));
	}
  
    for (var i = myGuider.buttons.length-1; i >= 0; i--) {
      var thisButton = myGuider.buttons[i];
      var thisButtonElem = $("<a></a>", {
                              "class" : "guider_button",
                              "text" : thisButton.name});
      if (typeof thisButton.classString !== "undefined" && thisButton.classString !== null) {
        thisButtonElem.addClass(thisButton.classString);
      }
  
      guiderButtonsContainer.append(thisButtonElem);

      if (thisButton.onclick) {
        thisButtonElem.bind("click", myGuider, thisButton.onclick);
      } else if (thisButton.name.toLowerCase() === guiders._closeButtonTitle.toLowerCase()) { 
        thisButtonElem.bind("click", function() {guiders.hideAll();});
      } else if (thisButton.name.toLowerCase() === guiders._nextButtonTitle.toLowerCase()) { 
        thisButtonElem.bind("click", function() {guiders.goTo('next');});
      } else if (thisButton.name.toLowerCase() === guiders._prevButtonTitle.toLowerCase()) { 
        thisButtonElem.bind("click", function() {guiders.goTo('prev');});
      }
    }
  
    if (myGuider.buttonCustomHTML !== "") {
      var myCustomHTML = $(myGuider.buttonCustomHTML);
      myGuider.elem.find(".guider_buttons").append(myCustomHTML);
    }
  };

  guiders._addXButton = function(myGuider) {
      var xButtonContainer = myGuider.elem.find(".guider_close");
      var xButton = $("<div></div>", {
                      "class" : "x_button",
                      "role" : "button"});
      xButtonContainer.append(xButton);
      xButton.click(function() {guiders.hideAll();});
  };

  guiders._attach = function(myGuider) {
    if (myGuider === null) {
      return;
    }
    
    var myHeight = myGuider.elem.innerHeight();
    var myWidth = myGuider.elem.innerWidth();
    
    if (myGuider.position === 0 || myGuider.attachTo === null) {
      myGuider.elem.css("position", "absolute");
      myGuider.elem.css("top", ($(window).height() - myHeight) / 3 + $(window).scrollTop() + "px");
      myGuider.elem.css("left", ($(window).width() - myWidth) / 2 + $(window).scrollLeft() + "px");
      return;
    }
    
    var attachTo = $(myGuider.attachTo);
	if(attachTo.length < 1) {
		return;
	}
	
    var base = attachTo.offset();
    var attachToHeight = attachTo.innerHeight();
    var attachToWidth = attachTo.innerWidth();
    
    var top = base.top;
    var left = base.left;
    
    var bufferOffset = 0.9 * guiders._arrowSize;
    
    var offsetMap = { // Follows the form: [height, width]
      1: [-bufferOffset - myHeight, attachToWidth - myWidth],
      2: [0, bufferOffset + attachToWidth],
      3: [attachToHeight/2 - myHeight/2, bufferOffset + attachToWidth],
      4: [attachToHeight - myHeight, bufferOffset + attachToWidth],
      5: [bufferOffset + attachToHeight, attachToWidth - myWidth],
      6: [bufferOffset + attachToHeight, attachToWidth/2 - myWidth/2],
      7: [bufferOffset + attachToHeight, 0],
      8: [attachToHeight - myHeight, -myWidth - bufferOffset],
      9: [attachToHeight/2 - myHeight/2, -myWidth - bufferOffset],
      10: [0, -myWidth - bufferOffset],
      11: [-bufferOffset - myHeight, 0],
      12: [-bufferOffset - myHeight, attachToWidth/2 - myWidth/2]
    };
    
    offset = offsetMap[myGuider.position];
    top   += offset[0];
    left  += offset[1];
    
    if (myGuider.offset.top !== null) {
      top += myGuider.offset.top;
    }
    
    if (myGuider.offset.left !== null) {
      left += myGuider.offset.left;
    }
    
    myGuider.elem.css({
      "position": "absolute",
      "top": top,
      "left": left
    });
  };

  guiders._guiderById = function(id) {
    if (typeof guiders._guiders[id] === "undefined") {
      throw "Cannot find guider with id " + id;
    }
    return guiders._guiders[id];
  };

  guiders._showOverlay = function() {
    $("#guider_overlay").fadeIn("fast", function(){
      if (this.style.removeAttribute) {
        this.style.removeAttribute("filter");
      }
    });
    // This callback is needed to fix an IE opacity bug.
    // See also:
    // http://www.kevinleary.net/jquery-fadein-fadeout-problems-in-internet-explorer/
  };

  guiders._highlightElement = function(selector) {
    $(selector).css({'z-index': guiders._zIndexForHighlight});
  };

  guiders._dehighlightElement = function(selector) {
    $(selector).css({'z-index': 1});
  };

  guiders._hideOverlay = function() {
    $("#guider_overlay").fadeOut("fast");
  };

  guiders._initializeOverlay = function() {
    if ($("#guider_overlay").length === 0) {
      $("<div id=\"guider_overlay\"></div>").hide().appendTo("body");
    }
  };

  guiders._styleArrow = function(myGuider) {
    var position = myGuider.position || 0;
    if (!position) {
      return;
    }
    var myGuiderArrow = $(myGuider.elem.find(".guider_arrow"));
    var newClass = {
      1: "guider_arrow_down",
      2: "guider_arrow_left",
      3: "guider_arrow_left",
      4: "guider_arrow_left",
      5: "guider_arrow_up",
      6: "guider_arrow_up",
      7: "guider_arrow_up",
      8: "guider_arrow_right",
      9: "guider_arrow_right",
      10: "guider_arrow_right",
      11: "guider_arrow_down",
      12: "guider_arrow_down"
    };
    myGuiderArrow.addClass(newClass[position]);
  
    var myHeight = myGuider.elem.innerHeight();
    var myWidth = myGuider.elem.innerWidth();
    var arrowOffset = guiders._arrowSize / 2;
    var positionMap = {
      1: ["right", arrowOffset],
      2: ["top", arrowOffset],
      3: ["top", myHeight/2 - arrowOffset],
      4: ["bottom", arrowOffset],
      5: ["right", arrowOffset],
      6: ["left", myWidth/2 - arrowOffset],
      7: ["left", arrowOffset],
      8: ["bottom", arrowOffset],
      9: ["top", myHeight/2 - arrowOffset],
      10: ["top", arrowOffset],
      11: ["left", arrowOffset],
      12: ["left", myWidth/2 - arrowOffset]
    };
	
    position = positionMap[myGuider.position];
    myGuiderArrow.css(position[0], position[1] + "px");
  };

  /**
   * One way to show a guider to new users is to direct new users to a URL such as
   * http://www.mysite.com/myapp#guider=welcome
   *
   * This can also be used to run guiders on multiple pages, by redirecting from
   * one page to another, with the guider id in the hash tag.
   *
   * Alternatively, if you use a session variable or flash messages after sign up,
   * you can add selectively add JavaScript to the page: "guiders.show('first');"
   */
  guiders._showIfHashed = function(myGuider) {
    var GUIDER_HASH_TAG = "guider=";
    var hashIndex = window.location.hash.indexOf(GUIDER_HASH_TAG);
    if (hashIndex !== -1) {
      var hashGuiderId = window.location.hash.substr(hashIndex + GUIDER_HASH_TAG.length);
      if (myGuider.id.toLowerCase() === hashGuiderId.toLowerCase()) {
        // Success!
        guiders.show(myGuider.id);
      }
    }
  };

  /**
   * @param where string
   * 
   * @return null
   */
  guiders.goTo = function(where) {
    var currentGuider = guiders._guiders[guiders._currentGuiderID];
    if (typeof currentGuider === "undefined") {
      return null;
    }
	
	if(currentGuider.live === true) {
		return guiders.liveGoTo(where);
	}
    
    var goToGuiderId = currentGuider[where] || null;
    if (goToGuiderId === null || goToGuiderId === "") {
      return null;
    }
	
	if(goToGuiderId.indexOf('url:') === 0) {
      window.location.href = goToGuiderId.substring(4);
	}
	
    var myGuider = guiders._guiderById(goToGuiderId);
    var omitHidingOverlay = myGuider.overlay ? true : false;
    guiders.hideAll(omitHidingOverlay, true);
    if (currentGuider.highlight) {
      guiders._dehighlightElement(currentGuider.highlight);
    }
	
    guiders.show(goToGuiderId);
	
	return null;
  };
  
  /**
   * @param where string
   * @param searchFrom string
   * 
   * @return boolean
   */
  guiders.liveHas = function(where, searchFrom) {
    var currentGuider;
    if(typeof searchFrom === 'undefined') {
		currentGuider = guiders._guiders[guiders._currentGuiderID] || null;
	}
	else {
		currentGuider = guiders._guiders[searchFrom] || null;
	}
	
	if (currentGuider === null) {
      return false;
    }
	
	var goToGuiderId = currentGuider[where] || null;
	
	if (goToGuiderId === null || goToGuiderId === '') {
		return false;
	}
	
	var goToGuider = guiders._guiders[goToGuiderId];
	
	if (typeof goToGuider !== 'object') {
		return false;
	}
	
	if (goToGuider.position === 0) {
		return true;
	}
	
	if (!$(goToGuider.attachTo).is(':visible')) {
		return guiders.liveHas(where, goToGuider.id);
	}
	
	return true;
  };
  
  /**
   * @param where string
   * @param searchFrom *optional* string
   * 
   * @return null
   */
  guiders.liveGoTo = function(where, searchFrom) {
    var currentGuider;
    if(typeof searchFrom === 'undefined') {
		currentGuider = guiders._guiders[guiders._currentGuiderID] || null;
	}
	else {
		currentGuider = guiders._guiders[searchFrom] || null;
	}
	
	if (currentGuider === null) {
      return null;
    }
	
	var goToGuiderId = currentGuider[where] || null;
	
	if (goToGuiderId === null || goToGuiderId === '') {
		return null;
	}
	
	if(goToGuiderId.indexOf('url:') === 0) {
      window.location.href = goToGuiderId.substring(4);
	}
	
	var goToGuider = guiders._guiders[goToGuiderId];
	
	if (typeof goToGuider !== 'object') {
		return null;
	}
	
	if (goToGuider.position !== 0 && !$(goToGuider.attachTo).is(':visible')) {
		return guiders.liveGoTo(where, goToGuider.id);
	}
	
    var omitHidingOverlay = goToGuider.overlay ? true : false;
    guiders.hideAll(omitHidingOverlay, true);
    if (currentGuider.highlight) {
      guiders._dehighlightElement(currentGuider.highlight);
    }
    guiders.show(goToGuiderId);
	
	return null;
  };
  
  guiders.createGuider = function(passedSettings) {
    if (passedSettings === null || passedSettings === undefined) {
      passedSettings = {};
    }
    
    // Extend those settings with passedSettings
    var myGuider = $.extend({}, guiders._defaultSettings, passedSettings);
    myGuider.id = myGuider.id || String(Math.floor(Math.random() * 1000));
    
    var guiderElement = $(guiders._htmlSkeleton);
    myGuider.elem = guiderElement;
    if (typeof myGuider.classString !== "undefined" && myGuider.classString !== null) {
      myGuider.elem.addClass(myGuider.classString);
    }
    myGuider.elem.css("width", myGuider.width + "px");
    
    var guiderTitleContainer = guiderElement.find(".guider_title");
    guiderTitleContainer.html(myGuider.title);
    
    guiderElement.find(".guider_description").html(myGuider.description);
    
    guiders._addButtons(myGuider);
    
    if (myGuider.xButton) {
        guiders._addXButton(myGuider);
    }
    
    guiderElement.hide();
    guiderElement.appendTo("body");
    guiderElement.attr("id", myGuider.id);
    
    // Ensure myGuider.attachTo is a jQuery element.
    if (typeof myGuider.attachTo !== "undefined" && myGuider !== null) {
      guiders._attach(myGuider);
      guiders._styleArrow(myGuider);
    }
    
    guiders._initializeOverlay();
    
    guiders._guiders[myGuider.id] = myGuider;
    guiders._lastCreatedGuiderID = myGuider.id;
    
    /**
     * If the URL of the current window is of the form
     * http://www.myurl.com/mypage.html#guider=id
     * then show this guider.
     */
    if (myGuider.isHashable) {
      guiders._showIfHashed(myGuider);
    }
    
    return guiders;
  }; 
  
  /**
   * A way to quickly build an array of guiders, automatically setting next/prev
   * values (as long as there isn't a corresponding onclick function)
   * @param guiderArray array
   * @param autoNav *optional* boolean Automatically generate nav elements in a
   *                                   static manner (if the DOM is changing then
   *                                   use the live option instead)
   * @param live *optional* boolean Automatically generate nav elements as guiders
   *                                are created
   */
  guiders.createGuiders = function(guiderArray, autoNav, live) {
    if (typeof autoNav === 'undefined') {
      autoNav = true;
    }
    if (typeof live === 'undefined') {
      live = false;
    }

    var guiderLen = guiderArray.length;
    for(var i = 0; i < guiderLen; i++) {
      var myGuider = guiderArray[i];
	  myGuider.live = live;
	  
	  if (autoNav === true || live === true) {
		myGuider = guiders._autoNav(myGuider, 
		                            guiderArray[i + 1], 
					                guiderArray[i - 1],
                                    live);
	  }

      //Create the guider
      guiders.createGuider(myGuider);
	}
  };
  
  /**
   * @param myGuider object
   * @param nextGuider object
   * @param prevGuider object
   * @param skipButtons boolean
   * 
   * @return object
   */
  guiders._autoNav = function(myGuider, nextGuider, prevGuider, skipButtons) {
	  if (typeof skipButtons === 'undefined') {
		  skipButtons = false;
	  }
	  
	  var hasNext = true,
          hasPrev = true;
	  if (typeof nextGuider === 'undefined') {
		  nextGuider = {};
		  hasNext = false;
	  }
	  if (typeof prevGuider === 'undefined') {
		  prevGuider = {};
		  hasPrev = false;
	  }
	  
	  var customNext = typeof myGuider.next !== 'undefined',
		  customPrev = typeof myGuider.prev !== 'undefined';
		  
      var tmp = {
		  guider: myGuider,
		  customNext: customNext,
		  customPrev: customPrev
	  };
	  
	  if(skipButtons !== true) {
	    //Add buttons on
	    tmp = guiders._buildButtons(myGuider, hasNext, hasPrev, customNext, customPrev);
		myGuider = tmp.guider;
	  }
	  
	  //If there are next/previous markers and no custom actions, link the buttons
	  if(hasNext && !tmp.customNext) {
		  myGuider.next = nextGuider.id;
	  }
	  if(hasPrev && !tmp.customPrev) {
		  myGuider.prev = prevGuider.id;
	  }
	  
	  return myGuider;
  };
  
  /**
   * @param myGuider object
   * @param hasNext boolean
   * @param hasPrev boolean
   * @param customNext *optional* boolean
   * @param customPrev *optional* boolean
   * 
   * @return object
   */
  guiders._buildButtons = function(myGuider, hasNext, hasPrev, customNext, customPrev) {	  
	  var hasCloseButton = 
		  hasNextButton = 
		  hasPrevButton = false;
	  
	  if(typeof myGuider.buttons !== 'object' || !myGuider.buttons.length) {
        myGuider.buttons = [];
      }
	  
	  var buttonLen = myGuider.buttons.length;
      for(var j = 0; j < buttonLen; j++) {
        var name = myGuider.buttons[j].name.toLowerCase(),
		    customOnClick = typeof myGuider.buttons[j].onclick === 'function',
			isClose = false,
			isNext = false,
			isPrev = false;

		//Check and see if this guider already has next/prev/close buttons
        if(name === guiders._closeButtonTitle.toLowerCase()) {
          hasCloseButton = isClose = true;
		}
		else if(name === guiders._nextButtonTitle.toLowerCase()) {
          hasNextButton = isNext = true;
		  customNext = customNext || customOnClick;
		}
		else if(name === guiders._prevButtonTitle.toLowerCase()) {
          hasPrevButton = isPrev = true;
		  customPrev = customPrev || customOnClick;
		}

        //In case there aren't actually next/prev guiders, remove the buttons
        if(isNext && !customNext && !hasNext) {
            myGuider.buttons.splice(j, 1);j--;buttonLen--; //Remove elem and reset incrementors
        }
        else if(isPrev && !customPrev && !hasPrev) {
            myGuider.buttons.splice(j, 1);j--;buttonLen--; //Remove elem and reset incrementors
        }
		else if(isClose && hasNext) {
			myGuider.buttons.splice(j, 1);j--;buttonLen--; //Remove elem and reset incrementors
		}
      }
	  
      //If there are missing nav buttons, add them
      if(hasPrevButton === false && hasPrev === true) {
		  myGuider.buttons.push({name: guiders._prevButtonTitle});
	  }
      if(hasNextButton === false && hasNext === true) {
		  myGuider.buttons.push({name: guiders._nextButtonTitle});
	  }
      if(hasCloseButton === false && hasNext === false) {
        myGuider.buttons.push({name: guiders._closeButtonTitle});
      }
	  
	  var tmp = {
		  guider: myGuider,
		  customNext: customNext,
		  customPrev: customPrev
	  };
	  
	  return tmp;
  };

  guiders.hideAll = function(omitHidingOverlay, next) {
	if(typeof next === 'undefined') {
		next = false;
	}
	$(".guider:visible").each(function(index, elem){
		var myGuider = guiders._guiderById($(elem).attr('id'));
		if (myGuider.onHide) {
		  myGuider.onHide(myGuider, next);
		}
	});
    $(".guider").fadeOut("fast");
    if (typeof omitHidingOverlay !== "undefined" && omitHidingOverlay === true) {
      // do nothing for now
    } else {
      guiders._hideOverlay();
    }
    return guiders;
  };

  guiders.show = function(id) {
    if (!id && guiders._lastCreatedGuiderID) {
      id = guiders._lastCreatedGuiderID;
    }
  
    var myGuider = guiders._guiderById(id);
    if (myGuider.overlay) {
      guiders._showOverlay();
      // if guider is attached to an element, make sure it's visible
      if (myGuider.highlight) {
        guiders._highlightElement(myGuider.highlight);
      }
    }
  
    // You can use an onShow function to take some action before the guider is shown.
    if (myGuider.onShow) {
      myGuider.onShow(myGuider);
    }
	
	guiders._currentGuiderID = id;
	
	if (myGuider.live === true) {
		var tmp = guiders._buildButtons(myGuider, guiders.liveHas('next'), guiders.liveHas('prev'));
		myGuider = tmp.guider;
		guiders._addButtons(myGuider);
	}
  
    guiders._attach(myGuider);
  
    myGuider.elem.fadeIn("fast");
  
    var windowHeight = $(window).height();
    var scrollHeight = $(window).scrollTop();
    var guiderOffset = myGuider.elem.offset();
    var guiderElemHeight = myGuider.elem.height();
  
    if (guiderOffset.top - scrollHeight < 0 ||
        guiderOffset.top + guiderElemHeight + 40 > scrollHeight + windowHeight) {
      window.scrollTo(0, Math.max(guiderOffset.top + (guiderElemHeight / 2) - (windowHeight / 2), 0));
    }
	
    return guiders;
  };
  
  return guiders;
}).call(this, jQuery);
