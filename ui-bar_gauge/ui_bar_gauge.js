module.exports = function(RED) {
    function checkConfig(node, conf) {
        if(!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("bar_gauge.error.no-group"));
            return false;
        }
        return true;
    }

    function HTML(config) {
        var configAsJson = JSON.stringify(config);
        var html = String.raw`
        <div ng-init='init(` + configAsJson + `)' hidden></div>
        <div id="{{conf.nodeid}}"></div>
        `;
        return html;
    }

    var ui = undefined;

    function barGaugeNode(config) {
        try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }

            if(config.direction == "Vertical") {
                config.width = Number(config.width) || 2;
                config.height = Number(config.height) || 6;
            }else if(config.direction == "Horizontal") {
                var group = RED.nodes.getNode(config.group);
                config.width = Number(config.width) || group.config.width;
                config.height = Number(config.height) || 1;
            }

            // ref. https://github.com/hotNipi/node-red-contrib-ui-level/blob/master/ui-level.js
            config.site_opts = {};
            config.site_opts.sizes = ui.getSizes();
            config.site_opts.theme = ui.getTheme();

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
                        return { msg: { payload: value } };
                    },
                    convertBack: function(value){ return value; },
                    beforeSend: function(msg, orig) {
                        if (orig) { return orig.msg; }
                    },
                    initController: function($scope, events) {
                        barGauge = function() {
                            var orient = "left";
                            var duration = 0;
                            var width = 0;
                            var height = 0;
                            var tickFormat = null;
                            function barGauge(g) {
                              g.each(function(d, i) {
                                var reverse = d.vertical;

                                var x1 = undefined;
                                var range_max = d.vertical ? height : width;
                                x1 = d3.scale.linear()
                                    .domain([d.min, d.max])
                                    .range(reverse ? [range_max, 0] : [0, range_max]);

                                var x0 = this.__chart__ || d3.scale.linear()
                                    .domain([0, Infinity])
                                    .range(x1.range());
                                this.__chart__ = x1;

                                var w0 = barGaugeWidth(x0);
                                var w1 = barGaugeWidth(x1);

                                var range = g.selectAll("rect.range")
                                    .data([d.max]);

                                var measure = g.selectAll("rect.measure")
                                    .data([d.value]);

                                // TODO: Refactoring
                                if(d.vertical){
                                    range.enter().append("rect")
                                        .attr("class", "range")
                                        .attr("style", "fill: #eee")
                                        .attr("width", width)
                                        .attr("height", w0)
                                        .attr("x", 0)
                                        .attr("y", reverse ? x0 : 0);
                                    range.transition()
                                        .duration(duration)
                                        .attr("height", w1)
                                        .attr("y", reverse ? x1 : 0);

                                    measure.enter().append("rect")
                                        .attr("fill", d.color)
                                        .attr("class", "measure")
                                        .attr("width", width)
                                        .attr("height", w0)
                                        .attr("x", 0)
                                        .attr("y", reverse ? x0 : 0)
                                    measure.transition()
                                        .duration(duration)
                                        .attr("height", w1)
                                        .attr("y", reverse ? x1 : 0);
                                }else{
                                    range.enter().append("rect")
                                        .attr("class", "range")
                                        .attr("style", "fill: #eee")
                                        .attr("width", w0)
                                        .attr("height", height)
                                        .attr("x", reverse ? x0 : 0);
                                    range.transition()
                                        .duration(duration)
                                        .attr("width", w1)
                                        .attr("x", reverse ? x1 : 0);

                                    measure.enter().append("rect")
                                        .attr("fill", d.color)
                                        .attr("class", "measure")
                                        .attr("width", w0)
                                        .attr("height", height)
                                        .attr("x", reverse ? x0 : 0)
                                    measure.transition()
                                        .duration(duration)
                                        .attr("width", w1)
                                        .attr("x", reverse ? x1 : 0);
                                }

                                var format = tickFormat || x1.tickFormat(8);

                                var tick = g.selectAll("g.tick")
                                    .data(x1.ticks(8), function(d) {
                                      return this.textContent || format(d);
                                    });

                                if(d.vertical){
                                    var tickEnter = tick.enter().append("g")
                                        .attr("class", "tick")
                                        .attr("transform", barGaugeTranslateY(x0))
                                        .style("opacity", 1e-6);
                                    tickEnter.append("line")
                                        .attr("x1", width)
                                        .attr("x2", width * 7 / 6)
                                        .style("stroke", "#666")
                                        .style("stroke-width", ".5px");
                                    tickEnter.append("text")
                                        .attr("text-anchor", "start")
                                        .attr("dx", "1em")
                                        .attr("x", width)
                                        .attr("y", "0.3em")
                                        .text(format);
                            
                                    tickEnter.transition()
                                        .duration(duration)
                                        .attr("transform", barGaugeTranslateY(x1))
                                        .style("opacity", 1);
                                }else{
                                    var tickEnter = tick.enter().append("g")
                                        .attr("class", "tick")
                                        .attr("transform", barGaugeTranslateX(x0))
                                        .style("opacity", 1e-6);
                                    tickEnter.append("line")
                                        .attr("y1", height)
                                        .attr("y2", height * 7 / 6)
                                        .style("stroke", "#666")
                                        .style("stroke-width", ".5px");
                                    tickEnter.append("text")
                                        .attr("text-anchor", "middle")
                                        .attr("dy", "1em")
                                        .attr("y", height * 7 / 6)
                                        .text(format);

                                    tickEnter.transition()
                                        .duration(duration)
                                        .attr("transform", barGaugeTranslateX(x1))
                                        .style("opacity", 1);
                                }

                              });
                              d3.timer.flush();
                            }

                            barGauge.orient = function(x) {
                                if (!arguments.length) return orient;
                                orient = x;
                                reverse = orient == "right" || orient == "bottom";
                                return barGauge;
                            };
                            barGauge.width = function(x) {
                                if (!arguments.length) return width;
                                width = x;
                                return barGauge;
                            };
                            barGauge.height = function(x) {
                                if (!arguments.length) return height;
                                height = x;
                                return barGauge;
                            };
                            barGauge.tickFormat = function(x) {
                                if (!arguments.length) return tickFormat;
                                tickFormat = x;
                                return barGauge;
                            };
                            barGauge.duration = function(x) {
                                if (!arguments.length) return duration;
                                duration = x;
                                return barGauge;
                            };
                            return barGauge;
                        };
                        function barGaugeTranslateX(x) {
                            return function(d) {
                                return "translate(" + x(d) + ",0)";
                            };
                        }
                        function barGaugeTranslateY(x) {
                            return function(d) {
                                return "translate(0," + x(d) + ")";
                            };
                        }
                        function barGaugeWidth(x) {
                            var x0 = x(x.domain()[0]);
                            return function(d) {
                                return Math.abs(x(d) - x0);
                            };
                        }

                        var conf = {};
                        var chart;
                        $scope.init = function(config){
                            conf.nodeid = "bar_gauge_" + config.id.replace('.', '_');
                            conf.vertical = (config.direction == "Vertical") ? true : false; 
                            conf.title = config.label;
                            conf.subtitle = config.units;
                            conf.min = Number(config.min);
                            conf.max = Number(config.max);
                            conf.color = config.color;
                            console.log(config);
                            $scope.conf = conf;
                            $(function() {
                                var sizes = config.site_opts.sizes;
                                var width = config.width * sizes.sx + (config.width-2) * sizes.cx;
                                var height = config.height * sizes.sy + (config.height-2.2) * sizes.cy;
                                console.log(`width: ${width}, height: ${height}`);

                                var margin_h = {top: 0, right: width/20, bottom: height/2, left: width/6};
                                var margin_v = {top: 10, right: width/2, bottom: 35, left: 5};
                                var margin = conf.vertical ? margin_v : margin_h;

                                chart = barGauge()
                                    .width(width - margin.left - margin.right)
                                    .height(height - margin.top - margin.bottom);

                                var data = [conf];
                                data[0].value = 0;

                                var svg = d3.select("#" + conf.nodeid).selectAll("svg")
                                    .data(data)
                                  .enter().append("svg")
                                    .attr("class", "barGauge")
                                    .attr("width", width)
                                    .attr("height", height)
                                    .style("font", "12px sans-serif")
                                  .append("g")
                                    .attr("transform", `translate(${margin.left},${margin.top})`)
                                    .call(chart);

                                var value = svg.append("g")
                                    .style("text-anchor", "middle")
                                    .attr("transform", `translate(${chart.width()/2},${chart.height()/1.4})`);
                                value.append("text")
                                    .attr("class", "value")
                                    .style("font-size", "14px")
                                    .style("font-weight", "bold")
                                    .style("fill", "#000")
                                    .text(d => String(d.value).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'));

                                var title = svg.append("g")
                                    .style("text-anchor", d => d.vertical ? "start" : "end")
                                    .attr("transform", d => d.vertical ? 
                                        `translate(0,${chart.height()+20})` :
                                        `translate(-6,${chart.height()/2})`);
                                title.append("text")
                                    .attr("class", "title")
                                    .style("font-size", "14px")
                                    .style("font-weight", "bold")
                                    .text(d => d.title);
                                title.append("text")
                                    .attr("class", "subtitle")
                                    .attr("dy", "1em")
                                    .style("fill", "#999")
                                    .text(d => d.subtitle);
                            });
                        }
                        $scope.$watch('msg', function(msg) {
                            if(!msg){ return; }
                            $(function(){
                                var data = [conf];
                                for(var idx in msg.payload){
                                    data[idx].value = msg.payload[idx];
                                }
                                var svg = d3.select("#" + conf.nodeid).selectAll("svg");
                                svg.datum((d, i) => data[i])
                                    .select("g")
                                    .call(chart.duration(1000));
                                svg.select("text.value")
                                    .text(d => String(d.value).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'));
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
    RED.nodes.registerType('ui_bar_gauge', barGaugeNode);
};