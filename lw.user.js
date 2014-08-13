// ==UserScript==
// @name           LW Comment Highlight
// @namespace      http://www.github.com/bakkot
// @description    Allows you to choose the time after which comments on a thread on Less Wrong are highlighted 
// @match          http://lesswrong.com/lw/*
// @match          http://lesswrong.com/r/*/lw/*
// @version        1.0
// ==/UserScript==


/**************************************************
Tested only on recent versions of Firefox and Chrome.

Installation
------------

Save this file as something.user.js. Then:

Firefox users: Install Greasemonkey and open the saved file in Firefox.

Chrome users: Go to chrome://extensions and drag the saved file onto the main body of the window.



Feedback
--------

bakkot on github or LessWrong
**************************************************/




// Global variables are fun!
var lastGivenDate, commentCountText, commentsScroller;


// *** Inject some css used by the floating list

var styleEle = document.createElement('style');
styleEle.type = 'text/css';
styleEle.innerHTML = '.comments-floater { position: fixed; right: 4px; top: 4px; padding: 2px 5px; width: 230px; border: 1px solid #bbbcbf; font-size: small; background: rgba(247, 247, 248, 0.90); }' +
'.comments-scroller { word-wrap: break-word; max-height: 500px; overflow-y:scroll; }' +
'.comments-date { font-size: 11px; }' +
'.comments-list { margin-left: 23px; }' +
'.semantic-cell { display: table-cell; }' +
'.cct-span { white-space: nowrap; }' +
'.date-input { width: 100%; box-sizing: border-box; }' +
'.input-span { width: 100%; padding-left: 5px; }' +
'.hider { position: absolute; left: -19px; top: 6px;}';
document.head.appendChild(styleEle);



// *** Create and insert the floating list of comments, and its contents


// The floating box.
var floatBox = document.createElement('div');
floatBox.className = 'comments-floater';


// Container for the text node below.
var cctSpan = document.createElement('span');
cctSpan.className = 'semantic-cell cct-span';

// The text node which says 'x comments since'
var commentCountText = document.createTextNode('');


// Container for the text box below.
var inputSpan = document.createElement('span');
inputSpan.className = 'semantic-cell input-span';

// The text box with the date.
var dateInput = document.createElement('input');
dateInput.className = 'date-input';
dateInput.addEventListener('blur', function(){
  var newDate = Date.parse(dateInput.value);
  if (isNaN(newDate)) {
    alert('Given date not valid.');
    dateInput.value = (new Date(lastGivenDate)).toLocaleString();
    return;
  }
  border(newDate, false);
}, false);
dateInput.addEventListener('keypress', function(e){
  if (e.keyCode === 13) {
  	dateInput.blur();
  }
}, false);


// Container for the comments list and the '[-]'
var divDiv = document.createElement('div');
divDiv.style.display = 'none';

// The '[-]'
var hider = document.createElement('span');
hider.innerHTML = '[-]';
hider.className = 'hider';
hider.addEventListener('click', function(){
  if (commentsScroller.style.display != 'none') {
    commentsScroller.style.display = 'none';
  }
  else {
    commentsScroller.style.display = '';
  }
}, false);

// Scrollable container for the comments list 
var commentsScroller = document.createElement('div');
commentsScroller.className = 'comments-scroller';
commentsScroller.style.display = 'none';

// Actual list of comments
var commentsList = document.createElement('ul');
commentsList.className = 'comments-list';



// Insert all the things we made into each other and ultimately the document.

cctSpan.appendChild(commentCountText);
floatBox.appendChild(cctSpan);

inputSpan.appendChild(dateInput);
floatBox.appendChild(inputSpan);

divDiv.appendChild(hider);
commentsScroller.appendChild(commentsList);
divDiv.appendChild(commentsScroller);
floatBox.appendChild(divDiv);

document.body.appendChild(floatBox);




// *** Extract post time from a comment element

function getTime(ele) {
  return parseInt(ele.childNodes[3].querySelector('.comment-date').getAttribute('time'))*1000; // seconds->ms
}


// *** Find the latest comment without a highlight

function findLastUnreadTime() {
  var mostRecent = 0;
  var commentList = document.querySelectorAll('div.comment:not(.new-comment)');
  for(var i = 0; i < commentList.length; ++i) {
    var time = getTime(commentList[i]);
    if(time > mostRecent) { // handily also deals with NaN case
      mostRecent = time;
    }
  }
  return mostRecent;
}


// *** Set up borders and populate comments list

function border(since, updateTitle) {
  lastGivenDate = since;
  var commentList = document.querySelectorAll('div.comment');
  var newComments = [];
  
  // Walk comments, setting borders as appropriate and saving new comments in a list
  for(var i = 0; i < commentList.length; ++i) {
    var postTime = getTime(commentList[i]);
    if(isNaN(postTime)) console.log("what", commentList[i]);
    if (postTime > since) {
      commentList[i].classList.add('new-comment');
      newComments.push({time: postTime, ele: commentList[i]});
    }
    else {
      commentList[i].classList.remove('new-comment');
    }
  }
  var newCount = newComments.length;
  
  // Maybe add new comment count to title
  if (updateTitle) {
    document.title = '(' + newCount + ') ' + document.title;
  }
  
  // Populate the floating comment list
  commentCountText.data = '' + newCount + ' comment' + (newCount == 1 ? '' : 's') + ' since ';
  commentsList.innerHTML = '';
  if (newCount > 0 ) {
    divDiv.style.display = 'block';
    newComments.sort(function(a, b){return a.time - b.time;});
    for(i = 0; i < newCount; ++i) {
      var ele = newComments[i].ele;
      var newLi = document.createElement('li');
      newLi.innerHTML = ele.querySelector('.author').textContent.replace(/\n/g, '') + ' <span class="comments-date">' + (new Date(newComments[i].time)).toLocaleString() + '</span>';
      newLi.addEventListener('click', function(ele){return function(){ele.scrollIntoView(true);};}(ele));
      commentsList.appendChild(newLi);
    }
  }
  else {
    divDiv.style.display = 'none';
  }
}




// *** Set up the comments list and the title

var mostRecentUnread = findLastUnreadTime();
dateInput.value = (new Date(mostRecentUnread)).toLocaleString();
border(mostRecentUnread, true); // for list population and title setting 

