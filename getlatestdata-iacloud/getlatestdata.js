
module.exports = function(RED) {

	
    function getlatestdataNode(config) {

		var dynamodb = require("../dynamodb")(RED);

		var opts;			// dynamodbへのアクセス情報を格納
		var resultList;		// 取得結果を保存

		RED.nodes.createNode(this,config);

		// 検索条件の取得
		this.name = config.name;				// ノード名
		this.operation = "Query";				// 処理名
		this.TableName = config.tableName;		// 検索対象テーブル名
		this.ScanIndexForward = "false";		// 並び順
		this.KeyConditionExpression = "objectKey = :a";	// 検索条件
		this.ExpressionAttributeValues = {				// 検索条件値
			":a": config.objectKey
		};
		
		// dynamoDB接続用情報の取得
		this.userID = this.credentials.userID;
		this.password = this.credentials.password;

		// 出力データ項目設定情報取得
		var outSeries = config.series;              // グラフに表示する項目
        var outSeriesList = outSeries.split(",");   // カンマ事に項目を取得

		// node作成
		var node = this;

		// dynamodb接続設定
		opts = dynamodb.cnctSetting(node.userID, node.password);


    	// Limitチェック
		if (node.Limit == "") {
			// 上限件数の指定がなかった場合は10000件とする
			node.Limit = 1;
		}

		// 期間式の設定
		// node = dynamodb.expressionSetting(node);


		// injectされたら実行
        node.on('input', function(msg) {
			// ノード接続情報出力
			node.sendMsg = function (data) {
				if (!data) {
					node.status({fill:"red",shape:"ring",text:"error"});
					node.error("failed: Data acquisition failed");
					return;
				} else {
					msg.payload = data;
					node.status({});
				}
				node.send(msg);
			};

			// DynamoDBパラメータの作成
			opts = dynamodb.serviceSetting (opts, node);

			// DynamoDBへリクエスト
			dynamodb.dynamoRequest(opts, node, function(body) {

				var i;

				if (body.Items != undefined) {

					var ItemList;						// 出力データ一時保存

					var contentList
					var seriesList = [];

					var dataValue;      // 取得したdataValueを格納

					resultList = body;
					ItemList = resultList.Items;
					


					// 出力データ：項目部分抽出
					contentList = ItemList[0].dataObject.ObjectContent.contentData;
					
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
				}else {
					console.log("変換対象データがありません");
					node.error("json2inLatest：変換対象データがありません");
				}
			});

        });
	}
	

	RED.nodes.registerType("getlatestdata", getlatestdataNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};