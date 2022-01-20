
module.exports = function(RED) {

	/* 使用モジュール定義 */
	var dynamodb = require("../dynamodb")(RED);

    function getlatestdataNode(config) {

		RED.nodes.createNode(this,config);

		var node = this;

		// CCS接続用情報の取得
		const ccsConnectionConfigNode = RED.nodes.getNode(config.ccsConnectionConfig);

		// 検索条件の取得
		this.name = config.name;							// ノード名
		this.operation = "Query";							// 処理名

		this.TableName = config.tableName;					// 検索対象テーブル名
		this.Limit = 1;										// 検索件数
		this.ScanIndexForward = "false";					// 並び順

		this.decimalPoint = config.decimalPoint;			// 表示桁数
		this.KeyConditionExpression = "objectKey = :a";		// 検索条件
		this.ExpressionAttributeValues = {					// 検索条件値
			":a": config.objectKey
		};

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
			outSeriesList.push(object);
		});

		this.item = config.item;						// 出力データの構成設定

		// dynamodb接続設定
		var opts = dynamodb.cnctSetting(ccsConnectionConfigNode);

		// sendメッセージ関数作成
		node.sendMsg = function (data) {
			var msg;
			if (data == []) {
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
					dataGet();
				}
			}, node.repeat * 1000);
		}

		// injectされたら実行
        node.on('input', function() {
			if (params.length > 0) {
				dataGet();
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


		function dataGet () {
			node.status({fill:"blue", shape:"dot", text:"runtime.connect"});
			// DynamoDBパラメータの作成
			opts = dynamodb.serviceSetting (opts, node);
			// DynamoDBへリクエスト
			dynamodb.dynamoRequest(opts, node, function(result) {
				var i, j;
				if (result.status === "ok") {
					// 正常なレスポンス
					var items = result.data.Items;
					if (items != undefined && items.length > 0) {
						try {
							var itemList;						// 出力データ一時保存
							var contentList;					// contentData一時格納用
							resultList = result.data;					// 結果出力配列に一時的にresultを入力
							// 桁数変更処理
							if (node.decimalPoint != "noexe") {
								resultList = dynamodb.round(resultList, node);
							}

							itemList = resultList.Items;
							delete resultList.Items;
							resultList = [];

							// 出力データ：項目部分抽出
							if (itemList[0].dataObject.objectContent != undefined) {
								contentList = itemList[0].dataObject.objectContent.contentData;
							} else if (itemList[0].dataObject.ObjectContent != undefined) {
								contentList = itemList[0].dataObject.ObjectContent.contentData;
							} else {
								console.log("objectContent(ObjectContent)が無効\n");
							}
							if (contentList != undefined && node.item == "graphData") {
								// 一次元配列
								for (i=0; i<outSeriesList.length; i++) {
									for (j=0; j<contentList.length; j++) {
										if (outSeriesList[i].dataName == contentList[j].dataName) {
											break;
										} else if (outSeriesList[i].dataName == contentList[j].dataname) {
											break;
										}
									}
									if (j < contentList.length) {
										// 見つかった場合
										resultList.push(contentList[j].dataValue);
									} else {
										// 見つからなかった場合
										resultList.push(null);
									}
									node.status({fill:"green", shape:"dot", text:"runtime.complete"});
								}
							} else if (contentList != undefined && node.item == "numericData") {
								// 二次元配列
								var tempAry;							// 一時保存用配列
								
								for (i=0; i<outSeriesList.length; i++) {
									for (j=0; j<contentList.length; j++) {
										if (outSeriesList[i].dataName == contentList[j].dataName) {
											break;
										} else if (outSeriesList[i].dataName == contentList[j].dataname) {
											break;
										}
									}
									if (j < contentList.length) {
										// 見つかった場合
										tempAry = [];

										// 表示名が設定されている場合は表示名をtempAryへ格納
										if (outSeriesList[i].displayName != "") {
											tempAry.push(outSeriesList[i].displayName);
										} else {
											tempAry.push(outSeriesList[i].dataName);
										}

										// dataValueをtempAryへ格納
										if (contentList[j].dataValue != undefined) {
											tempAry.push(contentList[j].dataValue);
										} else {
											tempAry.push(null);
										}

										// 単位をtempAryへ格納
										if (contentList[j].unit != undefined) {
											tempAry.push(contentList[j].unit);
										} else {
											tempAry.push(null);
										}
										resultList.push(tempAry);
									} else {
										// 見つからなかった場合
										tempAry = [null, null, null];
										resultList.push(tempAry);
									}
								}
								node.status({fill:"green", shape:"dot", text:"runtime.complete"});
							} else {
								node.error("getLatestdata - 指定条件のデータが見つかりませんでした");
								node.status({fill:"red", shape:"ring", text:"runtime.faild"});
								resultList = [];
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
		}
	}
	RED.nodes.registerType("getlatestdata", getlatestdataNode);
};
