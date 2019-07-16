module.exports = function(RED) {

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_table.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        // define HTML code
        var html = String.raw`
        <div align="center">
        <input type="date" id="sdate" style="width:120px; height:25px; font-size: 70%;"
            ng-model="sdate">
        ～<input type="date" id="edate" style="width:120px; height:25px; font-size: 70%;"
            ng-model="edate">
        </div>
        <div align="center" style="margin-top : 5px">
            <input type="button" id="send" style="width:250px; height:30px; font-size: 70%;" value="更新" ng-click="click(sdate ,edate)">
        </div>`;

        return html;
    };

    var ui = undefined;
    function DatesetNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                // load Dashboard API
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            
            /* 使用モジュール定義 */
            var moment = require("moment");

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
            
            if (checkConfig(node, config)) {

                var html = HTML(config);

                var done = ui.addWidget({
                    node: node,
                    format: html,
                    templateScope: "local",
                    group: config.group,
                    width: config.width || group.config.width || 2,
                    height: config.height || 1,
                    emitOnlyNewValues: true,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    beforeSend: function (msg, orig) {
                        if (orig) {
                            return orig.msg;
                        }
                    },
                    initController: function($scope, events) {
                        $scope.value1 = false;
                        // 更新ボタンが押されたら実行
                        $scope.click = function (sdate, edate) {
                            if (sdate != undefined && sdate != null) {
                                sdate = moment(sdate).format("YYYY-MM-DD");
                            } else {
                                sdate = undefined;
                            }
                            if (edate != undefined && edate != null) {
                                edate = moment(edate).format("YYYY-MM-DD");
                            } else {
                                edate = undefined;
                            }
                            var sendJson = {
                                sdate:sdate,
                                edate:edate
                            }
                            $scope.send({payload: sendJson});
                        };
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }

        node.on("close", done);
    }
    RED.nodes.registerType('ui_dateset', DatesetNode);
};