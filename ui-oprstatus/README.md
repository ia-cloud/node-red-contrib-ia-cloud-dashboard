# node-red-contrib-ia-cloud-output - ui_oprstatus

## 名称
dashboard - oprStatusノード


## 機能概要

「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノードです。  
稼働状況グラフを表示します。  




## 入力メッセージ
この関数を利用する際には、ノード前にクエリを作成し  
プロパティ内で入力値に設定したものに対応した入力パラメータを入力します。  
「ノード：[dynamodb-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-output/tree/master/dynamodb-iacloud)」、 「ノード：[json2inchart-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-output/tree/master/json2inchart-iacloud)」からの出力を直接本ノードに入力して使用することが可能です。 

- ### json2inchartからの出力
  json2inchartからの出力を入力する場合は、  
  入力値で「json2inchartからの出力」を指定します。  
  以下に入力データの例を示します。  

        [
            {
                "series": [
                    "DI-1"
                ],
                "data": [
                    [
                        {
                            "x": "2017-10-16T00:50:00+09:00",
                            "y": false
                        },
                        {
                            "x": "2017-10-16T00:51:00+09:00",
                            "y": false
                        },
                        {
                            "x": "2017-10-16T00:52:00+09:00",
                            "y": true
                        },
                        {
                            "x": "2017-10-16T01:53:00+09:00",
                            "y": true
                        },
                        {
                            "x": "2017-10-16T01:54:00+09:00",
                            "y": false
                        }
                    ]
                ],
                "labels": [
                    ""
                ]
            }
        ]


- ### 基本フォーマットデータ
直接変換対象データを入力する場合は、  入力値で  
「基本フォーマットデータ」を指定し、item内に項目名を入力します。   
以下に例を示します。  

        [
            ["2017-10-16T08:10:00+09:00", 0],
            ["2017-10-16T08:11:00+09:00", 0],
            ["2017-10-16T08:12:00+09:00", 1],
            ["2017-10-16T08:13:00+09:00", 1],
            ["2017-10-16T08:14:00+09:00", 1]
        ]



## プロパティー

変換するデータに応じて、以下のパラメータを設定します。

- ### 入力値
  入力するデータの種類を設定します。  
  　・json2inchartからの出力  
  　・基本フォーマットデータ  

- ### グループ名
  結果を出力するダッシュボードグループを設定します。

- ### サイズ
  結果出力時のテーブルサイズを設定します。

- ### ラベル
  ダッシュボード上での表示名を設定します。

- ### 項目名
  基本フォーマットデータ入力時に指定します。  
  データ表示時の項目名を入力します。  
  例：制御盤A

- ### 項目詳細
  各指定値毎に表示する色、状態名を指定します  
  例：表示色 -> グレー、指定値 -> 0、状態名 -> 正常停止

- ### ノード名
  フロー上で表示するノード名を設定します。

## 出力メッセージ
ダッシュボード上に入力パラメータに応じた稼働状況グラフが出力されます。
※各項目詳細設定に記載のない値が入力された場合、該当部分のグラフは描画されません。
