
const json2csvParser = require("json2csv").Parser;

module.exports = function(RED) {
    function Json2csvNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // console.log("config: " + JSON.stringify(config));

        var confSel = config.confsel;

        // iaCloud形式の場合のフィールド
        var fields = "objectKey,timeStamp,dataObject.objectKey,dataObject.objectType,dataObject.objectDescription,"
        + "dataObject.timeStamp,dataObject.instanceKey,dataObject.ObjectContent.contentType,"
        + "dataObject.ObjectContent.contentData.dataName,dataObject.ObjectContent.contentData.dataValue,"
        + "dataObject.ObjectContent.contentData.unit";
        var unwind = "dataObject.ObjectContent.contentData";    // iaCloud形式の場合の項目名
        this.complete = "payload.Items";                        // iaCloud形式の場合のパス

        // カスタムセットの場合はフィールド名とリストパスを取得
        // iaCloud形式の場合は上で設定した値を使用する
        if (confSel == "customSet") {
            fields = config.fields; // フィールド名
            unwind = config.unwind; // リストパス
            // 変換を行うパスの取得
            this.complete = (config.complete||"payload.Items").toString();
            if (this.complete === "false") { this.complete = "payload.Items"; }
        }
        
        node.on('input', function(msg) {
            // カスタムセットの場合はcomplateを取得
            if (this.complete === "true") {
                // debug complete msg object
                if (this.console === "true") {
                    node.log("\n"+util.inspect(msg, {colors:useColors, depth:10}));
                }
            } else {
                // debug user defined msg property
                var property = "payload";
                var json = msg[property];
                if (this.complete !== "false" && typeof this.complete !== "undefined") {
                    property = this.complete;
                    try {
                        json = RED.util.getMessageProperty(msg,this.complete);
                    } catch(err) {
                        json = undefined;
                    }
                }
            }

            // csvに変換
            var csv = csvConvert(json, fields, unwind);
            msg.payload = csv;

            node.send(msg);
        });
    }
    RED.nodes.registerType("json2csv",Json2csvNode);

    // json→csvへ変換する関数
    function csvConvert (data, fields, unwind) {

        // 取得したリストを配列へ分割
        var fieldsAry = fields.split(",");

		var jsParser = new json2csvParser( {
			fields  : fieldsAry,
			unwind  : unwind,
			// BOMの付加
			// withBOM : true
		});

		return jsParser.parse(data);

    }

}