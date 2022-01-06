
module.exports = function(RED) {

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_oprstatus.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        var html = "<div align='center'>"
            // タイトル表示
            + "<p style='font-size: 14px;'>" + config.label + "</p>"
            // グラフ表示
            + "<table id='statusTitle_table' width='90%'><tbody>"
            + "<tr><td ng-repeat = 'item in msg.series' style='font-size:14px;'>{{item}}</td>"
            + "</tr></tbody></table>"
            + "<table id='statusBar_table' width='90%'><tbody><tr>"
            + "<td ng-repeat = 'item in msg.graphData' bgcolor='{{item.statusColor}}' width='{{item.intervalPer}}%' height='15px'></td>"
            + "</tr>"
            + "</tbody></table>"
            // X軸表示
            + "<table id='statusAxis_table' width='100%' style='font-size:8px;'><tbody><tr>"
            + "<td ng-repeat = 'item in msg.xaxisData' align='center'>{{item.x}}</td>"
            + "</tr></tbody></table>";

        // 凡例表示
        if (config.guide == "display") {
            html = html + "<table id='statusList_table' style='font-size:12px;'>"
                + "<tbody> <tr>"
                + "<td ng-repeat = 'item in msg.statusObject' style='padding:15px;'>"
                + "<span style='color:{{item.statusColor}}; font-size:20px;'>■</span>{{item.statusLabel}}"
                + "</td>"
                + "</tr> </tbody> </table>"
                + "</div>";
        } else {
            html = html + "</div>";
        }

        return html;
    };

    var ui = undefined;
    function OprstatusNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                // load Dashboard API
                ui = RED.require("node-red-dashboard")(RED);
            }

            RED.nodes.createNode(this, config);
            var done = null;

            var moment = require("moment");

            var confsel = config.confsel;
            var item = config.item;
            var label = config.label;
            var sort = config.sort;				// 並び順

            if  (label == undefined) {
                label = "";
            }

            const MAX_COUNT_XAXIS = 5;

            var statusObject;
            try {
                if (config.params != undefined) {
                    statusObject = config.params;
                } else {
                    statusObject = [];
                }
            } catch (e) {
                statusObject = [];
            }

            // no rule found
            if (statusObject.length === 0) {
                node.status({fill:"yellow", shape:"ring", text:"runtime.noParam"});
            } else {
                node.status({});
            }

            var data;                       // 出力データ
            var graphData;                  // グラフ表示部分データ
            var xaxisData;                  // X軸表示用データ
            var axisRadix;                  // X軸間引き処理時の基準値

            var statusColorList = {};

            for (var i=0;i<statusObject.length;i++) {
                statusColorList[statusObject[i].statusValue] = statusObject[i].statusColor;
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
            // var pixelsWide = ((config.width || group.config.width || 6) - 1) * 43 - 15;

            var previousTemplate = null;

            if (checkConfig(node, config)) {

                var html = HTML(config);

                // create new widget
                done = ui.addWidget({
                    node: node,
                    format: html,
                    group: config.group,
                    width: parseInt(config.width || group.config.width || 6),
                    height: parseInt(config.height || 2),
                    order: config.order,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: config.fwdInMessages,
                    storeFrontEndInputAsState: config.storeOutMessages,
                    beforeEmit: function(msg, value) {

                        if (statusObject.length === 0) {
                            node.status({fill:"yellow", shape:"ring", text:"runtime.noParam"});
                            return { msg:[] };
                        }

                        node.status({fill:"blue", shape:"dot", text:"runtime.connect"});
                        data = [];              // 出力データ
                        graphData = [];         // グラフ表示部分データ
                        xaxisData = [];         // X軸表示用データ
                        try {
                            if (confsel == "inchartSet") {
                                // getChartdataからの出力を使用する

                                // 項目名に入力がなかった場合、series[0]を表示する
                                msg.series = [];
                                if (item != undefined) {
                                    msg.series.push(item);
                                } else {
                                    msg.series.push(msg.payload[0].series[0]);
                                }

                                // 有効データ(一件目)のみを取得、dataへ格納
                                data = msg.payload[0].data[0];

                            } else {
                                // 項目名を取得
                                msg.series = [];
                                msg.series.push(item);

                                // 取得データのフォーマット変換、dataへ格納
                                var tempData = msg.payload;

                                for(var i=0; i<tempData.length; i++){
                                    var tempObj =  {
                                        "x" : tempData[i][0],
                                        "y" : tempData[i][1]
                                    }
                                    data.push(tempObj);
                                }

                            }

                            // グラフ表示部分のデータ作成　ここから
                            // 最初のデータはそのままpush
                            graphData.push(data[0]);
                            // 連続データの削除
                            for (var i=1;i<data.length;i++) {
                                // 一つ前のデータとdataValueが同じ場合はgraphDataへの格納処理を行わない
                                if ( graphData[graphData.length-1].y != data[i].y ) {
                                    graphData.push(data[i]);
                                }
                            }
                            // グラフ表示部分のデータ作成　ここまで


                            // 全データの状況開始日時・終了日時の算出・格納処理
                            var startDate = moment(graphData[0].x);
                            var endDate = moment(graphData[graphData.length-1].x);

                            // 全データの累計稼働時間(秒)の算出・格納処理
                            var maxDiffTime = endDate.diff(startDate);
                            var maxDiffSec = Math.floor(maxDiffTime / 1000);

                            var diffTime;
                            var diffSec;

                            // 各データの状況開始日時・終了日時、割合を算出・格納処理
                            for (var i=0;i<graphData.length-1;i++) {
                                startDate = moment(graphData[i].x);
                                endDate = moment(graphData[i+1].x);
                                diffTime = endDate.diff(startDate);
                                diffSec = Math.floor(diffTime / 1000);
                                // 割合(各稼働秒数/全体の秒数)を算出、intervalPerに格納する
                                graphData[i].intervalPer = Math.floor((diffSec / maxDiffSec) * 10000) / 100;
                                graphData[i].statusColor = statusColorList[graphData[i].y];

                            }

                            // 最終データのintervalPerは0
                            graphData[graphData.length-1].intervalPer = 0;
                            graphData[graphData.length-1].statusColor = statusColorList[graphData[graphData.length-1].y];

                            // X軸表示データの間引き
                            // 間引きを行う際の基準値を算出
                            axisRadix = Math.floor(data.length / MAX_COUNT_XAXIS);

                            var tempDate;
                            for (var i=0;i<data.length-1;i++) {
                                if ( (i % axisRadix) != 0 || i >= (MAX_COUNT_XAXIS*axisRadix)-1) {
                                    // 無効な軸データの場合は未処理
                                } else {
                                    // 有効な軸データの場合、フォーマット変換して保存
                                    try {
                                        tempDate = moment(data[i].x);
                                        xaxisData.push({x:tempDate.format('YYYY-MM-DD HH:mm:ss')});
                                    } catch(e){
                                        xaxisData.push({x:""});
                                    }
                                }
                            }

                            // 最終データの変換
                            try {
                                tempDate = moment(data[data.length-1].x);
                                xaxisData.push({x:tempDate.format('YYYY-MM-DD HH:mm:ss')});
                            } catch(e){
                                xaxisData.push({x:""});
                            }

                            // 稼働状況の設定情報を取得、msgへ格納
                            msg.statusObject = statusObject;

                            // 入力値がDynamoDB（chart用） かつ データが降順だったらデータの前後をひっくり返す
                            if (confsel == "inchartSet" && sort == "false") {
                                graphData = graphData.reverse();
                                xaxisData = xaxisData.reverse();
                            }


                            // 作成したデータをmsg.payloadへ格納
                            msg.graphData = graphData;
                            msg.xaxisData = xaxisData;

                            // payloadデータを削除
                            msg.payload = [];

                            // statusObject.lengthが1以上の場合は表示処理完了
                            if (statusObject.length > 0) {
                                node.status({fill:"green", shape:"dot", text:"runtime.complete"});
                            }
                        } catch (e) {
                            node.error("oprstatus：表示対象データがありません。");
                            node.status({fill:"yellow", shape:"ring", text:"runtime.noData"});
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
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
        }
        node.on("close", done);
    }
    RED.nodes.registerType('ui_oprstatus', OprstatusNode);
};