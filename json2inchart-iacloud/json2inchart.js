
module.exports = function(RED) {
    function Json2inchartNode(config) {
        RED.nodes.createNode(this,config);

        this.confSel = config.confsel;
        var outSeries = config.series;              // グラフに表示する項目
        var outSeriesList = outSeries.split(",");   // カンマ事に項目を取得

        var node = this;

        node.on('input', function(msg) {

            var i,j;

            var ItemList;                       // 入力から表示対象データを取得
            var resAry = [];                    // 出力用
            var body = {};                      // 出力データ作成用

            body.series = [];                   // 出力データ：項目部分
            body.data = [];                     // 出力データ：データ部分
            body.labels= [""];                  // 出力データ：ラベル部分

            // 出力データ：項目部分抽出
            var contentList = [];

            if (node.confSel == "rawData") {
                /* 生データの場合 */
                ItemList = msg.payload.Items;
                // ItemList = msg.payload; 
                try {
                    if (ItemList[0].dataObject.objectContent != undefined) {
                        contentList = ItemList[0].dataobject.objectContent.contentData;
                    } else if (ItemList[0].dataObject.ObjectContent != undefined) {
                        contentList = ItemList[0].dataObject.ObjectContent.contentData;
                    } else {
                        node.error("json2inchart：変換対象データがありません");
                    }
                } catch (e) { 
                    node.error("json2inchart：変換対象データがありません");
                }
                
                var seriesList = [];
                for(i=0;i < contentList.length;i++) {
                    seriesList.push(contentList[i].dataName);
                }

                var seriesCombList = [];
                var combIndex = -1;
                
                // 出力項目チェック
                for (i=0; i < outSeriesList.length; i++) {
                    combIndex = seriesList.indexOf(outSeriesList[i]);
                    if (combIndex >= 0){
                        // 存在する場合表示項目に追加
                        var combTmp = {
                            "index" : combIndex,
                            "dataName": outSeriesList[i]
                        };
                        body.series.push(outSeriesList[i]);
                        seriesCombList.push(combTmp);
                    }
                }
            
                // 出力データ：データ部分作成
                for(i=0;i < seriesCombList.length;i++) {    // 表示対象データでループ
                    var dataTmp = [];
                    for(j=0;j < ItemList.length;j++) {  //データ件数でループ
                        var timeStamp = ItemList[j].dataObject.timeStamp;
                        var contentList = ItemList[j].dataObject.ObjectContent.contentData;
                        // x:timeStamp, y:dataValue
                        try {
                            var pushTmp = {
                                "x" : timeStamp,
                                "y" : contentList[seriesCombList[i].index].dataValue
                            };
                        }catch (e) {
                            var pushTmp = {
                                "x" : timeStamp,
                                "y" : null
                            };
                        }
                        dataTmp.push(pushTmp);
                    }
                    body.data.push(dataTmp);
                }
            
            } else {
                /* アグリゲーションデータの場合 */
                // console.log("アグリゲーションデータ処理");
                ItemList = msg.payload;

                try {
                    contentList = ItemList[0].contentData;
                } catch (e) { 
                    node.error("json2inchart：変換対象データがありません");
                }
                // console.log("contentList:"+ JSON.stringify(contentList) + "\n");
                var seriesList = [];
                for(i=0;i < contentList.length;i++) {
                    seriesList.push(contentList[i].dataName);
                }
                // console.log("seriesList : " + JSON.stringify(seriesList) + "\n");
                var seriesCombList = [];
                var combIndex = -1;
                
                // 出力項目チェック
                for (i=0; i < outSeriesList.length; i++) {
                    combIndex = seriesList.indexOf(outSeriesList[i]);
                    if (combIndex >= 0){
                        // 存在する場合表示項目に追加
                        var combTmp = {
                            "index" : combIndex,
                            "dataName": outSeriesList[i]
                        };
                        body.series.push(outSeriesList[i]);
                        seriesCombList.push(combTmp);
                    }
                }
                // console.log("seriesCombList : " + JSON.stringify(seriesCombList) + "\n");

                // 出力データ：データ部分作成
                for(i=0;i < seriesCombList.length;i++) {    // 表示対象データでループ
                    var dataTmp = [];
                    for(j=0;j < ItemList.length;j++) {  //データ件数でループ
                        var timeStamp = ItemList[j].timeStamp;
                        var contentList = ItemList[j].contentData;
                        // x:timeStamp, y:dataValue
                        try {
                            var pushTmp = {
                                "x" : timeStamp,
                                "y" : contentList[seriesCombList[i].index].dataValue
                            };
                        }catch (e) {
                            var pushTmp = {
                                "x" : timeStamp,
                                "y" : null
                            };
                        }

                        dataTmp.push(pushTmp);
                    }
                    body.data.push(dataTmp);
                }

            }

            resAry.push(body);
            msg.payload = resAry;

            node.send(msg);
        });
    }
    RED.nodes.registerType("json2inchart",Json2inchartNode);

}