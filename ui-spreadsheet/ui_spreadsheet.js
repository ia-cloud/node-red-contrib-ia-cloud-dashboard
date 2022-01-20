
module.exports = function(RED) {

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_spreadsheet.error.no-group"));
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

            var i;                              // ループ処理用

            // var confsel = config.confsel;
            this.contype = config.contype;      // 集計対象のcontentType
            this.item = config.item;            // 表示する項目
            this.aneStatus = config.aneStatus;       // カウントするステータス

            var label = config.label;
            if  (label == undefined) {
                label = "";
            }

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

            if (checkConfig(node, config)) {

                var html = HTML(config);

                // create new widget
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
                        node.status({fill:"blue", shape:"dot", text:"runtime.connect"});
                        itemList = msg.payload.Items;
                        var contentList;                // 取得データ一時保存
                        var resultList = [];            // 集計結果保存    [n][0]:AnEStatus, [n][1]:AnEDescription, [n][2]:カウント
                        if (itemList != undefined) {
                            // A＆E 件数集計
                            for(i=0;i < itemList.length; i++) {  //データ件数でループ
                                try {
                                    if (itemList[i].dataObject.objectContent != undefined) {
                                        contentList = itemList[i].dataObject.objectContent.contentData;
                                    } else if (itemList[i].dataObject.ObjectContent != undefined) {
                                        contentList = itemList[i].dataObject.ObjectContent.contentData;
                                    } else {
                                        node.status({fill:"yellow", shape:"ring", text:"runtime.noObjCnt"});
                                        continue;
                                    }
                                } catch (e) {
                                    node.status({fill:"yellow", shape:"ring", text:"runtime.noObjCnt"});
                                    continue;
                                }
                                // 集計データごとに集計処理を実施
                                switch (node.contype) {
                                    case "Alarm&Event":
                                        // contentListにデータ入っていたら検索開始
                                        if (contentList.length > 0){
                                            var conIdx;
                                            for (conIdx=0; conIdx<contentList.length; conIdx++) {
                                                if (contentList[conIdx].commonName === "Alarm&Event" && contentList[conIdx].dataValue != undefined) {
                                                    if (contentList[conIdx].dataValue.AnEStatus === node.aneStatus) {
                                                        var rIdx;
                                                        // 初回カウントデータ判定
                                                        for (rIdx=0; rIdx<resultList.length; rIdx++) {
                                                            if (resultList[rIdx][0] === contentList[conIdx].dataValue.AnECode) {
                                                                break;
                                                            }
                                                        }
                                                        if (rIdx < resultList.length) {
                                                            // エラー詳細がresultList内に見つかった場合はカウントに+1
                                                            resultList[rIdx][2]++;
                                                        } else {
                                                            // エラー詳細がresultList内に見つからなかった場合はカウント新規作成
                                                            resultList.push([contentList[conIdx].dataValue.AnECode, contentList[conIdx].dataValue.AnEDescription, 1]);
                                                        }
                                                    }

                                                }
                                            }
                                        }
                                        break;

                                    default:
                                        node.status({fill:"yellow", shape:"ring", text:"runtime.noConType"});
                                }
                            }
                        }

                        // 表示項目ごとに出力内容を設定
                        switch (node.contype) {
                            case "Alarm&Event":
                            switch (node.item) {
                                case "nodesc":
                                msg.series = ["No", "詳細", "回数"];
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
                                msg.series = ["詳細", "回数"];
                                msg.payload = resultList;
                            }
                            break;

                            default:
                                node.status({fill:"yellow", shape:"ring", text:"runtime.noConType"});
                        }

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

                        if (msg.payload.length > 0) {
                            node.status({fill:"green", shape:"dot", text:"runtime.complete"});
                        } else {
                            node.status({fill:"yellow", shape:"ring", text:"runtime.noData"});
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
    RED.nodes.registerType('ui_spreadsheet', TableNode);
};