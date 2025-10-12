# ファイル構造
```
OmniTCGSim/
├── src/
│   ├── assets/          //
│   ├── components/      // 再利用可能なUIコンポーネント
│   │   ├── layout/MainLayout.tsx
│   │   ├── CardEditModal.tsx
│   │   ├── CardViewModal.tsx 💡
│   │   ├── DataImportExportDialog.tsx
│   │   ├── FlippableCard.tsx 💡
│   │   ├── Navbar.tsx
│   │   ├── OpenerCard.tsx
│   │   ├── PackCardList.tsx
│   │   ├── PackOpeningAnimation.tsx 💡
│   │   ├── PackPreviewCard.tsx
│   │   └── RarityEditModal.tsx
│   ├── pages/           // 各ページのレイアウト，コンポーネントの配置
│   │   ├── CardPoolPage.tsx
│   │   ├── DeckEditPage.tsx
│   │   ├── DeckListPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── PackEditPage.tsx
│   │   ├── PackListPage.tsx
│   │   ├── PackOpenerPage.tsx
│   │   └── SettingsPage.tsx
│   ├── feartures/       // 機能とUIの統合
│   │   ├── card-pool/
│   │   │   ├── hooks/useCardPool.ts
│   │   │   ├── hooks/useCardPoolDisplay.ts
│   │   │   └── CardPoolManager.tsx
│   │   ├── deck-management/
│   │   │   ├── hooks/useDeckList.ts
│   │   │   ├── hooks/useDeckEditor.ts
│   │   │   ├── DeckEditor.tsx
│   │   │   └── DeckListManager.tsx
│   │   ├── pack-management/
│   │   │   ├── hooks/useCardCsvIO.ts
│   │   │   ├── hooks/usePackData.ts
│   │   │   ├── hooks/usePackEdit.ts
│   │   │   ├── hooks/usePackForm.ts
│   │   │   ├── hooks/useRarityEditor.ts
│   │   │   ├── PackListDisplay.tsx 💡
│   │   │   └── PackManager.tsx
│   │   └── pack-opening/
│   │       ├── hooks/usePackOpenerData.ts
│   │       ├── PackOpener.tsx
│   │       └── PackOpeningHandler.tsx 💡
│   ├── services/        // UIに依存しない再利用可能なビジネスロジック
│   │   ├── card-pool/
│   │   │   └── cardPoolService.ts
│   │   ├── currency/
│   │   │   └── currencyService.ts
│   │   ├── database     // IndexedDB (Dexie.js) 関連
│   │   │   └── db.ts
│   │   ├── data-import-export/
│   │   │   ├── csvUtils.ts
│   │   │   └── zipImportExportService.ts
│   │   ├── deck-logic/
│   │   │   └── deckService.ts
│   │   ├── pack-logic/
│   │   │   ├── cardDataService.ts
│   │   │   ├── packDataService.ts
│   │   │   ├── packService.ts
│   │   │   ├── packUtils.ts
│   │   │   └── simulataionUtils.ts
│   │   └── user-logic/
│   │       └── userSettingsService.ts
│   ├── utils/           // 再利用可能で他のアプリでも使えるような汎用的な関数
│   │   ├── dataUtils.ts 
│   │   ├── imageUtils.ts 
│   │   ├── placeholderUtils.ts 
│   │   ├── randomUtils.ts
│   │   ├── uuidUtils.ts
│   │   └── validationUtils.ts
│   ├── hooks/           // Reactのフック機能を利用した関数
│   │   ├── useCardData.ts
│   │   ├── useCooldownTimer.ts 💡
│   │   └── useInitialLoad.ts
│   ├── models/          // 型定義
│   │   ├── card.ts
│   │   ├── db-types.ts
│   │   ├── deck.ts
│   │   ├── pack.ts
│   │   └── preset.ts
│   ├── stores/          // 状態管理 (Zustand) 関連
│   │   ├── cardPoolStore.ts
│   │   ├── cardStore.ts
│   │   ├── currencyStore.ts
│   │   ├── deckStore.ts
│   │   ├── packStore.ts
│   │   ├── presetStore.ts
│   │   ├── uiStore.ts 💡
│   │   └── userDataStore.ts
│   ├── router/          // ルーティング設定 (TanStack Router) 関連 
│   │   └── index.tsx    // ルーターインスタンスとルート定義
│   ├── App.tsx          // アプリケーションのメインコンポーネント
│   ├── main.tsx         // エントリーポイント
│   ├── App.css
│   └── index.css

```
# ファイル内容

## etc
/**
* src/router/index.tsx
*
* TanStack Routerを使用したアプリケーションのルーティング設定ファイル。
* 各ページコンポーネントをルートに割り当て、ルートツリーを構成する。
*/

/**
* src/main.tsx
*
* アプリケーションのエントリーポイント。
* Reactのレンダリング開始と、IndexedDB (Dexie) の初期化と接続を行います。
*/

/**
* src/App.tsx
*
* アプリケーションのメインコンポーネント。
* アプリケーションのルートで全てのZustandストアを初期化し、TanStack Routerを介してルーティングを行います。
* IndexedDBからのデータロード完了を待つためのロード画面を表示します。
*/



## components
/**
 * src/components/layout/MainLayout.tsx
 *
 * アプリケーションのメインレイアウトコンポーネントです。
 * ナビゲーションバー (Navbar) の表示と、ページコンテンツを囲むコンテナを提供します。
 * グローバルな状態管理ストア (Zustand) から、Navbarに表示するためのゲーム内通貨やユーザー設定 (DTCG/GodMode) を取得します。
 */

 /**
 * src/components/CardEditModal.tsx
 *
 * TCGカードの情報を編集・新規作成するためのモーダルコンポーネントです。
 * 基本情報 (カード名、画像URL、収録パック、レアリティ) の入力と、
 * ユーザーが定義できるカスタムデータ (userCustom) の編集機能を提供します。
 * 状態管理ストアを通じてカードデータの作成、更新、削除を行います。
 */

 /**
 * src/components/DataImportExportDialog.tsx
 *
 * アプリケーションの全データ (パック、デッキ、カードプール、ユーザー設定など) を
 * ZIPファイル形式でインポートおよびエクスポートするためのダイアログコンポーネントです。
 * データ永続化とユーザー間の共有を可能にする主要機能の一つです。
 */

 /**
 * src/components/Navbar.tsx
 *
 * アプリケーションのグローバルナビゲーションバーです。
 * アプリのタイトル、現在のモード表示 (FREE PLAY, DTCG, GOD MODE)、
 * および主要なページへのナビゲーションリンク（パック管理、カードプール、デッキ構築など）を提供します。
 * データのエクスポート/インポート機能のダイアログ起動ボタンも含まれます。
 */

 /**
 * src/components/OpenerCard.tsx
 *
 * パック開封シミュレーションで使用される、カードのフリップアニメーションを伴うコンポーネントです。
 * CSSの3D変換プロパティを利用して、カード裏面から表面への滑らかな回転（フリップ）を実現します。
 * 開封されるカードデータと、パックの裏面画像、フリップの状態（isRevealed）、およびアニメーション遅延時間を受け取ります。
 */

 /**
 * src/components/PackCardList.tsx
 *
 * 特定のパックに収録されているカードの一覧を表示するコンポーネントです。
 * 編集モード (isEditable) に応じて、新規カードの追加ボタンを表示したり、
 * 既存カードのクリック時に編集モーダルを開く機能を持ちます。
 * カード画像には、共通の画像ユーティリティ関数を使用して、プレースホルダー処理を適用しています。
 */

 /**
 * src/components/PackPreviewCard.tsx
 *
 * パックのプレビュー画像を表示するコンポーネントです。
 * 共通の画像ユーティリティを使用して、画像URLがない場合に指定されたサイズと色で
 * パック名を含むプレースホルダー画像を生成・表示します。
 */

 /**
 * src/components/RarityEditModal.tsx
 *
 * 特定のパックに収録されるカードのレアリティ設定（レアリティ名と封入確率）を編集するためのモーダルです。
 * カスタムフック `useRarityEditor` を使用して、レアリティの追加・削除、確率の変更、合計確率のバリデーションロジックを管理します。
 * 変更は Zustand のパックストアを通じて永続化されます。
 */



 ## hooks
 /**
 * src/hooks/useCardData.ts
 *
 * アプリケーション全体のカードデータ（全パックのカード情報）を管理し、
 * ロード状態の追跡と、カード情報の取得ヘルパー関数を提供するカスタムフックです。
 * 主に、データの初期ロードを保証し、UIコンポーネントがカード情報にアクセスするための
 * シンプルなインターフェースを提供します。
 */

 /**
 * src/hooks/useInitialLoad.ts
 *
 * アプリケーションの初期起動時に必要な全てのデータ（カードデータ、ストアデータ）をロードするカスタムフックです。
 * データ永続化層からの読み込みが完了するまで、アプリケーションのメインUIの描画をブロックするために使用されます。
 */



 ## models
 /**
 * src/models/card.ts
 *
 * TCG Builderアプリケーションで使用される「収録カード」のデータ構造を定義する型です。
 * この型は、パックに収録され、ユーザーがデッキ構築やプール管理を行う対象となる
 * 個々のカードデータを表現します。
 */

 /**
 * src/models/db-types.ts
 *
 * IndexedDB (Dexie) の各テーブルに保存されるオブジェクトのデータ構造を定義する型ファイルです。
 * カードプール、ユーザー設定、デッキデータなど、永続化が必要なデータ型が含まれます。
 */

 /**
 * src/models/deck.ts
 *
 * デッキエンティティの型定義ファイルです。
 * TCGシミュレータで使用されるデッキデータ構造（カードリスト、枚数、メタデータ）を定義します。
 */

 /**
 * src/models/pack.ts
 *
 * TCG Builderアプリケーションで使用される「パック」のデータ構造を定義する型です。
 * パック名、価格、封入枚数、レアリティ設定、画像URLなど、パック開封シミュレーションと
 * パック管理に必要なすべてのメタデータが含まれます。
 */

 /**
 * src/models/preset.ts
 *
 * パックやカードのカスタムフィールドなどの設定を一括で管理するためのプリセットデータ構造を定義します。
 * 汎用的な基本構造 (`BasePreset`) を拡張し、パック用 (`PackPreset`) とカードカスタム用 (`CardCustomPreset`)
 * の具体的な型を定義します。
 */



## pages
/**
 * src/pages/CardPoolPage.tsx
 *
 * ユーザーが所有するカード資産（カードプール）の一覧と管理機能を提供するページコンポーネントです。
 * 実際のロジック（フィルタリング、ソート、表示）は `CardPoolManager` コンポーネントに委譲しています。
 */

 /**
 * src/pages/DeckEditPage.tsx
 *
 * デッキの新規作成または編集を行うためのメインページコンポーネントです。
 * URLパラメータからデッキIDを取得し、カスタムフック `useDeckEditor` を使用して
 * デッキのデータ（情報、カードリスト、保存/削除ロジック）を一元管理します。
 * 実際のUI描画とカードの追加/削除は、フィーチャーコンポーネント `DeckEditor` に委譲します。
 */

/**
 * src/pages/DeckListPage.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規デッキ作成や既存デッキの編集・削除へ
 * ナビゲートする機能を提供するページコンポーネントです。
 * デッキ一覧の取得、表示、およびフィルタリング・ソートなどの実際のロジックは
 * `DeckListManager` コンポーネントに委譲しています。
 */

 /**
 * src/pages/HomePage.tsx
 *
 * アプリケーションのランディングページコンポーネントです。
 * ユーザーに対し、アプリケーションの概要を説明し、主要な機能ページ（パック管理、パック開封）への
 * ナビゲーションリンクを提供します。
 */

 /**
* src/pages/PackEditPage.tsx
*
* パック情報（基本情報、封入設定、レアリティ設定）の編集と、
* 収録カードリストの管理、CSVによるカードのインポート/エクスポートを行うページ。
* 状態管理とロジックはusePackEditカスタムフックに集約されている。
*/

/**
* src/pages/PackListPage.tsx
*
* 登録されているすべてのパックを一覧表示するページ。
* 各パックはカード形式で表示され、クリックで編集ページへ遷移する。
* 「新規パックを作成」ボタンもここに配置される。
*/

/**
* src/pages/PackOpenerPage.tsx
*
* パック開封シミュレータのページコンポーネント。
* URLパラメータからpackIdを取得し、PackOpener Featureコンポーネントにロジックを委譲する。
* このページ自体には状態管理ロジックを含まない。
*/

/**
* src/pages/SettingsPage.tsx
*
* アプリケーションの全体設定やDTCG要素のカスタムルール設定を行うためのページ。
* このページは将来の展望（フェーズ3）として計画されている。
*/



## stores
/**
* src/stores/cardPoolStore.ts
*
* Zustandを使用してユーザーのカード所有資産を管理するストア。
* IndexedDB（cardPoolService）と連携し、所有カード（cardIdと枚数のMap）と
* 総枚数の状態を保持し、DBへのデータの永続化と同期を行う。
*/

/**
* src/stores/cardStore.ts
*
* Zustandを使用してアプリケーション全体のカードデータを管理するストア。
* IndexedDB（db）と連携し、カードのCRUD操作、パックIDによるフィルタリング、
* そしてCSVインポート/エクスポート機能を提供する。
*/

/**
* src/stores/currencyStore.ts
*
* Zustandを使用してユーザーの仮想通貨（コイン）を管理するストア。
* IndexedDB（currencyService）と連携し、通貨のロード、加算、減算、リセット、
* およびDBへの永続化を処理する。
*/

/**
* src/stores/deckStore.ts
*
* Zustandを使用してユーザーのデッキデータを管理するストア。
* デッキ一覧（decks）と編集中のデッキ（currentDeck）を状態として持ち、
* DB（deckService）と連携したCRUD操作およびカードプール（cardPoolStore）との
* 同期チェック（hasUnownedCards）を処理する。
*/

/**
* src/stores/packStore.ts
*
* Zustandを使用してアプリケーション全体のパックデータを管理するストア。
* IndexedDB（packService）と連携し、パックのCRUD操作、パック削除時の
* カードプール/カードストアとの連携ロジックを処理する。
*/

/**
* src/stores/presetStore.ts
*
* Zustandを使用してパックおよびカードのカスタムプロパティのプリセットを管理するストア。
* パックの基本情報やカードのカスタムフィールド設定をプリセットとして保存・削除するアクションを提供する。
* 現在はデモ用の初期データを使用しており、IndexedDBへの永続化ロジックは保留されている。
*/

/**
* src/stores/userDataStore.ts
*
* Zustandを使用してユーザーのアプリケーション設定（DTCGモード、ゴッドモード、チートカウントなど）を管理するストア。
* DB（userSettingsService）と連携し、設定のロードと永続化を行う。
* 通貨管理（coins）は currencyStore に委譲している。
*/



## utils
/**
* src/utils/imageUtils.ts
*
* 画像URLの取得と、URLがない場合のプレースホルダーURLの生成ロジックを提供するユーティリティ関数。
* カードやパックの画像表示に使用される共通のサイズ定数も定義している。
*/

/**
* src/utils/placeholderUtils.ts
*
* 画像URLがない場合に表示するプレースホルダーURLを生成するユーティリティ。
* placehold.jp サービスを利用。
*/

/**
* src/utils/randomUtils.ts
*
* ランダム抽選に関する汎用ユーティリティ関数。
*/

/**
* src/utils/uuidUtils.ts
*
* UUID (Universally Unique Identifier) 生成に関する汎用ユーティリティ関数。
*/

/**
* src/utils/validationUtils.ts
*
* データ検証に関する汎用ユーティリティ関数群。
*/



## features
### card-pool
/**
 * src/features/card-pool/CardPoolManager.tsx
 * 
 * カードコレクションの表示と管理を行うメインコンポーネント。
 * ユーザーが所有するカードをフィルター、並び替え、ページネーション機能で表示する。
 * 各カードの表示には OpenerCard を利用し、枚数表示（DTCG有効時）も行う。
 */

 /**
 * src/features/card-pool/hooks/useCardPool.ts
 * 
 * カードプールの状態管理と永続化を統合するカスタムHook。
 * アプリケーション起動時にIndexedDBからカードプールデータをロードし、Zustandストアを初期化する。
 * データの永続化（DB保存）ロジックはストアのアクション内に集約されており、このHookは初期ロードに専念する。
 */

 /**
 * src/features/card-pool/hooks/useCardPoolDisplay.ts
 * 
 * カードコレクション画面（CardPoolManager）の表示ロジック、
 * フィルタリング、並び替え、ページネーション機能を提供するカスタムフック。
 * カードプールストア、カードストア、ユーザーデータストアの状態を統合して
 * 画面表示に必要な処理を行う。
 */

### deck-management
/**
 * src/features/deck-management/DeckEditor.tsx
 * 
 * デッキの編集を行うメインコンポーネント。
 * デッキ情報（名前、説明）の編集、カードの追加/削除、
 * デッキの保存/削除機能を提供する。
 * また、カードプールと比較し、未所有のカードをハイライト表示する。
 */

 /**
 * src/features/deck-management/DeckListManager.tsx
 * 
 * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、削除の操作を提供するコンポーネント。
 * useDeckListカスタムフックを使用してデッキデータをロードし、テーブル形式で表示する。
 * 各デッキにはサムネイル画像（プレースホルダー含む）と総カード枚数を表示する。
 */

 /**
 * src/features/deck-management/hooks/useDeckEditor.ts
 * 
 * デッキ編集画面のコアロジックを提供するカスタムフック。
 * 特定のデッキIDまたは新規作成モードに基づき、データのロード、
 * 編集中のデッキの状態管理、保存、および削除処理を統合する。
 * カードプールデータへのアクセスも行う。
 */

 /**
 * src/features/deck-management/hooks/useDeckList.ts
 * 
 * デッキ一覧の取得、状態管理、およびデッキの削除機能を提供するカスタムフック。
 * アプリケーションの起動時または必要なタイミングでデッキデータをロードし、
 * デッキ管理画面での表示と操作をサポートする。
 */

### pack-management
/**
 * src/features/pack-management/PackManager.tsx
 * 
 * パックデータの一覧表示、編集対象の切り替え、新規作成、削除を管理するコンポーネント。
 * usePackDataフックからロジックを取得し、簡易的なUIでパックの基本操作を提供する。
 */

 /**
 * src/features/pack-management/hooks/useCardCsvIO.ts
 * 
 * カードデータの一括インポート・エクスポート (CSV形式) を管理するカスタムフック。
 * CSVファイルのパース、予約語チェック、Cardオブジェクトへの変換、
 * およびストアへのインポート処理を提供する。
 */

 /**
 * src/features/pack-management/hooks/usePackData.ts
 * 
 * パック管理画面で必要なパックデータ（全リストと現在編集中のパック）
 * および、パックのロード、保存、削除ロジックを提供するカスタムフック。
 */

 /**
 * src/features/pack-management/hooks/usePackEdit.ts
 * 
 * パック編集/新規作成画面のコアロジックを提供するカスタムフック。
 * パックデータのロード、フォーム状態管理 (usePackForm)、保存、削除、
 * カードCSVインポート (useCardCsvIO)、プリセット操作、および各種モーダル管理を統合する。
 */

 /**
 * src/features/pack-management/hooks/usePackForm.ts
 * 
 * PackEditPageのフォーム入力と状態管理 (PackData) を担うカスタムフック。
 * テキスト入力、数値入力、Selectコンポーネントからの変更を処理し、
 * Packオブジェクトの状態を維持する。
 */

 /**
 * src/features/pack-management/hooks/useRarityEditor.ts
 * 
 * パックのレアリティ設定（rarityNameとprobabilityの配列）の編集ロジックと
 * 状態を管理するカスタムフック。
 * 確率の合計計算や、初期値が空の場合のデフォルト設定へのフォールバックも行う。
 */

### pack-opening
/**
 * src/features/pack-opening/PackOpener.tsx
 * 
 * パック開封機能のユーザーインターフェース。
 * パック選択、コイン表示、開封ボタン、開封結果の表示を行う。
 * usePackOpenerDataフックから全ての状態とロジックを取得する。
 */

 /**
 * src/features/pack-opening/hooks/usePackOpenerData.ts
 * 
 * パック開封機能のロジックと状態管理を行うカスタムフック。
 * パック選択、コイン消費、パック開封シミュレーション (非同期)、
 * カードプールへの追加、エラー/警告メッセージの管理を行う。
 */



## services
/**
 * src/service/card-pool/cardPoolService.ts
 * 
 * IndexedDB (Dexie) の 'cardPool' テーブルに対する操作を扱うサービス。
 * カードプールの取得、個別の所有枚数更新、および複数のカードの一括更新を
 * 非同期で実行する。
 */

 /**
 * src/services/currency/currencyService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブル内の通貨データ (コイン)
 * に対する操作を扱うサービス。コインのロードと保存のロジックを提供する。
 */

 /**
 * src/service/database/db.ts
 *
 * IndexedDB (Dexie) を使用したアプリケーションのデータベース接続と
 * スキーマ定義 (テーブルとインデックス) を提供する。
 * Pack, Card, CardPool, Deck, UserSettings のテーブルを含む。
 */

 /**
 * src/services/data-import-export/csvUtils.ts
 *
 * CSV形式の文字列を受け取り、ヘッダー行とデータ行の配列にパースするユーティリティ関数。
 * シンプルなカンマ区切りを想定し、空行を無視して処理する。
 */

 /**
 * src/services/data-import-export/zipImportExportService.ts
 *
 * アプリケーションの全データ（パック、デッキ、ユーザー設定、カードプール）を
 * 収集し、ZIPファイルとしてエクスポート/インポートするサービス。
 * データのエクスポート、ZIPからのデータ解析、そして既存のストア/DBへのデータ統合を
 * オーケストレーションする。
 */

 /**
 * src/service/deck-logic/deckService.ts
 *
 * IndexedDB (Dexie) の 'decks' テーブルに対する CRUD 操作と、
 * DeckデータのMap/Record間の変換、および一括インポート処理を扱うサービス。
 */

 /**
 * src/services/user-logic/userSettingsService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブルに対して、
 * コイン以外のユーザー設定（isDTCGEnabled, isGodMode, cheatCountなど）
 * のロードと保存を行うサービス。設定は単一のキーで管理される。
 */

### pack-logic
/**
 * src/services/pack-logic/CardDataService.ts
 *
 * TCGカードの定義データを管理するシングルトンサービス。
 * カード定義のロード（ダミーデータ）、キャッシュ、およびID、パック、
 * レアリティに基づいたカード検索機能を提供する。
 */

 /**
 * src/services/pack-logic/packDataService.ts
 *
 * IndexedDB (Dexie) の 'packs' テーブルおよび 'cards' テーブルと連携し、
 * パックデータおよび特定の条件（パックIDとレアリティ）に合致する
 * カードデータを非同期で取得するデータサービス。
 */

 /**
 * src/services/pack-logic/packService.ts
 * 
 * * IndexedDB (Dexie) の 'packs' テーブルに対する CRUD 操作、
 * および関連するテーブル（cards, cardPool）のデータ削除操作を扱うサービス。
 * パックの作成、取得、更新、トランザクションによる削除、一括インポート機能を提供する。
 */

 /**
 * src/services/pack-logic/packUtils.ts
 *
 * パックデータに関連するユーティリティ関数（ID生成、デフォルトパック作成、
 * カード総数計算（スタブ））を提供する。
 */

 /**
 * src/services/pack-logic/simulationUtils.ts
 *
 * パックの開封シミュレーションロジックを提供する。
 * パックの設定とDB連携（packDataService）に基づき、
 * レアリティ確率抽選とカードプールからのカード選択を非同期で行う。
 */