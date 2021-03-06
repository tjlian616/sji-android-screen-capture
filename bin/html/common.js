var AscUtil = {};


(function () {
  'use strict';
  AscUtil.setTouchHandler = function (liveView, touchServerUrl) {
    var $liveView = $(liveView);
    if (!touchServerUrl) {
      console.info('clearTouchHandler');
      $liveView.unbind('mousedown').unbind('mouseup').unbind('mousemove').unbind('mouseout');
      return;
    }
    var logHead = '[dev ' + decodeURIComponent((touchServerUrl.match(/[?&]device=([^&]+)/) || '  ')[1]) + '] ';
    var evtAry = [];
    var isFirefox = (navigator.userAgent.match(/Firefox/i) !== null);

    $liveView
        .on('mousedown', function (e) {
          saveOrSendMouseAction(e);
          $liveView.mousemove(function (e) {
            saveOrSendMouseAction(e);
          }).mouseout(function (e) {
                saveOrSendMouseAction(e);
                $liveView.unbind('mousemove').unbind('mouseout');
              });
        })
        .on('mouseup', function (e) {
          saveOrSendMouseAction(e);
          $liveView.unbind('mousemove').unbind('mouseout');
        })
        .on('dragstart', function () {
          return false; //disable drag
        })
        .unbind('mousemove')
        .unbind('mouseout');

    console.info(logHead + 'setTouchHandler OK');

    function saveOrSendMouseAction(e) {
      if (e.offsetX === undefined) {
        e.offsetX = e.clientX - $liveView.offset().left;
      }
      if (e.offsetY === undefined) {
        e.offsetY = e.clientY - $liveView.offset().top;
      }
      var vw = $liveView.outerWidth();
      var vh = $liveView.outerHeight();
      if (isFirefox) {
        if ($liveView.css('transform').indexOf('matrix') < 0) {
          if (vw < vh) {
            e.xPer = Math.min(1, Math.max(0, e.offsetX / vw));
            e.yPer = Math.min(1, Math.max(0, e.offsetY / vh));
          } else {
            e.xPer = Math.min(1, Math.max(0, (vh - e.offsetY) / vh));
            e.yPer = Math.min(1, Math.max(0, e.offsetX / vw));
          }
        } else {
          if (vw < vh) {
            e.xPer = Math.min(1, Math.max(0, (vw - e.offsetY) / vw));
            e.yPer = Math.min(1, Math.max(0, e.offsetX / vh));
          } else {
            e.xPer = Math.min(1, Math.max(0, (vh - e.offsetX) / vh));
            e.yPer = Math.min(1, Math.max(0, (vw - e.offsetY) / vw));
          }
        }
      } else {
        if (vw < vh) {
          e.xPer = Math.min(1, Math.max(0, e.offsetX / vw));
          e.yPer = Math.min(1, Math.max(0, e.offsetY / vh));
        } else {
          e.xPer = Math.min(1, Math.max(0, (vh - e.offsetY) / vh));
          e.yPer = Math.min(1, Math.max(0, e.offsetX / vw));
        }
      }
      if (evtAry.length) {
        evtAry.push(e);
      } else {
        sendMouseAction(e);
      }
    }

    function sendMouseAction(e) {
      var type = e.type.slice(5, 6)/*d:down, u:up: o:out, m:move*/;
      console.log(logHead + '[send touch event] ' + type + ' ' + e.xPer + ' ' + e.yPer);
      $.ajax(touchServerUrl + '&type=' + type + '&x=' + e.xPer + '&y=' + e.yPer,
          {timeout: 2000})
          .done(function () {
            if ((e = evtAry.shift())) {
              if (e.type === 'mousemove') {
                //get latest mousemove
                var _e = e;
                do {
                  if (_e.type === 'mousemove') {
                    e = _e;
                  } else {
                    break;
                  }
                }
                while ((_e = evtAry.shift()));
              }
              sendMouseAction(e);
            }
          })
          .fail(function (jqXHR, textStatus) {
            console.error(logHead + '[send touch event] error: ' + textStatus + ', HTTP status code: ' + jqXHR.status);
            evtAry = [];
          })
    }
  };

  AscUtil.rotateChildLocally = function (targetContainer) {
    var $c = $(targetContainer), $v = $c.children(0);
    if ($v.css('transform').indexOf('matrix') < 0) {
      var w = $c.outerWidth(), h = $c.outerHeight();
      $c.css({width: h, height: w, 'text-align': 'left', 'vertical-align': 'top', 'overflow': 'hidden'});
      $v.css({'max-width': w, 'max-height': h, width: w, height: h, 'transform-origin': '0 0', transform: 'rotate(270deg) translate(-100%,0)'});
    } else {
      $v.css({'max-width': '', 'max-height': '', width: '', height: '', 'transform-origin': '', transform: ''});
      $c.css({width: '', height: '', 'text-align': '', 'vertical-align': '', 'overflow': ''});
    }
  };

  AscUtil.scaleLocally = function (target) {
    var $v = $(target);
    if ($v.css('transform').indexOf('matrix') < 0) {
      $v.css({'transform': 'scale(0.5, 0.5) translate(0, -50%)'});
    } else {
      $v.css({'transform': ''});
    }
  };
})();