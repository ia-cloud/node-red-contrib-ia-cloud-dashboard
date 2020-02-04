
module.exports = function(RED) {

	const MAX_LIMIT = 10000;			// 最大取得件数

	/* 使用モジュール定義 */
	var dynamodb = require("../dynamodb")(RED);
	var moment = require("moment");
	
    function getchartdataNode(config) {

		RED.nodes.createNode(this,config);

		// CCS接続用情報の取得
		const ccsConnectionConfigNode = RED.nodes.getNode(config.ccsConnectionConfig);

		// 検索条件の取得
		this.name = config.name;							// ノード名
		this.operation = "Query";							// 処理名
		
		this.TableName = config.tableName;					// 検索対象テーブル名
		this.Limit = config.limit;							// 検索件数
		this.ScanIndexForward = config.sort;				// 並び順
		
		this.dateCheck = config.dateCheck;					// 期間設定方法
		// this.sdatetime = config.sdatetime;					// 期間 開始期間
		// this.edatetime = config.edatetime;					// 期間 終了期間

		this.aggregationCheck = config.aggregationCheck;	// アグリゲーション設定の有無
		this.aggregation = config.aggregation;				// アグリゲーション操作
		this.aggreunit = config.aggreunit;					// アグリゲーション単位
		this.decimalPoint = config.decimalPoint;			// 表示桁数
		this.ExpressionAttributeValues = {					// 検索条件値
			":a": config.objectKey
		};

		// Limitチェック
		if (this.Limit == "" || this.Limit > MAX_LIMIT) {
			// 上限件数の指定がない or MAX_LIMITを超える値の場合はMAX_LIMIT件とする
			this.Limit = MAX_LIMIT;
		}
		
		// 繰り返し条件の取得
		this.repeatCheck = config.repeatCheck;
		this.repeat = config.repeat;
		var interval = null;

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

		var resultList;		// 取得結果を保存
		var node = this;
		
		// dynamodb接続設定
		var opts = dynamodb.cnctSetting(ccsConnectionConfigNode);

		// sendメッセージ関数作成
		node.sendMsg = function (data) {
			var msg;
			if (!data) {
				node.status({fill:"red", shape:"ring", text:"error"});
				node.error("error: sendMeg error");
				return;
			} else {
				msg = {payload: data};
			}
			node.send(msg);
		};

		// 繰り返し設定がされている場合は指定間隔で処理を繰り返す
		if (node.repeatCheck) {
			interval = setInterval( function() {
				dataGet(config.sdatetime, config.edatetime);
			}, node.repeat * 1000);	
		}
		
		// injectされたら実行
        node.on('input', function(msg) {

			if (node.dateCheck) {
				dataGet(msg.payload.sdatetime, msg.payload.edatetime);
			} else {
				dataGet(config.sdatetime, config.edatetime);
			}
			
		});

		// 処理終了時にはintervalをクリアする
		this.on('close', function() {
			if (interval != null) {
				clearInterval(interval);
			}
			if (node.done) {
				node.status({});
				node.done();
			}
		});
	

		// データ取得処理
		function dataGet (sdatetime, edatetime) {

			node.status({fill:"blue", shape:"dot", text:"connecting..."});
			
			if (sdatetime == null || sdatetime == "") {
				sdatetime = undefined
			}
			if (edatetime == null || edatetime == "") {
				edatetime = undefined
			}
			
			node.sdatetime = sdatetime;
			node.edatetime = edatetime;

			if (node.sdatetime == undefined || node.edatetime == undefined || moment(node.sdatetime) <= moment(node.edatetime)) {
				
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
								if (contentList[i].dataName === undefined) {
									seriesList.push(contentList[i].dataname);
								} else {
									seriesList.push(contentList[i].dataName);
								}
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
								if (contentList[i].dataName === undefined) {
									seriesList.push(contentList[i].dataname);
								} else {
									seriesList.push(contentList[i].dataName);
								}
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
						resultList = [body];

						try {
							if (resultList[0].data.length > 0) {
								node.status({fill:"green", shape:"dot", text:"completed"});
							} else {
								node.status({fill:"yellow", shape:"ring", text:"no data"});
							}
						} catch (e) {
							node.status({fill:"yellow", shape:"ring", text:"no data"});
						}
						node.sendMsg(resultList);
						
					} else if (body.Items != undefined && body.Items.length > -1) {
						node.status({fill:"yellow", shape:"ring", text:"no data"});
						node.sendMsg([]);
					} else {
						node.status({fill:"red", shape:"ring", text:"error: Data acquisition failure"});
						node.sendMsg([]);
					}

				});
			} else {
				node.status({fill:"red", shape:"ring", text:"error: Invalid period"});
				node.error("getchartdata - 期間指定に誤りがあります");
				node.sendMsg([]);
			}

		}
	}
	
	RED.nodes.registerType("getchartdata", getchartdataNode);
};
