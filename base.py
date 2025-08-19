'''
----- 構成 -----
【プログラム】

1. ユーザーのあいさつに対しての時間帯に合わせた挨拶
2. 明日の北九州市の天気予報
3. ゲーム３つ
4. 最後に一言

【流れ】
1:挨拶 ✅
    ・名前を取得
    ・時間帯に合わせて挨拶

2:天気 ✅
    ・確認したか、してないかを判定
        NO ➡明日の天気を表示
    YES ➡通過

3:ゲーム
    ・好きなゲームを選ばせる
        g1 : じゃんけん✅
        g2 : high & low ✅
        g3 : バトル✅
    3回勝負のゲームでユーザーと勝負
    ⇓
    ・ゲーム終了


4:最後
    ・結果の表示
    ・一言
    ・プログラムを終了させる
'''

########## 1.挨拶 ##########

# 名前を取得
print("初めまして、私の名前はチャットボット🤖です！！！")
user_name = input("あなたの名前は？")

# 今の時間を取得
from datetime import datetime
today = datetime.now()

# today.hourで今の時間を表示
# 朝：5 ~ 11　昼/夕方：12 ~ 18  夜/深夜：18 ~ 4(次の日)
if 0 <= today.hour <= 4:
    print(f'こんばんわ 😴 {user_name}さん')
elif 5 <= today.hour <= 11:
    print(f'おはようございます 🥱 {user_name}さん')
elif 11 < today.hour <= 18:
    print(f'こんにちは 🤗 {user_name}さん')
else:
    print(f'こんばんわ 😴 {user_name}さん')


########## 2.天気 ##########

# 参考
# URL : "https://qiita.com/sesame/items/93acd90803c8f9edfdfb"
# URL : "https://zenn.dev/singularity/articles/7e55da56f2b3b2"

# 1回1回書かないようにまとめて書く
import requests
from datetime import datetime, timedelta
import pytz
import collections
import time
import random # 各ゲームで使うため

''' 天気予報 '''

##### 関数 #####
# 関数名:get_tomorrow_weather_kitakyushu_grouped()
# 処理内容:　レスポンスで２なら明日の天気を表示する
# 引数:user_name
# 戻り値:なし
def get_tomorrow_weather_kitakyushu_grouped(user_name):
    """
    北九州市の明日の天気予報（天気、気温、湿度）を朝・昼・夜に分けて表示する関数
    """
    # OpenWeatherMap APIキー
    # あなたのAPIキーに置き換えてください。
    API_KEY = "0316430ef6f13a4594d43b18ed267985"

    # 北九州の座標 (緯度, 経度)
    lat = 33.8863
    lon = 130.8872

    # 5日間/3時間ごとの予報APIエンドポイント
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=ja"

    try:
        response = requests.get(url)
        response.raise_for_status()  # HTTPエラーがあれば例外を発生
        jsondata = response.json()

        # 'list' キーが存在するかどうかを確認
        if "list" not in jsondata:
            print("❌ エラー: APIレスポンスに予報データ（'list'キー）が含まれていませんでした。")
            print("APIキーが正しいか、リクエストが有効か確認してください。")
            return

        # 日本のタイムゾーンを設定
        jst = pytz.timezone('Asia/Tokyo')

        # 明日の日付を計算
        now_jst = datetime.now(jst)
        tomorrow_date = (now_jst + timedelta(days=1)).date()

        print(f"\n✨ {tomorrow_date.month}月{tomorrow_date.day}日 明日の北九州市の天気予報 ✨")

        weather_by_period = collections.defaultdict(list)

        for forecast in jsondata["list"]:
            forecast_utc_dt = datetime.strptime(forecast["dt_txt"], "%Y-%m-%d %H:%M:%S")
            forecast_jst_dt = pytz.utc.localize(forecast_utc_dt).astimezone(jst)

            if forecast_jst_dt.date() == tomorrow_date:
                hour = forecast_jst_dt.hour
                period = ""
                if 5 <= hour < 11:
                    period = "朝 🌅 "
                elif 11 <= hour < 18:
                    period = "昼 ☀️ "
                else:
                    period = "夜 🌙 "

                if period:
                    weather_by_period[period].append(forecast)

        if not weather_by_period:
            print("🌧️ 明日の天気予報データは見つかりませんでした。")
            return

        overall_min_temp = float('inf')
        overall_max_temp = float('-inf')

        periods_order = ["朝 🌅 ", "昼 ☀️ ", "夜 🌙 "]

        for period_label in periods_order:
            forecasts_for_period = weather_by_period[period_label]

            if not forecasts_for_period:
                continue

            print(f"\n--- {period_label}の予報 ---")

            period_temps = []
            period_humidities = []
            main_weather_descriptions = collections.defaultdict(int)

            for fc in forecasts_for_period:
                temp = fc["main"].get("temp")
                humidity = fc["main"].get("humidity")
                description = fc["weather"][0].get("description") if "weather" in fc and len(fc["weather"]) > 0 else "不明"

                if temp is not None:
                    period_temps.append(temp)
                    overall_min_temp = min(overall_min_temp, temp)
                    overall_max_temp = max(overall_max_temp, temp)
                if humidity is not None:
                    period_humidities.append(humidity)
                main_weather_descriptions[description] += 1

            # 温度
            if period_temps:
                avg_temp = sum(period_temps) / len(period_temps)
                min_p_temp = min(period_temps)
                max_p_temp = max(period_temps)
                print(f" 🌡️  平均気温: {avg_temp:.1f}°C (最低: {min_p_temp:.1f}°C, 最高: {max_p_temp:.1f}°C)")
            else:
                print(" 🌡️  気温データなし")

            # 湿度
            if period_humidities:
                avg_humidity = sum(period_humidities) / len(period_humidities)
                print(f" 💧  平均湿度: {avg_humidity:.1f}%")
            else:
                print(" 💧  湿度データなし")

            if main_weather_descriptions:
                most_common_weather = max(main_weather_descriptions, key=main_weather_descriptions.get)
                print(f" ☁️  天気: {most_common_weather}")
            else:
                print(" ☁️  天気の説明なし")

        if overall_min_temp != float('inf') and overall_max_temp != float('-inf'):
            print(f"\n--- 明日全体の気温 ---")
            print(f" ⬇️  明日の最低気温: {overall_min_temp:.1f}°C")
            print(f" ⬆️  明日の最高気温: {overall_max_temp:.1f}°C")

# 例外処理
    except requests.exceptions.RequestException as e:
        print(f"❌ 天気データの取得中にエラーが発生しました: {e}")
        print("インターネット接続やAPIキーが正しいか確認してください。")
    except ValueError as e:
        print(f"❌ JSONレスポンスのデコード中にエラーが発生しました: {e}")
    except Exception as e:
        print(f"❌ 予期せぬエラーが発生しました: {e}")


##### メインプログラム #####
print(f"ユーザー {user_name}さん！明日の天気はもう確認しましたか？")
print("確認済みなら「1」を、まだ確認していないのなら「2」を入力してください")

while True:
    try:
        user_response = int(input(">>>"))
        if user_response in [1, 2]: # in 演算子で簡潔
            break
        else:
            print("「1」と「2」以外は入力しないでください。")
    except ValueError:
        print("「1」と「2」以外は入力しないでください。")

# ここから関数を呼び出す
if user_response == 2:
    print("明日の北九州の天気をお知らせします。")
    get_tomorrow_weather_kitakyushu_grouped(user_name) # 天気予報を呼び出す
elif user_response == 1:
    print("素晴らしい！ありがとうございます！")

time.sleep(1)
print("\n--- ゲーム開始の準備 ---") # 見出し
print("次はいよいよゲームが始まります")
print("準備OKなら「はい」を入力してください！")

while True:
    print("準備はいいですか？")
    prepare = input(">>>").strip() # 入力値から空白を除去
    if prepare == "はい":
        print("👍 準備OKですね！ゲームを始めましょう！")
        break
    else:
        print(f"ゆっくりでいいですよ。{user_name}さんのペースで大丈夫です。")



########## 3. ゲーム ##########
print("これから3回、私とゲームをします。ルールは3回勝負して勝利数が多い方が勝ちです")
print("同じゲームを3回選択することも可能です！！")
time.sleep(1.5)
print(f'{user_name}さんの好きなゲームを選んで、数字を入力してください。')
print('１：じゃんけん')
print('２：HIGH & LOW')
print('３：ポケモンバトル')

user_victory_count = 0  # ユーザーの勝利数 (ゲーム全体)
bot_victory_count = 0   # ボットの勝利数 (ゲーム全体)


'''じゃんけんゲーム関数 '''
##### 関数 #####
# 関数名: janken()
# 処理内容:　レスポンスで1ならじゃんけんの関数を呼び出す
# 引数:user_name
# 戻り値: ユーザーが勝利：user | ボットが勝利：bot
def janken(user_name):
    print("\n--- じゃんけんが選ばれました ---")
    print("ルールを説明します。今回のじゃんけんは3回勝負です（あいこを除く）")
    print(f'最初に手を入力して、{user_name}さんから手を出します。')
    print("わたしはランダムに決めるので不正はないので安心してください。")
    print("出す手を入力するときは、「グー」「チョキ」「パー」の3つの中から入力してください。")
    print("先に2回勝った方が勝利です。")
    time.sleep(1.5)

    user_points = 0 # じゃんけん内のユーザー得点
    bot_points = 0  # じゃんけん内のボット得点
    
    # 手のイラスト辞書
    hand_illustrations = {
        "グー": "✊",
        "チョキ": "✌️", 
        "パー": "✋"
    }
    
    # 2勝するまで続けるループ
    while user_points < 2 and bot_points < 2:
        choise_list = ["グー", "チョキ", "パー"]
        
        # じゃんけんの演出
        print("\n" + "="*30)
        print("🎯 じゃんけんポン！ 🎯")
        print("="*30)
        
        while True: 
            try:
                time.sleep(1)
                user_choise = input(f'{user_name}さんの手：').strip() # 空白除去
                if user_choise not in choise_list:
                    raise ValueError # ここでValueErrorを意図的に発生
                break 
            except ValueError:
                print("⚠️ 「グー」「チョキ」「パー」のいずれかで入力してください。")

        # じゃんけんの結果
        bot_choise = random.choice(choise_list)
        
        # 演出付きで結果表示
        print(f"\n{user_name}さん: {hand_illustrations[user_choise]} {user_choise}")
        print(f"わたし: {hand_illustrations[bot_choise]} {bot_choise}")
        print("-" * 20)

        if user_choise == bot_choise:
            print("🤝 あいこです！もう一度！")
        # あいこ以外
        elif (user_choise == "グー" and bot_choise == "チョキ") or \
            (user_choise == "チョキ" and bot_choise == "パー") or \
            (user_choise == "パー" and bot_choise == "グー"):
            print(f'🎉 {user_name}さんの勝ち！WIN！🎉')
            user_points += 1
        else:
            print("🤖 わたしの勝ち！LOSE！🤖")
            bot_points += 1
        print(f'現在の得点: {user_name}さん {user_points}点 | わたし {bot_points}点\n')
        # ループで繰り返す

        # 勝敗判定とループ終了の確認
        if user_points >= 2 or bot_points >= 2:
            break # どちらかが2勝したらループを抜ける

# 最終結果
    print(f'\n--- じゃんけん結果 ---')
    print(f'{user_name}さんの最終得点：{user_points}点')
    print(f'わたしの最終得点：{bot_points}点')

    if user_points > bot_points:
        print(f'🏆 {user_name}さんのじゃんけん勝利です！WIN！🏆')
        return "user"
    else:
        print("🤖 わたしのじゃんけん勝利です！LOSE！🤖")
        return "bot"



''' HIGH & LOW '''
##### 関数 #####
# 関数名: high_low()
# 処理内容:　レスポンスで2ならじゃんけんの関数を呼び出す
# 引数:user_name
# 戻り値:ユーザーが勝利：user | ボットが勝利：bot
def high_low(user_name):
    print("\n--- HIGH & LOWが選ばれました ---")
    print("ルールを説明します。今回プレイする HIGH & LOW は普通のものとは少し違います")
    print(f'まず、私はディーラーです。{user_name}さんは宣言側です。')
    print("ルール１：1 ~ 13までの数字がランダムに6枚選ばれます（重複無し）。最初のカードが出され、残りの5枚で勝負します。よって、5回宣言する必要があります。")
    print("ルール２：最初に1枚目のカードが場に出るので、次のカードが1枚目のカードよりも大きい(HIGH)か小さい(LOW)か当ててください。的中できたら1ポイント獲得です。外した場合はディーラーに得点が入ります。")
    print("ルール３：宣言するときに HIGH(大きい)時は「h」、LOW(小さい)時は「l」と入力してください。")
    print("ルール４：最終的にポイントの多さで勝敗を決めます。")
    print("それでは、ゲームを始めましょう！！")
    print("準備ができたら「Y」と入力してください。ゲームが始まります。")
    print()

    while True:
        signal = input("準備OK? >>>").strip()
        if signal == "Y":
            break
        else:
            print("「Y」以外は入力しないでください。")

    user_point = 0
    bot_point = 0

    # カードの作成
    try:
        cards = random.sample(range(1, 14), 6)
    except ValueError as e:
        print(f"エラー: カードの準備中に問題が発生しました: {e}。ゲームを終了します。")
        return "bot"

    current_card = cards[0]
    print(f'\n🎴 最初のカード: {current_card} 🎴')
    print("=" * 30)

    for i in range(1, 6):
        next_card = cards[i]

        print(f'\n--- 第{i}回戦 ---')  # i = 1~5
        print(f'🃏 現在のカード: {current_card} 🃏')
        print(f'📊 残りカード数: {6-i}枚')
        print("-" * 20)
        
        # ユーザーが正しい「h」か「l」を入力するまで繰り返すループを追加
        while True: # 正しい入力があるまでループ
            user_answer = input(f'{user_name}さんの解答 (h: HIGH / l: LOW) >>>').strip().lower() # 入力をループ内に移動
            if user_answer in ["h", "l"]: # 有効な入力の場合
                break
            else: # 無効な入力の場合
                print("⚠️ 「h」または「l」のいずれかで入力してください。") 

        time.sleep(1)
        print(f'\n🎲 次のカードは... {next_card} でした！🎲')

        # 正解判定
        is_correct = False
        if user_answer == "h":
            if next_card > current_card:
                is_correct = True
        elif user_answer == "l":
            if next_card < current_card:
                is_correct = True
        
        if next_card == current_card:
            print("🤝 同じ数字でした！引き分けです。ポイントは入りません。")
            current_card = next_card
            continue

        # 結果の演出
        print("=" * 30)
        if is_correct:
            print("🎉 正解！ポイントゲット！！ 🎉")
            print("✨ 素晴らしい判断です！ ✨")
            user_point += 1
        else: 
            print("❌ 残念！不正解... ❌")
            print("💔 ディーラーの勝利！ 💔")
            bot_point += 1
        print("=" * 30)

        # 現時点での得点表示
        print(f'📈 現在の得点: {user_name}さん {user_point}点 | わたし {bot_point}点')
        current_card = next_card

# 最終結果
    print(f'\n--- HIGH & LOW 結果 ---')
    print(f'{user_name}さんの最終得点：{user_point}点')
    print(f'わたしの最終得点：{bot_point}点')

    if user_point > bot_point:
        print(f'🏆 おめでとうございます！{user_name}さんのHIGH & LOW勝利です！WIN！🏆')
        return "user"
    elif bot_point > user_point:
        print("🤖 残念でした。わたしのHIGH & LOW勝利です！LOSE！🤖")
        return "bot"
    else: 
        print("🤝 引き分けでした！")
        return "draw" # 引き分けの場合は "draw" を返す


''' ポケモンバトル '''
# 参考
# URL : https://qiita.com/yellow_detteiu/items/ff4894b04f247063e439
# URL : https://programming-mondai.com/top/python_top/l5-s2/
# URL : https://qiita.com/nakanosakaue_kunren/items/aebf17b0d1bc8d01137a
# クラス(設計図)を作成 
class Pokemon:
    def __init__(self, name, max_hp, attack, defense, skill_name, skill_effect):
        self.name = name # 名前
        self.max_hp = max_hp # 初期値
        self.current_hp = max_hp # バトルの時のHP
        self.attack = attack # 攻撃力
        self.defense = defense # 防御力
        self.skill_name = skill_name # スキル名
        self.skill_effect = skill_effect # エフェクト
        self.skill_used = False # スキルを一度使ったかどうかを示すフラグ
        self.is_defending = False # 防御の状態にあるかどうかを示すフラグ
        self.attack_multiplier = 1.0 # 攻撃力倍率 (かえんほうしゃ、10万ボルト用)
        self.is_guarding = False # 特殊ワザ「まもる」の効果で防御状態にあるかどうかを示すフラグ
        self.is_disabled = False # 行動不能状態（「かなしばり」などの効果）にあるかどうかを示すフラグ

##### 関数 #####
# 関数名: str()
# 処理内容: selfで受け取ったものを表示
# 引数:self
# 戻り値:表示結果
    def __str__(self):
        return (f"{self.name} (HP: {self.current_hp}/{self.max_hp}, "
                f"攻撃: {self.attack}, 防御: {self.defense})")

##### 関数 #####
# 関数名: take_damage()
# 処理内容: ポケモンがダメージを受けたときのHP計算と表示
# 引数:self, damage
# 戻り値:なし
    def take_damage(self, damage):
        # 防御状態であればダメージ半減
        if self.is_defending or self.is_guarding:
            print(f"{self.name} は防御している！ダメージが半減された！")
            damage = int(damage * 0.5)
            self.is_defending = False # 防御状態は1ターンで解除
            self.is_guarding = False # まもる状態も1ターンで解除

        effective_damage = max(0, damage - self.defense // 2) # 防御力でダメージ軽減
        self.current_hp -= effective_damage
        if self.current_hp < 0:
            self.current_hp = 0
        print(f"{self.name} は {effective_damage} のダメージを受けた！")
        print(f"残りHP: {self.current_hp}")

##### 関数 #####
# 関数名: attack_target()
# 処理内容:　ポケモンが相手に対して攻撃を行う際のロジックを定義⇒攻撃側のポケモンの能力と、防御側のポケモンの状態に基づいて、最終的なダメージを計算し、相手に適用するまでの一連の処理
# 引数:self, target
# 戻り値:なし
    def attack_target(self, target):
        damage = self.attack * self.attack_multiplier # 攻撃力倍率を適用
        
        # スキル効果による攻撃力補正をリセット（次の攻撃に影響を与えないように）
        self.attack_multiplier = 1.0

        target.take_damage(damage)

##### 関数 #####
# 関数名: defend()
# 処理内容:　「防御」コマンドを選択したときポケモンの防御状態をTrueにする
# 引数:self
# 戻り値:なし
    def defend(self):
        self.is_defending = True
        print(f"[{self.name}] は身を守っている！ガードアップ！⬆️")

##### 関数 #####
# 関数名: use_skill()
# 処理内容:　各ポケモンの持つ固有のワザとその効果を実行
# 引数:self, target, ally_pokemon, enemy_pokemon
# 戻り値:True | False
    # スキルの引数を簡素化し、targetのみに依存するように変更
    def use_skill(self, target): 
        if self.skill_used:
            print(f"[{self.name}] のワザ [{self.skill_name}] はすでに使用済みです！")
            return False

        print(f"[{self.name}] はワザ [{self.skill_name}] を使用した！")
        self.skill_used = True

        if self.skill_name == "かえんほうしゃ":
            self.attack_multiplier = 2.0
            print(f"[{self.name}] の炎が燃え上がった！🔥")
        elif self.skill_name == "ハイドロポンプ":
            target.take_damage(20) # 固定ダメージ
            print(f"[{target.name}] に水しぶきが襲いかかる！💧")
        elif self.skill_name == "まもる":
            self.is_guarding = True
            print(f"[{self.name}] は身を守った！次の攻撃は半減だ！🛡️")
        elif self.skill_name == "10万ボルト":
            self.attack_multiplier = 1.5 # クリティカルヒット
            print(f"[{self.name}] の電気が走り出す！⚡")
        elif self.skill_name == "かなしばり":
            target.is_disabled = True
            print(f"[{target.name}] はかなしばりで動けなくなった！😵")
        return True

##### 関数 #####
# 関数名: create_pokemon()
# 処理内容:　ポケモンの初期データを作成し、リストにする
# 引数:なし
# 戻り値:ポケモンのリスト
def create_pokemon():
    pokemon_list = {
        "リザードン": Pokemon("リザードン", 110, 30, 10, "かえんほうしゃ", "次の攻撃のダメージが2倍になる。"),
        "カメックス": Pokemon("カメックス", 100, 20, 25, "ハイドロポンプ", "相手に20の固定ダメージを与える。"),
        "フシギバナ": Pokemon("フシギバナ", 115, 22, 20, "まもる", "相手の次の攻撃ダメージを半減する。"),
        "ピカチュウ": Pokemon("ピカチュウ", 70, 35, 8, "10万ボルト", "次の攻撃が必ずクリティカルヒット（ダメージ1.5倍）になる。"),
        "ルカリオ": Pokemon("ルカリオ", 95, 28, 15, "かなしばり", "相手を1ターン行動不能にする。")
    }
    return pokemon_list

##### 関数 #####
# 関数名: battle()
# 処理内容:　メインロジック⇒ターン制のバトル進行、そして最終的な勝敗判定までの一連の流れ
# 引数:user_name
# 戻り値:ユーザーが勝利：user | ボットが勝利：bot
def battle(user_name):
    print("\n--- ポケモンバトルが選ばれました ---")
    print("⚔️ ポケモンを選んで、私とバトルしましょう！⚔️")
    time.sleep(1)

    all_pokemon = create_pokemon()

    # 各ポケモンの表示
    print("🎮 使用できるポケモン 🎮")
    print("=" * 50)
    for i, poke_name in enumerate(all_pokemon.keys()):
        poke = all_pokemon[poke_name]
        print(f"🔸 {i+1}: {poke.name}")
        print(f"   💚 HP: {poke.max_hp}, ⚔️ 攻撃力: {poke.attack}, 🛡️ 防御: {poke.defense}")
        print(f"   🎯 ワザ: [{poke.skill_name}] - {poke.skill_effect}")
        print("-" * 30)
    print("=" * 50)

    # ポケモンの選択
    player_pokemon = None
    while player_pokemon is None:
        try:
            choice = int(input(f'🎯 {user_name}さんのポケモンを番号でえらんでください: '))
            poke_name_list = list(all_pokemon.keys())
            if 1 <= choice <= len(poke_name_list):
                player_pokemon = all_pokemon[poke_name_list[choice - 1]]
                print(f"\n🎉 {user_name}さんは [{player_pokemon.name}] を選びました！🎉")
            else:
                print("⚠️ 無効な選択です。1から5の番号を入力してください。")
        except ValueError:
            print("⚠️ 無効な入力です。数字を入力してください。")

    available_bot_pokemon = {name: poke for name, poke in all_pokemon.items() if name != player_pokemon.name}
    bot_pokemon = random.choice(list(available_bot_pokemon.values()))
    print(f"🤖 ボットは [{bot_pokemon.name}] を出した！🤖\n")

    player_first = None
    # ユーザーに選択
    while player_first is None:
        turn_order_choice = input("⚔️ 先攻と後攻どちらにしますか？ (1:先攻, 2:後攻): ").strip()
        if turn_order_choice == "1":
            player_first = True
            print(f'⚡ {user_name}さんが先攻です！⚡')
        elif turn_order_choice == "2":
            player_first = False
            print("⚡ わたしが先攻です！⚡")
        else:
            print("⚠️ 無効な選択です。1か2を入力してください。")

    print("\n" + "="*50)
    print("⚔️ バトルスタート！⚔️")
    print("="*50)
    time.sleep(1.5)

    turn = 1
    while player_pokemon.current_hp > 0 and bot_pokemon.current_hp > 0:
        print(f"\n🎯 === ターン {turn} === 🎯")
        print(f"💚 {user_name}さんのポケモン: {player_pokemon.name} HP: {player_pokemon.current_hp}/{player_pokemon.max_hp}")
        print(f"🤖 わたしのポケモン: {bot_pokemon.name} HP: {bot_pokemon.current_hp}/{bot_pokemon.max_hp}")
        print("-" * 50)

        # ターン開始時に各ポケモンの状態をリセット
        player_pokemon.is_defending = False
        bot_pokemon.is_defending = False
        player_pokemon.is_guarding = False 
        bot_pokemon.is_guarding = False
        
        # 攻撃力倍率を各ターン開始時にリセット
        player_pokemon.attack_multiplier = 1.0
        bot_pokemon.attack_multiplier = 1.0
        
        action_order = [(player_pokemon, bot_pokemon), (bot_pokemon, player_pokemon)] if player_first else \
                        [(bot_pokemon, player_pokemon), (player_pokemon, bot_pokemon)]
        
        for attacker, defender in action_order:
            # どちらかのポケモンが倒れたらループを抜ける
            if player_pokemon.current_hp <= 0 or bot_pokemon.current_hp <= 0:
                break

            # 行動不能状態のチェックと解除
            if attacker.is_disabled:
                print(f"😵 [{attacker.name}] はかなしばりで動けない！😵")
                attacker.is_disabled = False # 1ターンで解除
                time.sleep(1)
                continue

            if attacker == player_pokemon:
                print(f"🎯 [{player_pokemon.name}] の攻撃！")
                action = ""
                # ユーザーが有効な入力をするまで繰り返す
                while True:
                    print("⚔️ どうしますか？")
                    print(" 🔸 1: 攻撃")
                    print(" 🛡️ 2: 防御")
                    if not player_pokemon.skill_used:
                        print(f" 🎯 3: 特殊ワザ [{player_pokemon.skill_name}]")
                        print(f"     - {player_pokemon.skill_effect}")
                    else:
                        print(" 🎯 3: 特殊ワザ (使用済み)") 

                    action = input("選択: ").strip()

                    if action == "1":
                        player_pokemon.attack_target(bot_pokemon)
                        break
                    elif action == "2":
                        player_pokemon.defend()
                        break
                    elif action == "3":
                        if player_pokemon.skill_used:
                            print("⚠️ このワザはもう使えない！他を選んでください。")
                        else:
                            player_pokemon.use_skill(bot_pokemon) # 引数を簡素化
                            break
                    else:
                        print("⚠️ 無効な選択です。1, 2, 3のいずれかを入力してください。")
            else: # ボットの行動フェーズ
                print(f"🤖 [{bot_pokemon.name}] の攻撃！")
                bot_action_options = ["attack", "defend"]
                if not bot_pokemon.skill_used:
                    bot_action_options.append("skill") 
                
                chosen_action = random.choice(bot_action_options)

                if chosen_action == "attack":
                    bot_pokemon.attack_target(player_pokemon)
                elif chosen_action == "defend":
                    bot_pokemon.defend()
                elif chosen_action == "skill":
                    bot_pokemon.use_skill(player_pokemon) 

            print("") 
            time.sleep(1.5)

        turn += 1

    print("\n" + "="*50)
    print("🏁 バトル終了！ 🏁")
    print("="*50)
    if player_pokemon.current_hp <= 0:
        print(f"😵 {user_name}さんの [{player_pokemon.name}] は倒れた！😵")
        print(f"🏆 わたしの [{bot_pokemon.name}] の勝利！LOSE！🏆")
        return "bot"
    else:
        print(f"😵 わたしの [{bot_pokemon.name}] は倒れた！😵")
        print(f"🏆 {user_name}さんの [{player_pokemon.name}] の勝利！WIN！おめでとう！🎉")
        return "user"


###### 3回勝負のメインループ #####
for i in range(3):
    print(f'\n--- 第{i + 1}回戦 ---')
    while True:
        try:
            game_number = int(input(f'{user_name}さん、{i + 1}番目のゲームを選んでください（1:じゃんけん, 2:HIGH & LOW, 3:ポケモンバトル）>>>'))
            if game_number in [1, 2, 3]:
                break
            else:
                print("⚠️ 入力値が間違えています。1, 2, 3のいずれかの数字を入力してください。")
        except ValueError:
            print("⚠️ 入力値が間違えています。数字を入力してください。")

    game_result = ""
    if game_number == 1:
        game_result = janken(user_name)   # 1⇒じゃんけん
    elif game_number == 2:
        game_result = high_low(user_name) # 2⇒high&low
    elif game_number == 3:
        game_result = battle(user_name)   # 3⇒バトル

# ゲーム全体の結果
    if game_result == "user":    # userが返ってきたらユーザーにポイント
        user_victory_count += 1
    elif game_result == "bot":   # botが返ってきたらボットにポイント
        bot_victory_count += 1
    
    print(f'\n--- 現在の戦績 ---')
    print(f'ユーザー {user_victory_count}勝 : ボット {bot_victory_count}勝')
    time.sleep(2)


########## 4. 最後の一言 #########

print("\n--- ゲーム終了！結果発表 ---")
print(f'{user_name}さん {user_victory_count}勝 : わたし {bot_victory_count}勝 ')

if user_victory_count > bot_victory_count:
    print(f'おめでとうございます！🎊 {user_name}さんの勝利です！！')
elif bot_victory_count > user_victory_count:
    print("残念でした！今回はわたしの勝ちでした！🤖")
else:
    print("引き分けですね！どちらも素晴らしい戦いでした！👏")

print("\n今日のゲームはここまでです。いかがでしたか？")
print("また遊んでくれると嬉しいです。それではまたね！👋")
