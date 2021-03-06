# node-red-contrib-ia-cloud-dasshboard - ui_table

## 名称
dashboard - tableノード


## 機能概要

「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノードです。  
テーブルを表示します。 



## 入力メッセージ
この関数を利用する際には、ノード前にクエリを作成し  
プロパティ内で入力値に設定したものに対応した入力パラメータを入力します。  
「ノード：[getChartdata-iacloud](https://github.com/ia-cloud/node-red-contrib-ia-cloud-dashboard/tree/master/getchartdata-iacloud)」からの出力を直接本ノードに入力して使用することも可能です。

- ### getChartdata
  getChartdataからの出力を入力する場合は、入力値で「getChartdata」を指定します。  
  以下に例を示します。 

        [
            {
                "series": [ "CPU温度", "CPU使用率", "空きメモリ量" ],
                "data": [
                    [ { x: "2017-10-16T08:18:12.477214+09:00", y: 35.938 },
                    { x: "2017-10-16T08:17:42.476071+09:00", y: 35.938 },
                    { x: "2017-10-16T08:17:12.476207+09:00", y: 35.399 } ],
                    [ { x: "2017-10-16T08:18:12.477214+09:00", y: 0 },
                    { x: "2017-10-16T08:17:42.476071+09:00", y: 0 },
                    { x: "2017-10-16T08:17:12.476207+09:00", y: 0 } ],
                    [ { x: "2017-10-16T08:18:12.477214+09:00", y: 500.3 },
                    { x: "2017-10-16T08:17:42.476071+09:00", y: 499.92 },
                    { x: "2017-10-16T08:17:12.476207+09:00", y: 500.092 } ],
                ],
                labels: [ "" ]
            }
        ]


- ### フォーマットデータ
直接変換対象データを入力する場合は、入力値で基本フォーマットデータ」を指定し、項目名を入力します。   
以下に例を示します。  

        [
            ["2017-10-16T08:18:12.477214+09:00",35.938,0],
            ["2017-10-16T08:17:42.476071+09:00",35.938,0],
            ["2017-10-16T08:17:12.476207+09:00",35.399,0],
            ["2017-10-16T08:16:42.476268+09:00",36.476,0],
            ["2017-10-16T08:16:12.485345+09:00",35.399,0]
        ]



## プロパティー

変換するデータに応じて、以下のパラメータを設定します。

- ### グループ名
  結果を出力するダッシュボードグループを設定します。

- ### サイズ
  結果出力時のテーブルサイズを設定します。

- ### ラベル
  ダッシュボード上での表示名を設定します。

- ### 入力値
  入力するデータの種類を設定します。  
  　・dynamoDB  
  　・getChartdata  
  　・フォーマットデータ  
  
- ### contentType
  入力データによって扱うことができるia-cloudオブジェクトが異なります。  
  今回入力するia-cloudオブジェクトのタイプを設定します。  
  
- ### 項目名
  入力値にフォーマットデータを指定した場合、テーブル上部に表示する項目名を設定します。
  例：列名A,列名B,列名C

- ### 名前
  フロー上で表示するノード名を設定します。

## 出力メッセージ
ダッシュボード上に入力パラメータに応じたテーブルが出力されます。
