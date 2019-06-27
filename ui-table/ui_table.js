
module.exports = function(RED) {

    var ui = undefined;
    function TableNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                // load Dashboard API
                ui = RED.require("node-red-dashboard")(RED);
            }

            RED.nodes.createNode(this, config);
            var node = this;
            var done = null;

            var confsel = config.confsel;
            var item = config.item;

            var label = config.label;
            if  (label == undefined) {
                label = "";
            }

            var data;               // 出力データ
            var dataAry = [];
            var format = "<p align='center' style='font-size:16px;'>" + label + "</p>"
                +"<table id='table' border='1' cellspacing='0'>"
                + "<tr>"
                + "<th  ng-repeat = 'item in msg.series' style='font-size:14px; padding:3px'>{{item}}</th>"
                + "</tr>" + "<tbody>" 
                + "<tr ng-repeat = 'row in msg.payload'>"
                + "<td ng-repeat = 'item in row' style='font-size:14px; padding:3px'>{{item}}</td>"
                + "</tr> </tbody> </table>";



            var group = RED.nodes.getNode(config.group);
            if (!group && config.templateScope !== 'global') { return; }
            var tab = null;
            if (config.templateScope !== 'global') {
                tab = RED.nodes.getNode(group.config.tab);
                if (!tab) { return; }
            }

            // サイズ調整
            if (config.width === "0") { delete config.width; }
            if (config.height === "0") { delete config.height; }
            // number of pixels wide the chart will be... 43 = sizes.sx - sizes.px
            var pixelsWide = ((config.width || group.config.width || 6) - 1) * 43 - 15;

            var previousTemplate = null
            
            /*
            var theme = ui.getTheme();
            var colortheme = {};
            for (var i in theme) {
                if (theme.hasOwnProperty(i)) {
                    colortheme[i.replace(/-/g, "_")] = theme[i].value;
                }
            }
            */
    
    
            node.on('input', function(msg) {
    
                if (confsel == "inchartSet") {
                    // json2inchartからの出力を使用する
    
                    try {
                        
                        dataAry = [];

                        msg.series = msg.payload[0].series;
                        data = msg.payload[0].data;
                        
                        msg.series.unshift("timeStamp");
        
                        // 出力用データ作成
                        var temp = [];
                        for (var i=0;i<data[0].length;i++) {
                            temp.push(data[0][i].x, data[0][i].y);
                            for (var j=1;j<data.length;j++){
                                temp.push(data[j][i].y);
                            }
                            dataAry.push(temp);
                            temp = [];
                        }

                    } catch (e) {
                        node.error("table：表示対象データがありません。");
                    }

                    msg.payload = dataAry;
                    
                } else {
                    // 項目取得、配列に変換
                    msg.series = item.split(",");
        
                }
            });




            // create new widget
            done = ui.addWidget({
                node: node,
                format: format,
                templateScope: "local",
                group: config.group,
                width: parseInt(config.width || group.config.width || 6),
                height: parseInt(config.height || group.config.width/3+1 || 2),
                // group: group,
                emitOnlyNewValues: false,
                forwardInputMessages: config.fwdInMessages,
                storeFrontEndInputAsState: config.storeOutMessages,
                beforeEmit: function(msg, value) {
                    var properties = Object.getOwnPropertyNames(msg).filter(function (p) { return p[0] != '_'; });
                    var clonedMsg = {
                        templateScope: config.templateScope
                    };
                    for (var i=0; i<properties.length; i++) {
                        var property = properties[i];
                        clonedMsg[property] = msg[property];
                    }
    
                    // transform to string if msg.template is buffer
                    if (clonedMsg.template !== undefined && Buffer.isBuffer(clonedMsg.template)) {
                        clonedMsg.template = clonedMsg.template.toString();
                    }
    
                    if (clonedMsg.template === undefined && previousTemplate !== null) {
                        clonedMsg.template = previousTemplate;
                    }
    
                    if (clonedMsg.template) {
                        previousTemplate = clonedMsg.template
                    }
    
                    return { msg:clonedMsg };
                },
                beforeSend: function (msg, original) {
                    if (original) { return original.msg; }
                }
            });
        }
        catch (e) {
            console.log(e);
        }
        
        node.on("close", done);
    }
    RED.nodes.registerType('ui_table', TableNode);
};