module.exports = function(RED) {
    function checkConfig(node, conf) {
        if(!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("lamps.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        var configAsJson = JSON.stringify(config);
        var html = String.raw`
        <div id="{{conf.nodeid}}" ng-init='init(` + configAsJson + `)' hidden></div>
        <canvas width="90" height="120" style={{conf.cvs_padding}} ng-repeat="item in conf.ds"></canvas>
        `;
        return html;
    }

    var ui = undefined;

    function LampsNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            var width, height;
            var conf_ds = config.params;
            if(config.direction == "Vertical") {
                width = 2;
                height = conf_ds.length * 2;
            }else if(config.direction == "Horizontal") {
                width = conf_ds.length * 2;
                height = 2;
            }

            console.log(config.confsel);

            RED.nodes.createNode(this, config);
            var done = null;
            if(checkConfig(node, config)){
                var html = HTML(config);
                done = ui.addWidget({
                    node: node,
                    format: html,
                    group: config.group,
                    width: Number(config.width) || width,
                    height: Number(config.height) || height,
                    order: config.order,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    //convert: function(){},
                    beforeEmit: function(msg, value) {
                        node.status({fill:"green", shape:"dot", text:"runtime.complete"});
                        return { msg: { payload: value } };
                    },
                    convertBack: function(value){ return value; },
                    // needs beforeSend to message contents to be sent back to runtime
                    beforeSend: function (msg, orig) {
                        if (orig) { return orig.msg; }
                    },
                    initController: function ($scope, events) {
                        function Lamp(canvas, phase, color, name) {
                            this.ctx = canvas.getContext('2d');
                            this.phase = phase;
                            this.name = name;
                            this.frame_color = "rgb(50, 50, 50)";
                            this.onoff_color = this.getOnOffColor(color);
                            this.createFrame();
                            this.off();
                            this.createName();
                        }
                        Lamp.prototype.getOnOffColor = function(color){
                            var onoff_color = {};
                            if(color == 'Red'){
                                onoff_color.on = "rgb(255, 30, 30)";
                                onoff_color.off = "rgb(130, 0, 0)";
                            }else if(color == 'Green'){
                                onoff_color.on = "rgb(10, 255, 10)";
                                onoff_color.off = "rgb(0, 100, 0)";
                            }else if(color == 'Blue'){
                                onoff_color.on = "rgb(70, 70, 255)";
                                onoff_color.off = "rgb(0, 0, 130)";
                            }else if(color == 'Yellow'){
                                onoff_color.on = "rgb(255, 255, 30)";
                                onoff_color.off = "rgb(130, 130, 0)";
                            }else if(color == 'Orange'){
                                onoff_color.on = "rgb(255, 170, 30)";
                                onoff_color.off = "rgb(170, 85, 0)";
                            }else if(color == 'Purple'){
                                onoff_color.on = "rgb(255, 30, 255)";
                                onoff_color.off = "rgb(130, 0, 130)";
                            }else if(color == 'White'){
                                onoff_color.on = "rgb(255, 255, 255)";
                                onoff_color.off = "rgb(80, 80, 80)";
                            }
                            return onoff_color;
                        };
                        Lamp.prototype.createFrame = function(){
                            this.ctx.fillStyle = this.frame_color;
                            if(this.phase == 'Square'){
                                this.ctx.fillRect(10, 10, 80, 80);
                            }else if(this.phase == 'Circle'){
                                this.ctx.beginPath();
                                this.ctx.arc(50, 50, 40, 0, Math.PI*2, false);
                                this.ctx.fill();
                            }
                        };
                        Lamp.prototype.createInner = function(){
                            if(this.phase == 'Square'){
                                this.ctx.fillRect(20, 20, 60, 60);
                            }else if(this.phase == 'Circle'){
                                this.ctx.beginPath();
                                this.ctx.arc(50, 50, 30, 0, Math.PI*2, false);
                                this.ctx.fill();
                            }
                        };
                        Lamp.prototype.on = function(){
                            this.ctx.fillStyle = this.onoff_color.on;
                            this.createInner();
                        };
                        Lamp.prototype.off = function(){
                            this.ctx.fillStyle = this.onoff_color.off;
                            this.createInner();
                        };
                        Lamp.prototype.createName = function() {
                            this.ctx.font = "15px bold";
                            this.ctx.fillStyle = "rgb(0, 0, 0)";
                            this.ctx.textAlign = "center";
                            this.ctx.fillText(this.name, (90/2)+5, 110, 90);
                        };
                        Lamp.prototype.setName = function(name) {
                            this.name = name;
                        };

                        var lamps = [];
                        var confsel;
                        var truelist = [];

                        $scope.init = function(config){
                            var conf = {};
                            confsel = config.confsel;
                            truelist = config.truelist.split(",");
                            conf.nodeid = "lamps_" + config.id.replace('.', '_');
                            conf.ds = config.params;
                            if(config.direction == "Vertical") {
                                conf.direction = "column";
                                conf.cvs_padding = 'padding: 3px 0px;';
                            }else if(config.direction == "Horizontal") {
                                conf.direction = "row";
                                conf.cvs_padding = 'padding: 0px 3px;';
                            }

                            $scope.conf = conf;
                            $(function() {
                                var this_node = document.getElementById(conf.nodeid);
                                $(this_node).parent('md-card').css('padding', '1px');
                                $(this_node).parent('md-card').css('flex-direction', conf.direction);
                                var canvases = $(this_node).siblings('canvas');
                                var phases = Object.values(conf.ds).map(function (item) {return item.phase;});
                                var colors = Object.values(conf.ds).map(function (item) {return item.color;});
                                var names = Object.values(conf.ds).map(function (item) {return item.name;});
                                for(var idx=0; idx<canvases.length; idx++){
                                    lamps[idx] = new Lamp(canvases[idx], phases[idx], colors[idx], names[idx]);
                                }
                            });
                        }
                        $scope.$watch('msg', function(msg) {
                            if(!msg){ return; }
                            $(function() {
                               if (confsel == "inlatestSet"|| confsel == "formatSet"){
                                    var value = msg.payload;
                                    for(idx in value){
                                        console.log(value[idx]);
                                        if((value[idx] == false && value[idx] != "") || value[idx] == "false" || value[idx] == "0"){
                                            lamps[idx].off();
                                        }else if(value[idx] == true || value[idx] == "true" || value[idx] == "1"){
                                            lamps[idx].on();
                                        }
                                    }
                                } else {
                                    var data = msg.payload;
                                    var nameList = data[0].series;
                                    var valueList = data[0].data;
                                    for(idx in valueList){
                                        console.log(valueList[idx][0].y);
                                        if((valueList[idx][0].y == false && valueList[idx][0].y != "") || valueList[idx][0].y == "false" || valueList[idx][0].y == "0"){
                                            lamps[idx].off();
                                        }else if(valueList[idx][0].y == true || valueList[idx][0].y == "true" || valueList[idx][0].y == "1" || truelist.indexOf(valueList[idx][0].y) > -1){
                                            lamps[idx].on();
                                        }
                                        if (lamps[idx].name == "") {
                                            lamps[idx].setName(nameList[idx]);
                                            lamps[idx].createName();
                                        }
                                    }
                                }
                            });
                        });
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
        }
        node.on("close", done);
    }
    RED.nodes.registerType('ui_lamps', LampsNode);
};
