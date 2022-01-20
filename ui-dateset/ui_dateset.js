module.exports = function(RED) {

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("ui_table.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML() {
        // define HTML code
        var html = String.raw`
        <div style="margin-top:20px; width:350px; text-align:center">
            <input type="datetime-local" step="1" id="sdatetime" style="width:160px; height:25px; font-size: 80%;"
                ng-model="sdatetime">
             ~ <input type="datetime-local" step="1" id="edatetime" style="width:160px; height:25px; font-size: 80%;"
                ng-model="edatetime">
        </div>
        <div style="margin-top:5px; width:350px; text-align:center">
            <input type="button" id="send" style="width:300px; height:30px; font-size: 80%;" value="更新" ng-click="click(sdatetime ,edatetime)">
        </div>
        `;

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
            var done = null;

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
                var html = HTML();
                done = ui.addWidget({
                    node: node,
                    format: html,
                    group: config.group,
                    width: config.width || group.config.width || 6,
                    height: config.height || 2,
                    order: config.order,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    beforeEmit: function(msg, value) {
                        return { msg: { payload: value } };
                    },
                    beforeSend: function (msg, orig) {
                        if (orig) { return orig.msg; }
                    },
                    initController: function($scope, events) {
                        $scope.value1 = false;
                        // 更新ボタンが押されたら実行
                        $scope.click = function (sdatetime, edatetime) {
                            var node = this;
                            if (sdatetime != undefined && sdatetime != null) {
                                sdatetime = moment(sdatetime).format("YYYY-MM-DDTHH:mm:ss");
                            } else {
                                sdatetime = undefined;
                            }
                            if (edatetime != undefined && edatetime != null) {
                                edatetime = moment(edatetime).format("YYYY-MM-DDTHH:mm:ss");
                            } else {
                                edatetime = undefined;
                            }

                            var sendJson = {
                                sdatetime: sdatetime,
                                edatetime: edatetime
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