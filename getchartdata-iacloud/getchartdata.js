
module.exports = function(RED) {

	const MAX_LIMIT = 10000;			// 最大取得件数

	/* 使用モジュール定義 */
	var dynamodb = require("../dynamodb")(RED);
	var moment = require("moment");

    function getchartdataNode(config) {

		RED.nodes.createNode(this,config);

		var node = this;

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
		var params;
		try {
			// params = JSON.parse(config.params);
			if (config.params != undefined) {
				params = config.params;
			} else {
				params = [];
			}
		} catch (e) {
			params = [];
		}

		var outSeriesList = [];
		params.forEach (function (object) {
			outSeriesList.push(object.dataName);
		});
		var resultList;		// 取得結果を保存

		// dynamodb接続設定
		var opts = dynamodb.cnctSetting(ccsConnectionConfigNode);

		// sendメッセージ関数作成
		node.sendMsg = function (data) {
			var msg;
			if (!data) {
				node.status({fill:"red", shape:"ring", text:"runtime.error"});
				node.error("error: sendMeg error");
				return;
			} else {
				msg = {payload: data};
			}
			node.send(msg);
		};

		// no rule found
        if (params.length === 0) {
			node.status({fill:"yellow", shape:"ring", text:"runtime.noParam"});
			node.sendMsg([]);
		} else {
			node.status({});
		}

		// 繰り返し設定がされている場合は指定間隔で処理を繰り返す
		if (node.repeatCheck) {
			interval = setInterval( function() {
				if (params.length > 0) {
					dataGet(config.sdatetime, config.edatetime);
				}
			}, node.repeat * 1000);
		}

		// injectされたら実行
        node.on('input', function(msg) {
			if (node.dateCheck) {
				if (params.length > 0) {
					dataGet(msg.payload.sdatetime, msg.payload.edatetime);
				}
			} else {
				if (params.length > 0) {
					dataGet(config.sdatetime, config.edatetime);
				}
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

			node.status({fill:"blue", shape:"dot", text:"runtime.connect"});
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
				dynamodb.dynamoRequest(opts, node, function(result) {

					if (result.status === "ok") {
						// 正常なレスポンス
						var items = result.data.Items;
						var tmpObj = {};
						if (items != undefined && items.length > 0) {
							try {
								var itemList;						// 出力データ一時保存
								var contentList = [];				//  出力データ項目部分作成

								tmpObj.series = [];                   // 出力データ：項目部分
								tmpObj.data = [];                     // 出力データ：データ部分
								tmpObj.labels= [""];                  // 出力データ：ラベル部分

								// アグリゲーション処理あり
								if (node.aggregationCheck == true && items != undefined) {

									// アグリゲーションデータ
									resultList = dynamodb.aggregation(items, node);

									// 桁数変更処理
									if (node.decimalPoint != "noexe") {
										resultList = dynamodb.round(resultList, node);
									}

									itemList = resultList;
									delete items;
									var noDataNameFlag = false;
									var seriesList = [];

									for (var itemIdx=0;itemIdx<itemList.length;itemIdx++) {
										// 変換データ取得
										try {
											contentList = itemList[itemIdx].contentData;
										} catch (e) {
											node.error("getChartdata：変換対象データがありません。");
										}

										for(i=0;i < contentList.length;i++) {
											if (contentList[i].dataName != undefined && seriesList.indexOf(contentList[i].dataName) < 0) {
												// 現在見ているデータにdataNameがある かつ seriesListに今回のdataNameがまだ格納されていない場合、seriesListに格納
												seriesList.push(contentList[i].dataName);
											} else if (contentList[i].dataname != undefined && seriesList.indexOf(contentList[i].dataname) < 0) {
												// 現在見ているデータにdatanameがある かつ seriesListに今回のdatanameがまだ格納されていない場合、seriesListに格納
												seriesList.push(contentList[i].dataname);
											} else if (contentList[i].dataName != undefined && contentList[i].dataname != undefined) {
												noDataNameFlag = true;
											}
										}
									}

									if (noDataNameFlag) {
										node.error("getChartdata：dataNameが存在しない項目がありました");
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

											var matchData = params.filter(function(item, index){
												if (item.dataName == outSeriesList[i]) return true;
											});
											if (matchData.length > 0 && matchData[0].displayName != "") {
												tmpObj.series.push(matchData[0].displayName);
											} else {
												tmpObj.series.push(outSeriesList[i]);
											}

											seriesCombList.push(combTmp);
										}
									}

									// 出力データ：データ部分作成
									for(i=0;i < seriesCombList.length;i++) {    // 表示対象データでループ
										var dataTmp = [];
										for(j=0;j < itemList.length;j++) {  //データ件数でループ
											var timestamp;

											// timeStamp(timestamp)を格納
											if (itemList[j].timeStamp != undefined) {
												timestamp = itemList[j].timeStamp;
											} else if (itemList[j].timestamp != undefined) {
												timestamp = itemList[j].timestamp;
											} else {
												console.log("timeStamp(timestamp)が無効\n");
												continue;
											}

											var contentList = itemList[j].contentData;

											var matchData;
											// 格納対象のdataNameがあるデータのみをpushする
											matchData = contentList.filter(function(item, index){
												if (item.dataName == seriesCombList[i].dataName) return true;
											});
											// datanameの可能性もあるのでマッチデータがない場合は再度フィルター
											if (matchData.length == 0) {
												matchData = contentList.filter(function(item, index){
													if (item.dataname == seriesCombList[i].dataName) return true;
												});
											}

											if (matchData.length > 0) {
												// x:timestamp, y:dataValue
												try {
													var pushTmp = {
														"x" : timestamp,
														"y" : matchData[0].dataValue
													};
												}catch (e) {
													var pushTmp = {
														"x" : timestamp,
														"y" : null
													};
												}
												dataTmp.push(pushTmp);

											}
										}
										tmpObj.data.push(dataTmp);
									}

								// アグリゲーション処理なし
								} else if (node.aggregationCheck == false && items != undefined) {

									// 生データ
									resultList = tmpObj;
									resultList.Items = items;

									// 桁数変更処理
									if (node.decimalPoint != "noexe") {
										resultList = dynamodb.round(resultList, node);
									}

									itemList = resultList.Items;
									delete resultList.Items;
									var noDataNameFlag = false;
									var seriesList = [];

									for (var itemIdx=0;itemIdx<itemList.length;itemIdx++) {
										// 変換データ取得
										try {
											if (itemList[itemIdx].dataObject.objectContent != undefined) {
												contentList = itemList[itemIdx].dataObject.objectContent.contentData;
											} else if (itemList[itemIdx].dataObject.ObjectContent != undefined) {
												contentList = itemList[itemIdx].dataObject.ObjectContent.contentData;
											} else {
												continue;
											}
										} catch (e) {
											node.error("getChartdata：変換対象データがありません。");
										}

										for(i=0;i < contentList.length;i++) {
											if (contentList[i].dataName != undefined && seriesList.indexOf(contentList[i].dataName) < 0) {
												// 現在見ているデータにdataNameがある かつ seriesListに今回のdataNameがまだ格納されていない場合、seriesListに格納
												seriesList.push(contentList[i].dataName);
											} else if (contentList[i].dataname != undefined && seriesList.indexOf(contentList[i].dataname) < 0) {
												// 現在見ているデータにdatanameがある かつ seriesListに今回のdatanameがまだ格納されていない場合、seriesListに格納
												seriesList.push(contentList[i].dataname);
											} else if (contentList[i].dataName != undefined && contentList[i].dataname != undefined) {
												noDataNameFlag = true;
											}
										}
									}
									if (noDataNameFlag) {
										node.error("getChartdata：dataNameが存在しない項目がありました");
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

											var matchData = params.filter(function(item, index){
												if (item.dataName == outSeriesList[i]) return true;
											});

											if (matchData.length > 0 && matchData[0].displayName != "") {
												tmpObj.series.push(matchData[0].displayName);
											} else {
												tmpObj.series.push(outSeriesList[i]);
											}
											seriesCombList.push(combTmp);
										}
									}

									// 出力データ：データ部分作成
									for(i=0;i < seriesCombList.length;i++) {    // 表示対象データでループ
										var dataTmp = [];
										for(j=0;j < itemList.length;j++) {  //データ件数でループ
											var timestamp;

											// timeStamp(timestamp)を格納
											if (itemList[j].dataObject.timeStamp != undefined) {
												timestamp = itemList[j].dataObject.timeStamp;
											} else if (itemList[j].dataObject.timestamp != undefined) {
												timestamp = itemList[j].dataObject.timestamp;
											} else {
												console.log("timeStamp(timestamp)が無効\n");
												continue;
											}

											var contentList;
											if (itemList[j].dataObject.objectContent != undefined) {
												contentList = itemList[j].dataObject.objectContent.contentData;
											} else if (itemList[j].dataObject.ObjectContent != undefined) {
												contentList = itemList[j].dataObject.ObjectContent.contentData;
											} else {
												continue;
											}
											var matchData;
											// 格納対象のdataNameがあるデータのみをpushする
											matchData = contentList.filter(function(item, index){
												if (item.dataName == seriesCombList[i].dataName) return true;
											});
											// datanameの可能性もあるのでマッチデータがない場合は再度フィルター
											if (matchData.length == 0) {
												matchData = contentList.filter(function(item, index){
													if (item.dataname == seriesCombList[i].dataName) return true;
												});
											}

											if (matchData.length > 0) {
												// x:timestamp, y:dataValue
												try {
													var pushTmp = {
														"x" : timestamp,
														"y" : matchData[0].dataValue
													};
												}catch (e) {
													var pushTmp = {
														"x" : timestamp,
														"y" : null
													};
												}
												dataTmp.push(pushTmp);

											}
										}
										tmpObj.data.push(dataTmp);
									}
								}
								resultList = [tmpObj];

								try {
									if (resultList[0].data.length > 0) {
										node.status({fill:"green", shape:"dot", text:"runtime.complete"});
									} else {
										node.status({fill:"yellow", shape:"ring", text:"runtime.noData"});
									}
								} catch (e) {
									node.status({fill:"yellow", shape:"ring", text:"runtime.noData"});
								}
								node.sendMsg(resultList);
							} catch (e) {
								// データ取得時に例外発生
								console.log("データ分解時に例外発生");
								node.status({fill:"red", shape:"ring", text:"runtime.faild"});
								node.sendMsg([]);
							}
						} else if (items != undefined && items.length > -1) {
							node.status({fill:"yellow", shape:"ring", text:"runtime.noData"});
							node.sendMsg([]);
						} else {
							node.status({fill:"red", shape:"ring", text:"runtime.faild"});
							node.sendMsg([]);
						}
					} else {
						// 異常なレスポンス
						node.status({fill:"red", shape:"ring", text:"runtime.faild"});
						node.sendMsg([]);
					}
				});
			} else {
				node.status({fill:"red", shape:"ring", text:"runtime.periodError"});
				node.error("getchartdata - 期間指定に誤りがあります");
				node.sendMsg([]);
			}
		}
	}
	RED.nodes.registerType("getchartdata", getchartdataNode);
};
