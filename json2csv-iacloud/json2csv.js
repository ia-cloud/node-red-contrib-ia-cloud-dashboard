
const json2csvParser = require("json2csv").Parser;

module.exports = function(RED) {
    function Json2csvNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // console.log("config: " + JSON.stringify(config));

        this.confSel = config.confsel;

        // iaCloud形式の場合のフィールド
        var fields = "objectKey,timeStamp,dataObject.objectKey,dataObject.objectType,dataObject.objectDescription,"
        + "dataObject.timeStamp,dataObject.instanceKey,dataObject.objectContent.contentType,"
        + "dataObject.objectContent.contentData.dataName,dataObject.objectContent.contentData.dataValue,"
        + "dataObject.objectContent.contentData.unit";
        var unwind;                                             // iaCloud形式の場合の項目名
        this.complete = "payload.Items";                        // iaCloud形式の場合のパス


        // カスタムセットの場合はフィールド名とリストパスを取得
        // iaCloud形式の場合は上で設定した値を使用する
        if (node.confSel == "customSet") {
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


            
            // defaultSetの場合はunwind値の確定処理
            try {
                if (node.confSel == "defaultSet") {
                    if (json[0].dataObject.objectContent != undefined) {
                        unwind = "dataObject.objectContent.contentData";
                    } else if (json[0].dataObject.ObjectContent != undefined) {
                        unwind = "dataObject.ObjectContent.contentData";
                    } else {
                        node.error("json2csv：変換対象データが不正です。");
                    }
                }
            } catch (e) { 
                node.error("json2csv：変換対象データが不正です。");
            }
            
            // csvに変換
            var csv = csvConvert(json, fields, unwind);
            msg.payload = csv;

            /*
            console.log(msg.payload);
            if (msg.payload == "") {
                node.error("json2csv：正常に変換処理が行われませんでした。");
            }
            */

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