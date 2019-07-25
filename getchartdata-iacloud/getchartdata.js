
module.exports = function(RED) {

	
    function getchartdataNode(config) {

		/* 使用モジュール定義 */
		var dynamodb = require("../dynamodb")(RED);
		var moment = require("moment");

		var opts;			// dynamodbへのアクセス情報を格納
		var resultList;		// 取得結果を保存

		RED.nodes.createNode(this,config);


		// 検索条件の取得
		this.name = config.name;							// ノード名
		this.operation = "Query";							// 処理名
		
		this.TableName = config.tableName;					// 検索対象テーブル名
		this.Limit = config.limit;							// 検索件数
		this.ScanIndexForward = config.sort;				// 並び順
		
		this.dateCheck = config.dateCheck;					// 期間設定方法
		this.sdate = config.sdate;							// 期間 開始期間
		this.edate = config.edate;							// 期間 終了期間

		this.aggregationCheck = config.aggregationCheck;	// アグリゲーション設定の有無
		this.aggregation = config.aggregation;				// アグリゲーション操作
		this.aggreunit = config.aggreunit;					// アグリゲーション単位
		this.decimalPoint = config.decimalPoint;			// 表示桁数
		this.ExpressionAttributeValues = {					// 検索条件値
			":a": config.objectKey
		};
		
		// dynamoDB接続用情報の取得
		this.userID = this.credentials.userID;
		this.password = this.credentials.password;

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

			// dateCheckがdatesetInputの場合は入力されてきた値でsdate,edateを更新
			if (node.dateCheck == "datesetInput") {
				node.sdate = msg.payload.sdate;
				node.edate = msg.payload.edate;
			}

			if (node.sdate == undefined || node.edate == undefined || moment(node.sdate) <= moment(node.edate)) {
				// 期間式の設定
				node = dynamodb.expressionSetting(node);

				// DynamoDBパラメータの作成
				opts = dynamodb.serviceSetting (opts, node);

				// DynamoDBへリクエスト
				dynamodb.dynamoRequest(opts, node, function(body) {



					if (body.Items != undefined && body.Items.length > 0) {	
						var ItemList;						// 出力データ一時保存
						var contentList = [];				//  出力データ項目部分作成

						body.series = [];                   // 出力データ：項目部分
						body.data = [];                     // 出力データ：データ部分
						body.labels= [""];                  // 出力データ：ラベル部分

						// アグリゲーション処理あり
						if (node.aggregationCheck == true && body.Items != undefined) {

							// アグリゲーションデータ
							resultList = dynamodb.aggregation(body.Items, node);

							// 桁数変更処理
							if (node.decimalPoint != "noexe") {
								resultList = dynamodb.round(resultList, node);
							}

							ItemList = resultList;
							delete body.Items;

							// 変換データ取得
							try {
								contentList = ItemList[0].contentData;
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
							for (i=0; i < outSeriesList.length; i++) {
								combIndex = seriesList.indexOf(outSeriesList[i]);
								if (combIndex >= 0){
									// 存在する場合表示項目に追加
									var combTmp = {
										"index" : combIndex,
										"dataName": outSeriesList[i]
									};

									var matchData = seriesObject.filter(function(item, index){
										if (item.dataName == outSeriesList[i]) return true;
									});
									if (matchData.length > 0 && matchData[0].displayName != "") {
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
									var timestamp;

									// timeStamp(timestamp)を格納
									if (ItemList[j].timeStamp != undefined) {
										timestamp = ItemList[j].timeStamp;
									} else if (ItemList[j].timestamp != undefined) {
										timestamp = ItemList[j].timestamp;
									} else {
										console.log("timeStamp(timestamp)が無効\n");
										continue;
									}

									var contentList = ItemList[j].contentData;
									// x:timestamp, y:dataValue
									try {
										var pushTmp = {
											"x" : timestamp,
											"y" : contentList[seriesCombList[i].index].dataValue
										};
									}catch (e) {
										var pushTmp = {
											"x" : timestamp,
											"y" : null
										};
									}

									dataTmp.push(pushTmp);
								}
								body.data.push(dataTmp);
							}

						// アグリゲーション処理なし
						} else if (node.aggregationCheck == false && body.Items != undefined) {

							// 生データ
							resultList = body;

							// 桁数変更処理
							if (node.decimalPoint != "noexe") {
								resultList = dynamodb.round(resultList, node);
							}

							ItemList = resultList.Items;
							delete resultList.Items;

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
							for (i=0; i < outSeriesList.length; i++) {
								combIndex = seriesList.indexOf(outSeriesList[i]);
								if (combIndex >= 0){
									// 存在する場合表示項目に追加
									var combTmp = {
										"index" : combIndex,
										"dataName": outSeriesList[i]
									};

									var matchData = seriesObject.filter(function(item, index){
										if (item.dataName == outSeriesList[i]) return true;
									});
									if (matchData.length > 0 && matchData[0].displayName != "") {
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
									var timestamp;

									// timeStamp(timestamp)を格納
									if (ItemList[j].dataObject.timeStamp != undefined) {
										timestamp = ItemList[j].dataObject.timeStamp;
									} else if (ItemList[j].dataObject.timestamp != undefined) {
										timestamp = ItemList[j].dataObject.timestamp;
									} else {
										console.log("timeStamp(timestamp)が無効\n");
										continue;
									}


									var contentList = ItemList[j].dataObject.ObjectContent.contentData;
									// x:timestamp, y:dataValue
									try {
										var pushTmp = {
											"x" : timestamp,
											"y" : contentList[seriesCombList[i].index].dataValue
										};
									}catch (e) {
										var pushTmp = {
											"x" : timestamp,
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
					} else {
						console.log("指定条件のデータが見つかりませんでした");
						node.error("getChartdata - 指定条件のデータが見つかりませんでした");
						node.sendMsg([]);
					}

				});
			} else {
				console.log("期間指定に誤りがあります");
				node.error("getChartdata - 期間指定に誤りがあります");
				node.sendMsg([]);
			}

        });
	}
	

	RED.nodes.registerType("getchartdata", getchartdataNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};