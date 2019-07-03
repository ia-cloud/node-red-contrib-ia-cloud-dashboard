
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
            
            var i;                              // ループ処理用

            // var confsel = config.confsel;
            this.item = config.item;            // 表示する項目
            var aeStatus = "set";               // カウントするA＆Eステータス
        
            var label = config.label;
            if  (label == undefined) {
                label = "";
            }

            var node = this;
            var done = null;
        
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

            node.on('input', function(msg) {
    
                ItemList = msg.payload.Items;
                // ItemList = msg.payload; 
                
                var contentList;        // 取得データ一時保存
                var resultList = [];         // 集計結果保存

                // A＆E 件数集計
                for(i=0;i < ItemList.length; i++) {  //データ件数でループ
                    try {
                        if (ItemList[i].dataObject.objectContent != undefined) {
                            contentList = ItemList[i].dataobject.objectContent.contentData;
                        } else if (ItemList[i].dataObject.ObjectContent != undefined) {
                            contentList = ItemList[i].dataObject.ObjectContent.contentData;
                        } else {
                            node.error("ui_spreadsheet：A&Eデータではありません。");
                            continue;
                        }
                    } catch (e) { 
                        node.error("ui_spreadsheet：A&Eデータではありません。");
                        continue;
                    }

                    // アラームステータスがaeStatusのみのデータを処理
                    if (contentList[0].dataValue == aeStatus) {
                        var rIdx;
                        for (rIdx=0; rIdx<resultList.length; rIdx++) {
                            if (resultList[rIdx][0] == contentList[1].dataValue) {
                                break;
                            }
                        }
                        if (rIdx < resultList.length) {
                            // エラー詳細がresultList内に見つかった場合はカウントに+1
                            resultList[rIdx][2]++;
                        } else {
                            // エラー詳細がresultList内に見つからなかった場合はカウント新規作成
                            resultList.push([contentList[1].dataValue,contentList[2].dataValue, 1]);
                        }
                    }

                }

                // 表示項目ごとに出力内容を設定
                console.log("item:" + node.item+ "\n");
                switch (node.item) {
                    case "nodesc": 
                    msg.series = ["No", "アラーム&イベント詳細", "回数"];
                    msg.payload = resultList;
                    break;

                    case "no": 
                    for (i=0;i < resultList.length; i++) { 
                        resultList[i].splice(1, 1);
                    }
                    msg.series = ["No", "回数"];
                    msg.payload = resultList;
                    break;

                    case "desc": 
                    for (i=0;i < resultList.length; i++) { 
                        resultList[i].splice(0, 1);
                    }
                    msg.series = ["アラーム&イベント詳細", "回数"];
                    msg.payload = resultList;
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
                    for (i=0; i<properties.length; i++) {
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
    RED.nodes.registerType('ui_spreadsheet', TableNode);
};