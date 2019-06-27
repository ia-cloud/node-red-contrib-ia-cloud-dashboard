
module.exports = function(RED) {
    function Json2inwidgetNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var outSeries = config.series;              // グラフに表示する項目

        node.on('input', function(msg) {

            var i;

            var ItemList = msg.payload.Items;   // 入力から表示対象データを取得
            var dataValue;      // 取得したdataValueを格納


            // 出力データ：項目部分抽出
            var contentList = ItemList[0].dataObject.ObjectContent.contentData;
            var seriesList = [];
            for(i=0;i < contentList.length;i++) {
                seriesList.push(contentList[i].dataName);
            }
        
            var combIndex = -1;
            
            // 出力項目チェック
            combIndex = seriesList.indexOf(outSeries);
            if (combIndex >= 0){
                // 存在する場合表示項目に追加
                dataValue = contentList[combIndex].dataValue;
            } else {
                // 存在しない場合エラー出力
                console.log("指定された項目のデータが見つかりません");
                node.error("エラー：指定された項目のデータが見つかりません", msg);
            }

            // dataValueをlayloadに格納
            msg.payload = dataValue;

            node.send(msg);
        });
    }
    RED.nodes.registerType("json2inwidget",Json2inwidgetNode);

}