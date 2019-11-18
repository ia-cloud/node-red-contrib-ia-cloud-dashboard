
module.exports = function(RED) {

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_table.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        var html = "<p align='center' style='font-size:16px;'>" + config.label + "</p>"
                +"<table id='table' border='1' cellspacing='0'>"
                + "<tr>"
                + "<th  ng-repeat = 'item in msg.series' style='font-size:14px; padding:3px'>{{item}}</th>"
                + "</tr>" + "<tbody>" 
                + "<tr ng-repeat = 'row in msg.payload'>"
                + "<td ng-repeat = 'item in row' style='font-size:14px; padding:3px'>{{item}}</td>"
                + "</tr> </tbody> </table>";
        return html;
    };

    var ui = undefined;
    function TableNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                // load Dashboard API
                ui = RED.require("node-red-dashboard")(RED);
            }

            RED.nodes.createNode(this, config);
            var done = null;

            this.confsel = config.confsel;
            this.contype1 = config.contype1;
            this.contype2 = config.contype2;
            var item = config.item;

            var label = config.label;
            if  (label == undefined) {
                label = "";
            }

            try {
                var statusList = config.statuslist.split(",");
            } catch (e) {
                var statusList = [];
            }

            var data;               // 出力データ
            var dataAry = [];
            
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
            
            var previousTemplate = null;

            if (checkConfig(node, config)) {
                var html = HTML(config);
                done = ui.addWidget({
                    node: node,
                    format: html,
                    group: config.group,
                    width: parseInt(config.width || group.config.width || 6),
                    height: parseInt(config.height || group.config.width/3+1 || 2),
                    order: config.order,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: config.fwdInMessages,
                    storeFrontEndInputAsState: config.storeOutMessages,
                    beforeEmit: function(msg, value) {

                        // 入力値によって分岐
                        switch (node.confsel) {
                            case "dynamodbSet":
                                // contentTypeを基にデータ作成
                                switch(node.contype1) {
                                    case "Alarm&Event":
                                            msg.series = ["timeStamp", "No", "エラー詳細", "ステータス"];
                                            itemList = msg.payload.Items;

                                            dataAry = [];       // 出力用データ一時保存用
                                            var temp = [];          // 出力用データ保存用
                                            var contentList;        // 取得データ一時保存

                                            if (itemList != undefined) {
                                            
                                                for(i=0;i < itemList.length; i++) {  //データ件数でループ
                                                    try {
                                                        if (itemList[i].dataObject.objectContent != undefined) {
                                                            contentList = itemList[i].dataobject.objectContent.contentData;
                                                        } else if (itemList[i].dataObject.ObjectContent != undefined) {
                                                            contentList = itemList[i].dataObject.ObjectContent.contentData;
                                                        } else {
                                                            node.error("ui_table：ia-cloudオブジェクトではありません。");
                                                            continue;
                                                        }
                                                    } catch (e) { 
                                                        node.error("ui_table：ia-cloudオブジェクトではありません。");
                                                        continue;
                                                    }

                                                    if (contentList.length > 0){
                                                        var conIdx;
                                                        for (conIdx=0; conIdx<contentList.length; conIdx++) {
                                                            if (contentList[conIdx].commonName === "Alarm&Event" && contentList[conIdx].dataValue != undefined) {
                                                                if (statusList.indexOf(contentList[conIdx].dataValue.AnEStatus) != -1) {
                                                                    // 情報をdataAryに格納
                                                                    temp.push(itemList[i].timestamp);
                                                                    temp.push(contentList[conIdx].dataValue.AnECode);
                                                                    temp.push(contentList[conIdx].dataValue.AnEDescription);
                                                                    temp.push(contentList[conIdx].dataValue.AnEStatus);

                                                                    dataAry.push(temp);
                                                                    temp = [];
                                                                }
                                                            } else {
                                                                node.warn("ui_table：アラーム＆イベントデータではありません", contentList);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        
                                        break;
                                    default:
                                        node.error("contentType：対象外の集計データです");
                                        dataAry = [];
                                    
                                }
                                msg.payload = dataAry;
                                break;

                            case "inchartSet":
                                switch(node.contype2) {
                                    case "iaCloudData":
                                    default:
                                        try {
                                            dataAry = [];       // 出力用データ一時保存用
                                            var temp = [];          // 出力用データ保存用
                                            
                                            msg.series = msg.payload[0].series;
                                            data = msg.payload[0].data;
                                            
                                            msg.series.unshift("timeStamp");

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
                                }
                                msg.payload = dataAry;
                                break;

                            case "formatSet":
                                // 項目取得、配列に変換
                                msg.series = item.split(",");
                                break;
                            default:
                        
                        }

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
                    },
                });
            }
        }
        catch (e) {
            console.log(e);
        }
        
        node.on("close", done);
    }
    RED.nodes.registerType('ui_table', TableNode);
};