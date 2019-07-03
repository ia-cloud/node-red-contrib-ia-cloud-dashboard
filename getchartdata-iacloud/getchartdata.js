
module.exports = function(RED) {

	
    function getchartdataNode(config) {

		var dynamodb = require("../dynamodb")(RED);

		var opts;			// dynamodbへのアクセス情報を格納
		var resultList;		// 取得結果を保存

		RED.nodes.createNode(this,config);


		// 検索条件の取得
		this.name = config.name;				// ノード名
		this.operation = "Query";				// 処理名
		this.stime = config.stime;				//期間 開始期間
		this.etime = config.etime;				//期間 終了期間
		this.TableName = config.tableName;		// 検索対象テーブル名
		this.Limit = config.limit;				// 検索件数
		this.ScanIndexForward = config.sort;	// 並び順

		this.aggregationCheck = config.aggregationCheck;	// アグリゲーション設定の有無
		// this.aggreConfig;									// アグリゲーションオプション
		this.aggregation = config.aggregation;	//アグリゲーション操作
		this.aggreunit = config.aggreunit;		// アグリゲーション単位
		this.decimalPoint = config.decimalPoint;//  アグリゲーション時の小数点以下四捨五入ポイント
		this.KeyConditionExpression = "objectKey = :a";	// 検索条件
		this.ExpressionAttributeValues = {				// 検索条件値
			":a": config.objectKey
		};
		
		// dynamoDB接続用情報の取得
		this.userID = this.credentials.userID;
		this.password = this.credentials.password;

		/*
		// 出力データ項目設定情報取得
		var outSeries = config.series;              // グラフに表示する項目
        var outSeriesList = outSeries.split(",");   // カンマ事に項目を取得
		*/

		// 出力データ項目設定情報取得
		var seriesObject;
		try {
			seriesObject = JSON.parse(config.seriesObject);
		} catch (e) {
			seriesObject = {};
		}
		var outSeriesList = [];              
		seriesObject.forEach (function (object) {
			outSeriesList.push(object.dataName);
		});


		// node作成
		var node = this;

		// dynamodb接続設定
		opts = dynamodb.cnctSetting(node.userID, node.password);


    	// Limitチェック
		if (node.Limit == "") {
			// 上限件数の指定がなかった場合は10000件とする
			node.Limit = 10000;
		}

		// 期間式の設定
		node = dynamodb.expressionSetting(node);


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

				var ItemList;						// 出力データ一時保存
				var contentList = [];				//  出力データ項目部分作成

				body.series = [];                   // 出力データ：項目部分
				body.data = [];                     // 出力データ：データ部分
				body.labels= [""];                  // 出力データ：ラベル部分

				// console.log("\n\n" + JSON.stringify(body) + "\n\n");
				if (node.aggregationCheck == true && body.Items != undefined) {

					// アグリゲーションデータ
					resultList = dynamodb.aggregation(body.Items, node);
					ItemList = resultList;

					// 変換データ取得
					try {
						contentList = ItemList[0].contentData;
					} catch (e) { 
						node.error("getChartdata：変換対象データがありません。");
					}
					// console.log("contentList:"+ JSON.stringify(contentList) + "\n");
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
							// body.series.push(outSeriesList[i]);

							var matchData = seriesObject.filter(function(item, index){
								if (item.dataName == outSeriesList[i]) return true;
							});
							if (matchData.length > 0) {
								body.series.push(matchData[0].displayName);
							} else {
								body.series.push(outSeriesList[i]);
							}

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


				} else if (node.aggregationCheck == false && body.Items != undefined) {

					// 生データ
					resultList = body;
					ItemList = resultList.Items;


					// 変換データ取得
					try {
						if (ItemList[0].dataObject.objectContent != undefined) {
							contentList = ItemList[0].dataobject.objectContent.contentData;
						} else if (ItemList[0].dataObject.ObjectContent != undefined) {
							contentList = ItemList[0].dataObject.ObjectContent.contentData;
						} else {
							node.error("getChartdata：変換対象データがありません。");
						}
					} catch (e) { 
						node.error("getChartdata：変換対象データがありません。");
					}
					
					var seriesList = [];
					for(i=0;i < contentList.length;i++) {
						seriesList.push(contentList[i].dataName);
					}
	
					var seriesCombList = [];
					var combIndex = -1;
					
					// 出力項目チェック
					/*
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
					*/
					for (i=0; i < outSeriesList.length; i++) {
						combIndex = seriesList.indexOf(outSeriesList[i]);
						if (combIndex >= 0){
							// 存在する場合表示項目に追加
							var combTmp = {
								"index" : combIndex,
								"dataName": outSeriesList[i]
							};
							// body.series.push(outSeriesList[i]);

							var matchData = outSeriesList.filter(function(item, index){
								if (item.dataName == outSeriesList[i]) return true;
							});
							if (matchData.length > 0) {
								body.series.push(matchData[0].displayName);
							} else {
								body.series.push(outSeriesList[i]);
							}
							
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

				}




				// 作成した出力データをnode.send()へセット
				resultList = [body];
				msg.payload = resultList;
            	node.send(msg);

			});

        });
	}
	

	RED.nodes.registerType("getchartdata", getchartdataNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};