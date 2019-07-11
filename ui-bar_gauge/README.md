# node-red-contrib-ia-cloud-output - ui_bar_gauge


## 名称
dashboard - bar_gaugeノード


## 機能概要
「ノード：[node-red-contrib-dashboard](https://github.com/node-red/node-red-dashboard)」内のウィジェット追加方法[[Creating New Dashboard Widgets](https://github.com/node-red/node-red-dashboard/wiki/Creating-New-Dashboard-Widgets)]を参考に実装したノードです。  
「最小値」「最大値」を設定し、カラーピッカーで「色」を選択し、ダッシュボード上にバーグラフのように表示をします。 


## 入力メッセージ
入力メッセージを`msg.payload`から入力します。

        [
            1120
        ]


## プロパティ
変換するデータに応じて、以下のパラメータを設定します。

| 名称(ja) | 名称(en-US) | 型 | 説明 |
|:-|:-|:-:|:-|
|グループ|Group|dashborad group|結果を出力するダッシュボードグループを設定します。|
|サイズ|Size|number x number|ダッシュボード上に表示するサイズを設定します。|
|向き|Direction|string|ダッシュボード上に表示するグラフの向きを設定します。<br>プルダウンで「縦(Vertical)」、「横(Horizontal)」を選択できます。|
|ラベル|Label|string|ダッシュボード上に表示されるラベルを設定します。|
|単位|Units|string|ダッシュボード上に表示される単位を設定します。|
|範囲 (最小値, 最大値)|Ragne (min, max)|number, number|表示するグラフの範囲を最小値と最大値で設定します。|
|色|Color|color picker|ダッシュボードに表示するグラフの色をカラーピッカーで選択できます。|
|名前|Name|string|フローエディタ上で表示される名前を設定します。|


## 出力メッセージ
なし。  
ダッシュボード上に、設定したプロパティに応じたバーゲージが出力されます。
