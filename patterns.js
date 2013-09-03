$(function() {
    var main = function () {
        var canvas, context, canvaso, contexto;
        var tool;
        var tool_default = 'line';
        var line1dots = [];
        var line2dots = [];
        var img = document.getElementById("chart");
        var horizontalSlopeMax = 0.1;
        var channelMax = 10;
        var wedgeMax = 140;
        var a, b, c, d, atanA, atanB, foundAngle;

        function getAngle(line1dots, line2dots){ //calculates angle of lines crossing
            a = line1dots[2] - line1dots[0];
            b = line1dots[3] - line1dots[1];
            c = line2dots[2] - line2dots[0];
            d = line2dots[3] - line2dots[1];

            atanA = Math.atan2(a, b);
            atanB = Math.atan2(c, d);

            foundAngle = Math.round(Math.abs((atanA - atanB)*180/Math.PI));
            if(foundAngle > 180){
                return 360 - foundAngle;
            }
            return foundAngle;
        }

        function getSlope(dots){
            if(dots[2] === dots[0]){
                return Number.MAX_VALUE;
            }
            return (dots[3] - dots[1])/(dots[2] - dots[0]);
        }
        function calcLines(line1dots, line2dots){ // figures out which line is upper and which is lower
            var allCoordinates = line1dots.concat(line2dots);
            var topY = -1 * Number.MAX_VALUE;
            for (var i=1; i<allCoordinates.length; i+=2){
                if(topY < allCoordinates[i]){
                    topY = allCoordinates[i]; //found highest point
                }
            }
            var line1slope = getSlope(line1dots);
            var line2slope = getSlope(line2dots);
            var line1data = {
                "data": line1dots,
                "slope": line1slope,
                "isHorizontal": Math.abs(line1slope) < horizontalSlopeMax
            };
            var line2data = {
                "data": line2dots,
                "slope": line2slope,
                "isHorizontal": Math.abs(line2slope) < horizontalSlopeMax
            };
            if(line1dots.indexOf(topY) > -1){
                return {
                    "top": line1data,
                    "bottom": line2data
                }
            } else {
                return {
                    "top": line2data,
                    "bottom": line1data
                };
            }
        }
        
        function detectedPattern(patternAngle){
            if(patternAngle < channelMax){
                if(lineData.top.slope < 0
                    && lineData.bottom.slope < 0
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "bullFlagCH";
                }
                else if(lineData.top.slope > 0
                    && lineData.bottom.slope > 0
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "bearFlagCH";
                }
                else {
                    return "channel";
                }
            } else if(patternAngle > channelMax && patternAngle < wedgeMax){
                if(lineData.top.slope < 0
                    && lineData.bottom.slope > 0
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "triangle";
                } else if(lineData.top.slope < 0
                    && lineData.bottom.slope < 0
                    && lineData.top.slope < lineData.bottom.slope
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "fallingWedge";
                } else if(lineData.top.slope > 0
                    && lineData.bottom.slope > 0
                    && lineData.top.slope < lineData.bottom.slope
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "risingWedge";
                } else if(lineData.top.slope < 0
                    && lineData.bottom.isHorizontal ){
                    return "desTriangle";
                } else if(lineData.bottom.slope > 0
                    && lineData.top.isHorizontal ){
                    return "ascTriangle";
                } else if(lineData.top.slope > 0
                    && lineData.bottom.slope < 0
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "megaphone";
                } else if(lineData.top.slope > 0
                    && lineData.bottom.slope > 0
                    && lineData.top.slope > lineData.bottom.slope
                    && !lineData.bottom.isHorizontal
                    && !lineData.top.isHorizontal ){
                    return "ascWedge";
                } else if(lineData.top.slope < 0
                    && lineData.bottom.slope < 0
                    && lineData.top.slope > lineData.bottom.slope
                    && !lineData.top.isHorizontal
                    && !lineData.bottom.isHorizontal ){
                    return "desWedge";
                } else if(lineData.top.slope > 0
                    && lineData.bottom.isHorizontal ){
                    return "ascRightAngle";
                } else if(lineData.bottom.slope < 0
                    && lineData.top.isHorizontal ){
                    return "desRightAngle";
                } else {
                    return "notFound";
                }
            } else {
                return "notFound";
            }
        }
        
        function getLineIntersection(line1dots,line2dots) {
            var s1_x, s1_y, s2_x, s2_y;
            p0_x = line1dots[0]; p0_y = line1dots[1];
            p1_x = line1dots[2]; p1_y = line1dots[3];
            p2_x = line2dots[0]; p2_y = line2dots[1];
            p3_x = line2dots[2]; p3_y = line2dots[3];
            s1_x = p1_x - p0_x;
            s1_y = p1_y - p0_y;
            s2_x = p3_x - p2_x;
            s2_y = p3_y - p2_y;
            var s, t;
            s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
            t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                // Collision detected
                var intX = p0_x + (t * s1_x);
                var intY = p0_y + (t * s1_y);
                //return [intX, intY];
                return true;
            }
            return false; // No collision
        }
        
        function init () {
            canvaso = document.getElementById('imageView');
            contexto = canvaso.getContext('2d');
            contexto.drawImage(img,0,0);
            var container = canvaso.parentNode;
            canvas = document.createElement('canvas');
            canvas.id     = 'imageTemp';
            canvas.width  = canvaso.width;
            canvas.height = canvaso.height;
            container.appendChild(canvas);
            context = canvas.getContext('2d');
            tool = new tools[tool_default]();

            // Attach the mousedown, mousemove and mouseup event listeners.
            canvas.addEventListener('mousedown', ev_canvas, false);
            canvas.addEventListener('mousemove', ev_canvas, false);
            canvas.addEventListener('mouseup',   ev_canvas, false);
        }

        // The general-purpose event handler. This function just determines the mouse
        // position relative to the canvas element.
        function ev_canvas (ev) {
            if (ev.layerX || ev.layerX == 0) { // Firefox
                ev._x = ev.layerX;
                ev._y = ev.layerY;
            } else if (ev.offsetX || ev.offsetX == 0) { // Opera
                ev._x = ev.offsetX;
                ev._y = ev.offsetY;
            }

            // Call the event handler of the tool.
            var func = tool[ev.type];
            if (func) {
                func(ev);
            }
        }

        function img_update () {
            contexto.drawImage(canvas, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        function clear () {
            contexto.drawImage(img, 0, 0);
            context.clearRect(0, 0, img.width, img.height);
            $('.description').hide();
            line1dots = [];
            line2dots = [];
        }
        
        var tools = {};
        
        tools.line = function () {
            var tool = this;
            this.started = false;

            this.mousedown = function (ev) {
                ev.preventDefault();
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
                if(line1dots.length > 0 && line2dots.length > 0){
                    clear();
                }
            };

            this.mousemove = function (ev) {
                if (!tool.started) {
                    return;
                }
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.moveTo(tool.x0, tool.y0);
                context.lineTo(ev._x, ev._y);
                context.stroke();
                context.strokeStyle = '#ff0000';
                context.closePath();
            };

            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                    var patternAngle = 0;
                    var upperLine = [];
                    var lowerLine = [];
                    if (tool.x0 !== ev._x || tool.y0 !== ev._y) {
                        if(line1dots.length == 0 && line2dots.length == 0){
                            line1dots = [tool.x0, -tool.y0, ev._x, -ev._y]; // line coordinates
                        } else if(line1dots.length > 0 && line2dots.length == 0){
                            line2dots = [tool.x0, -tool.y0, ev._x, -ev._y];
                            patternAngle = getAngle(line1dots, line2dots);
                            lineData = calcLines(line1dots, line2dots);
                            if(getLineIntersection(line1dots, line2dots)){
                                alert("Please make sure the lines don't cross");
                                clear();
                            } else {                            
                                $('.description').hide();
                                $('#' + detectedPattern(patternAngle)).show(500);   
                            }
                        }
                    }
                    img_update();
                }
            };
        };       
    
        $('#chartSelect').change( function(){
            var chosenVal = $(this).val();
            if(chosenVal === 'yen'){
                img.src='charts/yen.png';                
            } else if(chosenVal === 'nkd'){
                img.src='charts/nk.png';
            } else if(chosenVal === 'spm'){
                img.src='charts/spm.png';
            } else if(chosenVal === 'spy'){
                img.src='charts/spy.png';
            }
        });
            
        $(img).load(function(){
            clear();
        });
        
        init();
    };
    
    if(window.addEventListener) {
        window.addEventListener('load', main, false);
    }
});

