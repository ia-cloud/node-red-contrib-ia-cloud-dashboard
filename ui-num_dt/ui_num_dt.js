module.exports = function(RED) {
    function checkConfig(node, conf) {
        if(!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("num_dt.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        var configAsJson = JSON.stringify(config);
        var html = String.raw`
        <div id="{{conf.nodeid}}" ng-init='init(` + configAsJson + `)' hidden></div>
        <div style="padding: 3px 0" layout="row" ng-repeat="item in msg.items">
            <p ng-if="conf.datatype == 'Number'" class="label" style="width: 40%;text-align: left;">{{item.label}}</p>
            <p ng-if="conf.datatype == 'Number'" class="value" style="width: 35%;text-align: right;font-weight: bold;">{{item.value}}</p>
            <p ng-if="conf.datatype == 'Number'" class="units" style="width: 15%;text-align: right;">{{item.units}}</p>
            <p ng-if="conf.datatype == 'Datetime'" style="text-align: left;">{{conf.data[$index].label}}</p>
            <p ng-if="conf.datatype == 'Datetime'" class="datetime" style="width: 100%; text-align: right;">{{item.datetime}}</p>
        </div>
        `;
        return html;
    }
    
    var ui = undefined;

    function NumDTNode(config) {
        var moment = require('moment');
        try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }

            RED.nodes.createNode(this, config);
            var done = null;
            if(checkConfig(node, config)){
                var html = HTML(config);
                done = ui.addWidget({
                    node: node,
                    format: html,
                    group: config.group,
                    width: config.width,
                    height: config.height,
                    order: config.order,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    //convert: function(){},
                    beforeEmit: function(msg, value) {
                        // make msg.payload accessible as msg.items in widget
                        var new_value = [];
                        var conf_ds = JSON.parse(config.display_settings);
                        for(idx in value){
                            if(conf_ds[idx] === undefined){ 
                                conf_ds[idx] = {};
                            }
                            new_value[idx] = {};
                            if(config.datatype == "Number"){
                                new_value[idx].label = conf_ds[idx].label || value[idx][0];
                                new_value[idx].value = (conf_ds[idx].digits) ? Number(value[idx][1]).toFixed(conf_ds[idx].digits) : value[idx][1];
                                new_value[idx].units = conf_ds[idx].units || value[idx][2];
                            }else if(config.datatype == "Datetime"){
                                new_value[idx].datetime = moment(value[idx]).format(conf_ds[idx].format) || value[idx];
                            }
                        }
                        node.status({fill:"green", shape:"dot", text:"runtime.complete"});
                        return { msg: { items: new_value, payload: value } };
                    },
                    convertBack: function(value){ return value; },
                    // needs beforeSend to message contents to be sent back to runtime 
                    beforeSend: function (msg, orig) {
                        if (orig) { return orig.msg; }
                    },
                    initController: function ($scope, events) {
                        var conf = undefined;
                        if(conf === undefined){
                            var conf = {};
                        }
                        $scope.init = function(config){
                            conf.nodeid = "num_dt_" + config.id.replace('.', '_');
                            conf.datatype = config.datatype;
                            conf.ds = JSON.parse(config.display_settings);
                            var data = [];
                            for(idx in conf.ds){
                                data[idx] = {};
                                if(conf.datatype == "Datetime"){
                                    data[idx].label_flag = (conf.ds[idx].dt_label_flag == 'on') ? true : false;
                                    data[idx].label = conf.ds[idx].dt_label || '';
                                }
                            }
                            $scope.conf = { nodeid: conf.nodeid, datatype: conf.datatype, data: data };
                        }
                        $scope.$watch('msg', function(msg) {
                            if(!msg){ return; }
                            $(function(){
                                var value = msg.payload;
                                //for(var idx=0; idx<Math.min(conf.ds.length, value.length); idx++){
                                for(var idx=0; idx<value.length; idx++){
                                    if(conf.datatype == "Number"){
                                        if(conf.ds[idx]){
                                            var label = conf.ds[idx].label || value[idx][0];
                                            var val = (conf.ds[idx].digits) ? Number(value[idx][1]).toFixed(conf.ds[idx].digits) : value[idx][1];
                                            var units = conf.ds[idx].units || value[idx][2];
                                        }else{
                                            var label = value[idx][0];
                                            var val = value[idx][1];
                                            var units = value[idx][2];
                                        }
                                        $("#"+conf.nodeid).siblings().eq(idx).find('.label').text(label);
                                        $("#"+conf.nodeid).siblings().eq(idx).find('.value').text(val);
                                        $("#"+conf.nodeid).siblings().eq(idx).find('.units').text(units);
                                    }else if(conf.datatype == "Datetime"){
                                        if(conf.ds[idx]){
                                            var val = moment(value[idx]).format(conf.ds[idx].format) || value[idx];
                                        }else{
                                            var val = value[idx];
                                        }
                                        $("#"+conf.nodeid).siblings().eq(idx).find('.datetime').text(val);
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
    RED.nodes.registerType('ui_num_dt', NumDTNode);
};
