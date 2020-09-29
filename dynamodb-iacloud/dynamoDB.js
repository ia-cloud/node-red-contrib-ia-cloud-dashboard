
module.exports = function(RED) {

	const MAX_LIMIT = 10000;			// 最大取得件数

	/* 使用モジュール定義 */
	var dynamodb = require("../dynamodb")(RED);
	var moment = require("moment");

	function dynamodbNode(config) {

		RED.nodes.createNode(this,config);

		// CCS接続用情報の取得
		const ccsConnectionConfigNode = RED.nodes.getNode(config.ccsConnectionConfig);

		// 検索条件の取得
		this.name = config.name;							// ノード名
		this.operation = config.operation;					// 処理名

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
		this.FilterExpression = "objectKey = :a";
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

		var resultList;										// 取得結果格納用配列
		var node = this;

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

			node.status({fill:"blue", shape:"dot", text:"runtime.connect"});

			if (sdatetime == null || sdatetime == "") {
				sdatetime = undefined
			}
			if (edatetime == null || edatetime == "") {
				edatetime = undefined
			}

			node.sdatetime = sdatetime;
			node.edatetime = edatetime;

			// sdatetime, edatetime共に入力あり かつ sdatetime<=edatetimeの場合に処理続行
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
						if (items != undefined && items.length > 0) {
							try {
								// アグリゲーション処理
								if (node.aggregationCheck) {
									resultList = dynamodb.aggregation(items, node);
								} else {
									resultList = items;
								}

								// 桁数変更処理
								if (node.decimalPoint != "noexe") {
									resultList = dynamodb.round(resultList, node);
								}
								node.status({fill:"green", shape:"dot", text:"runtime.complete"});
								// Itemsで囲ってから送信
								node.sendMsg({"Items": resultList});
								// node.sendMsg(resultList);
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
				node.error("DynamoDB - 期間指定に誤りがあります");
				node.sendMsg([]);
			}
		}

	}

	RED.nodes.registerType("dynamoDB", dynamodbNode);
};
