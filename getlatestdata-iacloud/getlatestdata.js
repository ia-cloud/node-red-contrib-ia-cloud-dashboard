
module.exports = function(RED) {

	/* 使用モジュール定義 */
	var dynamodb = require("../dynamodb")(RED);

    function getlatestdataNode(config) {
		
		RED.nodes.createNode(this,config);

		// dynamoDB接続用情報の取得
		this.userID = this.credentials.userID;
		this.password = this.credentials.password;
		
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
		var outSeriesList;
		try {
			outSeriesList = JSON.parse(config.seriesObject);
		} catch (e) {
			outSeriesList = {};
		}

		this.item = config.item;						// 出力データの構成設定
		var node = this;

		// dynamodb接続設定
		var opts = dynamodb.cnctSetting(node.userID, node.password);

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
				dataGet();
			}, node.repeat * 1000);	
		}
		
		// injectされたら実行
        node.on('input', function() {
			dataGet();
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

			node.status({fill:"blue", shape:"dot", text:"connecting..."});
			
			// DynamoDBパラメータの作成
			opts = dynamodb.serviceSetting (opts, node);

			// DynamoDBへリクエスト
			dynamodb.dynamoRequest(opts, node, function(body) {
			var i, j;

				if (body.Items != undefined && body.Items.length > 0) {
	
					var ItemList;						// 出力データ一時保存
					var contentList;					// contentData一時格納用
					resultList = body;					// 結果出力配列に一時的にbodyを入力
	
					// 桁数変更処理
					if (node.decimalPoint != "noexe") {
						resultList = dynamodb.round(resultList, node);
					}
					
					ItemList = resultList.Items;
					delete resultList.Items;
					resultList = [];
				
					// 出力データ：項目部分抽出
					if (ItemList[0].dataObject.objectContent != undefined) {
						contentList = ItemList[0].dataObject.objectContent.contentData;
					} else if (ItemList[0].dataObject.ObjectContent != undefined) {
						contentList = ItemList[0].dataObject.ObjectContent.contentData;
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
								node.status({fill:"green", shape:"dot", text:"completed"});
								resultList.push(contentList[j].dataValue);
							} else {
								// 見つからなかった場合
								node.status({fill:"yellow", shape:"ring", text:"no data"});
								resultList.push(null);
							}
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
								if (contentList[j].unit != undefined) {
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
								node.status({fill:"green", shape:"dot", text:"completed"});
								resultList.push(tempAry);
							} else {
								// 見つからなかった場合
								tempAry = [null, null, null];
	
								node.status({fill:"yellow", shape:"ring", text:"no data"});
								resultList.push(tempAry);
							}
						}
						
					} else {
						node.error("getLatestdata - 指定条件のデータが見つかりませんでした");
						node.status({fill:"red", shape:"ring", text:"error: Data acquisition failure"});
						resultList = [];
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
		}
	}

	RED.nodes.registerType("getlatestdata", getlatestdataNode, {
        credentials: {
            userID: {type:"text"},
            password: {type: "password"}
        }
    });

};