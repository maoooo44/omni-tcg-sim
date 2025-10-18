20251015-02:17最新
# ファイル構造
```
omni-tcg-sim/
├── src/
│   ├── assets/          //
│   ├── components/      // 再利用可能なUIコンポーネント
│   │   ├── common/
│   │   │   └── SortableTableCell.tsx
│   │   ├── controls/
│   │   │   ├── CardCustomFieldDisplay.tsx
│   │   │   ├── CardCustomFieldManager.tsx
│   │   │   └── SortAndFilterControls.tsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx
│   │   │   └── Navbar.tsx
│   │   ├── modals/
│   │   │   ├── CardEditorModal.tsx
│   │   │   ├── CardViewModal.tsx
│   │   │   ├── GameModeSwitchModal.tsx
│   │   │   └── RarityEditorModal.tsx
│   │   └── AppLoadingScreen.tsx
│   ├── features/       // 機能とUIの統合
│   │   ├── card-pool/
│   │   │   ├── components/
│   │   │   │   └── OwnedCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCardPool.ts
│   │   │   │   └── useCardPoolDisplay.ts
│   │   │   ├── CardPool.tsx
│   │   │   └── cardPoolUtils.ts
│   │   ├── data-io/
│   │   │   └── components/
│   │   │       └── DataIOModal.tsx
│   │   ├── decks/
│   │   │   ├── hooks/
│   │   │   │   ├── useDeckEditor.ts
│   │   │   │   └── useDeckList.ts
│   │   │   ├── deckUtils.ts
│   │   │   ├── DeckEditor.tsx
│   │   │   └── DeckList.tsx
│   │   ├── packs/
│   │   │   ├── components/
│   │   │   │   ├── CsvIOModal.tsx
│   │   │   │   ├── JsonIOModal.tsx
│   │   │   │   ├── PackCardList.tsx
│   │   │   │   ├── PackEditorToolbar.tsx
│   │   │   │   ├── PackInfoForm.tsx
│   │   │   │   └── PackPreviewCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCardCsvIO.ts
│   │   │   │   ├── usePackEditor.ts
│   │   │   │   ├── usePackForm.ts
│   │   │   │   ├── usePackList.ts
│   │   │   │   └── useRarityEditor.ts
│   │   │   ├── PackEditor.tsx
│   │   │   ├── PackList.tsx
│   │   │   └── packUtils.ts
│   │   └── pack-opener/
│   │       ├── components/
│   │       │   ├── OpenerCard.tsx
│   │       │   └── PackOpenerAnimation.tsx
│   │       ├── hooks/
│   │       │   └── usePackOpenerData.ts
│   │       ├── PackOpener.tsx
│   │       └── PackOpenerHandler.tsx
│   ├── hooks/           // Reactのフック機能を利用した関数
│   │   ├── useCardData.ts
│   │   ├── useCardViewData.ts
│   │   ├── useCooldownTimer.ts
│   │   ├── useDataFileIO.ts
│   │   ├── useModeSwitcher.ts
│   │   ├── useInitialLoad.ts
│   │   └── useSortAndFilter.ts
│   ├── models/          // 型定義
│   │   ├── card.ts
│   │   ├── db-types.ts
│   │   ├── deck.ts
│   │   ├── pack.ts
│   │   ├── pack-opener.ts
│   │   ├── preset.ts
│   │   └── userData.ts
│   ├── pages/           // 各ページのレイアウト，コンポーネントの配置
│   │   ├── CardPoolPage.tsx
│   │   ├── DeckEditorPage.tsx
│   │   ├── DeckListPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── PackEditorPage.tsx
│   │   ├── PackListPage.tsx
│   │   └── PackOpenerPage.tsx
│   ├── router/          // ルーティング設定 (TanStack Router) 関連 
│   │   └── index.tsx    // ルーターインスタンスとルート定義
│   ├── services/        // UIに依存しない再利用可能なビジネスロジック
│   │   ├── cards/
│   │   │   ├── cardDataService.ts
│   │   │   └── cardSearchService.ts
│   │   ├── card-pool/
│   │   │   ├── cardPoolDataService.ts
│   │   │   └── cardPoolSearchService.ts
│   │   ├── currency/
│   │   │   └── currencyService.ts
│   │   ├── database     // IndexedDB (Dexie.js) 関連
│   │   │   ├── db.ts
│   │   │   └── dbUtils.ts
│   │   ├── data-io/
│   │   │   ├── cardPoolJsonIO.ts
│   │   │   ├── deckJsonIO.ts
│   │   │   ├── packJsonIO.ts
│   │   │   ├── userDataJsonIO.ts
│   │   │   └── zipIOService.ts
│   │   ├── decks/
│   │   │   └── deckService.ts
│   │   ├── packs/
│   │   │   ├── packService.ts
│   │   │   ├── packLogicUtils.ts
│   │   │   └── packSimulation.ts
│   │   └── user-data/
│   │       ├── presetService.ts
│   │       └── userDataService.ts
│   ├── stores/          // 状態管理 (Zustand) 関連
│   │   ├── cardPoolStore.ts
│   │   ├── cardStore.ts
│   │   ├── currencyStore.ts
│   │   ├── deckStore.ts
│   │   ├── packStore.ts
│   │   ├── presetStore.ts
│   │   ├── uiStore.ts
│   │   └── userDataStore.ts
│   ├── utils/           // 再利用可能で他のアプリでも使えるような汎用的な関数
│   │   ├── csvFormatter.ts
│   │   ├── csvParser.ts
│   │   ├── dataUtils.ts 
│   │   ├── genericJsonIO.ts
│   │   ├── imageUtils.ts 
│   │   ├── numberingUtils.ts 
│   │   ├── placeholderUtils.ts 
│   │   ├── randomUtils.ts
│   │   ├── sortingUtils.ts
│   │   └── validationUtils.ts
│   ├── App.css
│   ├── App.tsx          // アプリケーションのメインコンポーネント
│   ├── index.css
│   └── main.tsx         // エントリーポイント

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
 * src/App.tsx
 *
 * アプリケーションのルートコンポーネント。
 * 全てのZustandストアを初期化し、useInitialLoadフックでIndexedDBからのデータロード完了を監視します。
 * ロード完了後は、TanStack Routerを通じてアプリケーションのルーティング構造全体をレンダリングします。
 */

/**
* src/main.tsx
*
* アプリケーションのエントリーポイント。
* Reactのレンダリング開始を行います。
* IndexedDB (Dexie) の初期化と接続は、useInitialLoadフック（または関連サービス）に移管されました。
*/



## components

/**
 * src/components/AppLoadingScreen.tsx
 * 
 * アプリケーションの初期データロード中に表示される、中央寄せのロード画面コンポーネント。
 * ルートコンポーネント (App.tsx) の表示ロジックを分離するために使用されます。
 */

### common
/**
* src/components/common/SortableTableCell.tsx
*
* 共通で使用されるソート機能付きテーブルヘッダーセル（TableCell）コンポーネントです。
* テーブル一覧表示（DeckList, CardListManagerなど）で使用され、
* ユーザーがセルをクリックすることで、対応するフィールド（field）でのデータの昇順/降順ソートを切り替えます。
* ソートの状態管理は、外部の useSortAndFilter フックから受け取った状態とアクション（sortState）に依存します。
*/

### controls
/**
 * src/components/controls/CardCustomFieldDisplay.tsx
 *
 * Card.userCustom オブジェクトを受け取り、それを Key-Value のリストとして
 * 整形して表示する役割を持つコンポーネント。カスタムデータの表示ロジックを分離する。
 */

 /**
 * src/components/controls/CardCustomFieldManager.tsx
 *
 * カードのカスタムデータ (userCustom) のキーと値を管理するコンポーネント。
 * 親コンポーネントからカスタムフィールドのリストと、それらを操作するためのハンドラを受け取る。
 * キーの重複チェックと新規追加のロジックを内包する。
 */

/**
 * src/components/controls/SortAndFilterControls.tsx
 *
 * 汎用的なソートとフィルタリングの操作UIを提供するコンポーネント。
 * 親コンポーネントから状態と更新関数を受け取り、UIイベントに応じてそれらを呼び出す。
 */

 ### layouts

 /**
 * src/components/layouts/MainLayout.tsx
 *
 * アプリケーションのメインレイアウトコンポーネントです。
 * ナビゲーションバー (Navbar) の表示と、ページコンテンツを囲むコンテナを提供します。
 * グローバルなCardViewModalを配置します。
 */

 /**
 * src/components/layouts/Navbar.tsx
 *
 * アプリケーションのグローバルナビゲーションバー。
 * 純粋にUIのレイアウトと、ナビゲーション、外部ダイアログの起動ボタンの責務を持つ。
 * DTCGモードのロジックは useDtcgModeSwitcher に、ダイアログUIは DtcgModeSwitchModal に分離されている。
 */

 ### modals
/**
 * src/components/modals/CardEditorModal.tsx
 *
 * カードの新規作成・編集を行うためのモーダルコンポーネント。
 * モーダルの枠組み、カード基本情報の入力、および最終的な保存時のデータ整形 (型変換) の責務を持つ。
 * カスタムフィールドの管理は CardCustomFieldManager コンポーネントに委譲されている。
 */

 /**
 * src/components/modals/CardViewModal.tsx
 *
 * カードの情報を表示する純粋なプレゼンテーショナルモーダルコンポーネント。
 * データフェッチングと計算のロジックは useCardViewData カスタムフックに完全に委譲する。
 * モーダル表示の制御と、レスポンシブなUIレンダリングの責務を持つ。
 */

 /**
 * src/components/modals/GameModeSwitchModal.tsx
 *
 * useModeSwitcher フックで管理されるGameモード切り替えのための
 * 全てのダイアログ（モード選択、警告、二重確認）をレンダリングするコンポーネント。
 * 純粋にUI表示の責務のみを持ち、ロジックはフックから提供されるプロパティに依存する。
 */

 /**
 * src/components/modals/RarityEditorModal.tsx
 *
 * 特定のパックに収録されるカードのレアリティ設定（レアリティ名と封入確率）を編集するためのモーダルコンポーネントです。
 * カスタムフック `useRarityEditor` を使用して、レアリティの追加・削除、確率の変更、合計確率のバリデーションなどの編集ロジックを完全に分離しています。
 * このコンポーネントは純粋な Presentational コンポーネントとして動作し、編集対象のパックデータと、
 * 編集後のデータを親コンポーネントに返すための `onSave` コールバックを受け取ります。
 */



## features
### card-pool
 /**
 * src/features/card-pool/CardPool.tsx
 *
 * カードコレクションの表示と管理を行うメインコンポーネント（ビュー）。
 * フィルタリング、並び替え、ページネーションのUIと、全体のレイアウトを管理します。
 * 個々のカード表示ロジックは OwnedCard コンポーネントに委譲されます。
 */

/**
 * src/features/card-pool/components/OwnedCard.tsx
 *
 * カードコレクション表示内で、個々の所有カードを表すコンポーネントです。
 * 画像のURL生成、枚数チップ表示、カード詳細モーダルを開くためのクリックハンドラを管理します。
 */

/**
 * src/features/card-pool/hooks/useCardPool.ts
 * 
 * カードプールZustandストアのコンテキストをアプリケーションルートで確立するためのカスタムHook。
 * このHookを呼び出すことで、ストアが初期化され、その状態がアプリケーション全体で利用可能になります。
 * データの初期ロードは useInitialLoad フックに、データの永続化は cardPoolStore のアクションに委譲されています。
 */

 /**
 * src/features/card-pool/hooks/useCardPoolDisplay.ts
 *
 * ユーザーのカードコレクション画面（CardPool）に必要なデータを統合し、
 * フィルタリング、ソート、ページネーションの状態とロジックを提供するカスタムHookです。
 * 複数のZustandストアから情報を取得し、表示用のリストに変換する責務を担います。
 */

/**
 * src/features/card-pool/cardpoolUtils.ts
 *
 * カードプール管理フィーチャーで使用されるユーティリティ関数群。
 * OwnedCardDisplayオブジェクトから、useSortAndFilterフックがソートに使用するための
 * 対応するフィールド値を取得するアクセサ関数を提供します。
 */

### data-io
/**
 * src/features/data-io/components/DataIOModal.tsx
 *
 * アプリケーションの全データ (パック、デッキ、カードプール、ユーザー設定など) を
 * ZIPファイル形式でインポートおよびエクスポートするためのダイアログコンポーネントです。
 * データ永続化とユーザー間の共有を可能にする主要機能の一つです。
 */

### decks
 /**
 * src/features/decks/DeckEditor.tsx
 *
 * デッキの編集を行うメインコンポーネント。
 * データ取得はすべて親/フック層に委譲され、自身は**純粋なUI描画**と**イベントハンドラの呼び出し**に専念する。
 * デッキの編集、カードの追加/削除、デッキ情報の更新機能を提供する。
 */

 /**
 * src/features/decks/DeckList.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規作成、編集、削除の操作を提供するコンポーネント。
 * useDeckListフックからデータを取得し、useSortAndFilterフックでソート・フィルタリングを適用する。
 * 表示用のUIロジック（ソート可能なテーブルヘッダー、サムネイルの表示、操作ボタン）に専念する。
 */

/**
 * src/features/decks/hooks/useDeckEditor.ts
 *
 * デッキ編集画面のコアロジックを提供するカスタムフック。
 * 責務：
 * 1. URLパラメータから取得したdeckIdに基づき、編集対象のデッキデータをZustandストアからロード/初期化する。
 * 2. 関連するデータ（全カードリスト、所有カード資産）を他のストアから取得し、コンポーネントに提供する。
 * 3. デッキ情報（名前、説明など）の更新、カードの追加/削除、保存、削除といった永続化アクションを実行する。
 * 4. UIの状態（ローディング、保存メッセージ）を管理する。
 */

 /**
 * src/features/decks/hooks/useDeckList.ts
 *
 * デッキリストの表示に必要なデータをZustandストアから取得し、基本的なロジックを提供するカスタムフック。
 * 責務：
 * 1. コンポーネントマウント時にデッキ一覧データを非同期でロードする。
 * 2. デッキの削除アクション（handleDeleteDeck）を提供する。
 * 3. 表示補助として、ユーティリティからカード総枚数計算機能（calculateTotalCards）を提供する。
 */

 /**
 * src/features/decks/deckUtils.ts
 *
 * デッキ管理フィーチャー（DeckEditor、DeckListなど）で使用されるユーティリティ関数群。
 * 主に、デッキオブジェクト（Deck型）に関連する純粋なデータ処理や変換ロジックを提供する。
 * 責務：
 * 1. カードIDと枚数のMap形式をUI表示用のリスト形式に変換・ソート（mapToDeckCardList）。
 * 2. デッキに含まれるカードの総枚数を計算（calculateTotalCards）。
 * 3. ソート機能がDeckオブジェクトの特定のフィールド値を取得するためのアクセサ機能を提供（deckFieldAccessor）。
 */

### packs
/**
 * src/features/packs/PackEditor.tsx
 * 
 * パック編集画面のメインUIコンポーネント。
 * このコンポーネントは、usePackEditorカスタムフック（ロジック）から提供される全てのデータとハンドラを受け取り、
 * 編集画面の全体的なレイアウト構築と、各サブコンポーネントへのプロパティ分配を行う純粋なビューコンポーネントとしての責務を担う。
 * 主な要素として、ツールバー、パック基本情報フォーム、収録カードリスト、および各種モーダルが含まれる。
 */

/**
 * src/features/packs/PackList.tsx
 *
 * パック管理フィーチャーの核となるコンポーネント。
 * 責務は、usePackListカスタムフックから取得したパックデータ、ソート/フィルタ状態、および操作ハンドラ（選択、新規作成、削除）を用いて、
 * Material UIのGridレイアウトに基づいたパックカード一覧UIを描画すること。
 * 純粋なビュー層として機能し、データ取得やビジネスロジックの詳細はカスタムフックに完全に委譲する。
 */

/**
 * src/features/packs/components/CsvIOModal.tsx
 *
 * カードのCSVインポート機能に対応するモーダルUIコンポーネント。
 * このコンポーネントは、CSVファイルの選択と、インポート実行の確認画面を提供し、
 * useDataFileIOフック（親コンポーネント経由）から渡される状態とハンドラに基づいて表示を制御する。
 * 責務：ファイル選択UIの提供、インポートルールのユーザーへの提示、アクションボタンのレンダリング。
 */

 /**
 * src/features/packs/components/JsonIOModal.tsx
 *
 * パック全体（Packデータと収録カードデータ）のJSONインポート機能に対応するモーダルUIコンポーネント。
 * このコンポーネントは、JSONファイルの選択と、インポート実行の確認画面、および処理中のステータスメッセージ表示を提供します。
 * 責務：ファイル選択UI、インポートルールのユーザーへの提示、アクションボタンのレンダリング、ステータスの表示。
 */

/**
 * src/features/packs/components/PackCardList.tsx
 *
 * 特定のパックに収録されているカードの一覧（リストまたはグリッド）を表示するコンポーネントです。
 * `useSortAndFilter` カスタムフックを使用し、カードデータに対するソート、フィルタリング、およびその状態管理を抽象化しています。
 * 編集権限（isEditable）に応じて、カードの編集モーダル（新規追加または既存カード）または閲覧モーダルを開くコールバック関数を提供します。
 * Material UI Gridには、ユーザー定義のv7構文（item廃止、size使用）が適用されています。
 */

/**
 * src/features/packs/components/PackEditorToolbar.tsx
 *
 * PackEditor画面のヘッダーに位置するツールバーコンポーネント。
 * 主にパックのメタ情報（Packデータ）と、各種アクションハンドラ（保存、削除、モード切替、インポート/エクスポート）を受け取り、
 * 編集状態やデータ状態に応じて、ボタンの有効/無効を制御し、適切なUIを提供します。
 * 責務：ページタイトル表示、主要な操作ボタンのレンダリング、データ入出力メニューの表示。
 */
 
 /**
 * src/features/packs/components/PackInfoForm.tsx
 *
 * パック編集ページで使用される、Packの基本情報（名称、番号、URLなど）を入力するためのフォームコンポーネント。
 * フォーム要素のUI描画と、親コンポーネントからのイベントハンドラへのアクション伝達に責務を限定する。
 */

 /**
 * src/features/packs/components/PackPreviewCard.tsx
 *
 * パック編集画面などの、パック管理機能内で使用されるプレビュー画像コンポーネントです。
 * Packモデルデータを受け取り、パック画像（またはプレースホルダー画像）と指定されたサイズで表示します。
 * 画像URLがない場合は、パック名とPack Management機能に合わせた特定の色（'3498db'）でプレースホルダー画像を生成します。
 */

 /**
* src/features/packs/hooks/useCardCsvIO.ts
*
* カードデータの一括インポート・エクスポート (CSV形式) を管理するカスタムフック。
* CSVファイルのパース、予約語チェック、Cardオブジェクトへの変換ロジック、
* およびストアへのインポート・エクスポート処理のトリガーを提供する。
*
* 責務は主に、ファイル操作、CSVパース、および**ストアが処理できる形式へのデータマッピング**に限定される。
* データベースアクセス、採番、永続化のロジックは、全て CardStore/CardService に委譲する。
*/

/**
 * src/features/packs/hooks/usePackEditor.ts
 *
 * 特定のPackの編集画面における状態管理、データロード、保存、およびI/O操作を一元的に処理するカスタムフック。
 * Packとそれに紐づくCardデータの取得・ローカルな変更追跡（isDirty）、新規Packの初期化、
 * およびStore/Service層へのデータ永続化（保存/削除）のトリガーを提供します。
 *
 * 責務: UIの状態管理（モーダル、アラート）、ビジネスロジックの調整（isNewPack, isDirty）、
 * およびStore/Service層への委譲。DBアクセスや複雑なデータ操作は行いません。
 */


/**
 * src/features/packs/hooks/usePackForm.ts
 *
 * PackEditorPageのフォーム入力と状態管理 (PackData) を担うカスタムフック。
 * テキスト入力、数値入力、Selectコンポーネントからの変更を処理し、
 * Packオブジェクトの状態を維持する。フォームの状態管理と型変換の責務を持つ。
 */

 /**
 * src/features/packs/hooks/usePackList.ts
 *
 * パック一覧表示に必要な全てのデータ、状態、および操作ロジックを提供するカスタムフック。
 * このフックはPackListコンポーネント（ビュー層）とZustandストア（データ層）の橋渡し役を担う。
 * 責務：
 * 1. Zustandストアからパック一覧データと、fetchPacks, initializeNewPackEditing, deletePackなどのアクションを取得する。
 * 2. データ取得（初期ロード）の実行。
 * 3. 汎用フック（useSortAndFilter）を使用して、パックデータにソートとフィルタリングの機能を提供する。
 * 4. UIからの操作（パック選択、新規作成、削除）に対応するナビゲーションおよびデータ操作ハンドラ（useCallbackでメモ化）を提供する。
 */

 /**
 * src/features/packs/hooks/useRarityEditor.ts
 *
 * パックのレアリティ設定（rarityNameとprobabilityの配列）の編集ロジックと
 * 状態を管理するカスタムフック。
 * 確率の合計計算や、初期値が空の場合のデフォルト設定へのフォールバックも行う。
 */

 /**
 * src/features/packs/packUtils.ts
 *
 * パック管理フィーチャーで使用されるユーティリティ関数群。
 * 主に、Packオブジェクトに関連する純粋なデータ処理や、useSortAndFilterで使用されるアクセサ関数を提供する。
 */

### pack-opener
/**
* src/features/pack-opener/PackOpener.tsx
*
* パック開封シミュレーション機能のメインコンポーネント。
* ユーザーインターフェース（UI）のレイアウト、状態表示、およびユーザー操作（パック選択、開封ボタン押下、God Mode時のコイン編集）を担います。
* パックデータ、開封ロジック、通貨/モードの状態は `usePackOpenerData` カスタムフックから取得し、責務を分離しています。
* パックの選択状況、現在のモード（DTCG/FREE/GOD）、コイン残高、クールダウン時間を反映して、開封ボタンのテキストと有効/無効状態を制御します。
* 実際の開封アニメーションと結果表示は、子の `PackOpenerHandler` コンポーネントに委譲しています。
*/

/**
* src/features/pack-opener/PackOpenerHandler.tsx
*
* パック開封シミュレーションの表示ロジックを制御するコンポーネントです。
* 親コンポーネントから受け取った開封結果 (`lastOpenedResults`) を、アニメーション用のフラットなカードリスト (`CardData[]`) に変換します。
* また、開封アニメーションの状態 (`isRevealed`) を管理し、結果の有無に応じてプレースホルダーの表示/リセットを行います。
* 実際のカードフリップアニメーションは、子の `PackOpenerAnimation` コンポーネントに委譲します。
*/

/**
 * src/features/pack-opener/components/OpenerCard.tsx
 *
 * パック開封シミュレーション機能で使用される、カードのフリップアニメーションを伴うコンポーネントです。
 * CardFaceヘルパーを使用し、isRevealedとdelayに基づき、裏面から表面へカードが回転するアニメーションを表現します。
 */

 /**
 * src/features/pack-opener/components/PackOpenerAnimation.tsx
 *
 * パック開封シミュレーションの結果を表示し、カードのフリップアニメーションを制御するコンポーネントです。
 * 開封結果のカードリストを受け取り、各カードにアニメーション遅延を適用して OpenerCard を描画します。
 * カードクリック時に useUIStore を介してカード詳細ビューモーダルを開きます。
 */

 /**
* src/features/pack-opener/hooks/usePackOpenerData.ts
*
* パック開封機能のロジックと状態管理（カスタムフック）を提供するファイルです。
* 複数のZustandストア（PackStore, CurrencyStore, CardPoolStore, UserDataStore）を統合し、
* 以下のロジックをカプセル化します:
* 1. パックデータの初期ロードと選択管理。
* 2. 開封時のモード判定（DTCG/GOD/FREE）。
* 3. DTCGモードにおける通貨消費（spendCoins）とクールダウンタイマー（useCooldownTimer）の管理。
* 4. シミュレーション（packSimulation）の実行と結果（lastOpenedResults）の更新。
* 5. 開封結果のカードプール（CardPoolStore）への追加。
* 6. エラー（purchaseError）と警告（simulationWarning）状態の管理。
* 7. God Modeで利用するための setCoins アクションの公開。
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
 * src/hooks/useCardViewData.ts
 *
 * CardViewModal でカード詳細情報を表示するために必要なデータを取得・計算するカスタムフック。
 * zustandの useUIStore から表示対象のカードIDを取得し、useCardStore と usePackStore から対応する
 * Card オブジェクト、Pack オブジェクト、および PackName を計算して提供する。
 */

 /**
 * src/hooks/useCooldownTimer.ts
 * 
 * 指定された秒数のクールダウンタイマーを管理する汎用フック。
 * 最後にアクションが実行された時刻を基準に、残り時間を計算し、タイマーのドリフトを最小限に抑える。
 */

 /**
 * src/hooks/useDataFileIO.ts
 *
 * CSV/JSON/ZIPなどのデータI/O操作に必要な、汎用的なUI状態とメニュー操作を管理するカスタムフック。
 * 特定のフィーチャー（Pack編集, 設定画面など）で共通して利用されます。
 */

/**
 * src/hooks/useModeSwitcher.ts
 *
 * アプリケーションのGameモード（DTCG/FREE/GOD）の切り替えに関する
 * 全ての状態管理、ビジネスロジック、およびストア操作をカプセル化するカスタムフック。
 * 複雑な多段階の確認ダイアログ（警告、二重確認）の制御ロジックを内包し、
 * UIコンポーネント（NavbarやGameModeSwitchModal）にシンプルなインターフェースを提供する。
 */

 /**
 * src/hooks/useInitialLoad.ts
 *
 * アプリケーションの初期起動時に必要な全ての非同期処理（IndexedDB接続、カードデータ、ストアデータ）をロードするカスタムフックです。
 * データの依存関係を調整し、初期化のオーケストレーションと、致命的なエラーハンドリングを担います。
 */

/**
 * src/hooks/useSortAndFilter.ts
 *
 * 汎用的なソートとフィルタリングのロジックをカプセル化するカスタムフック。
 * 外部のデータとアクセサー関数を利用し、UIの状態（ソート、検索）に基づいて
 * パフォーマンスに配慮したデータ加工結果を提供する。
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
 * IndexedDB (Dexie) のテーブルに保存されるオブジェクトのスキーマ型定義。
 * このファイルは、永続化層（DB）とのI/Oに使用されるデータ構造を定義する。
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
* src/models/pack-opener.ts
*
* PackOpenerAnimation や OpenerCard など、パック開封機能の各コンポーネントが使用する、
* 開封されたカードのアニメーション表示に特化したデータ構造を定義します。
* この型は、コアモデルの Card とは異なり、アニメーション表示に必要なユニークなインスタンスIDと
* 表示用の画像URLのみを含み、機能間の責任を分離しています。
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
 * 実際のロジック（フィルタリング、ソート、表示）は CardPool コンポーネントに委譲しています。
 */

/**
 * src/pages/DeckEditorPage.tsx
 *
 * デッキの新規作成または編集を行うためのメインページコンポーネントです。
 * URLパラメータからIDを取得し、全てのロジックをuseDeckEditorカスタムフックに委譲します。
 */

/**
 * src/pages/DeckListPage.tsx
 *
 * ユーザーが作成したデッキの一覧を表示し、新規デッキ作成や既存デッキの編集・削除へ
 * ナビゲートする機能を提供するページコンポーネントです。
 * デッキ一覧の取得、表示、およびフィルタリング・ソートなどの実際のロジックは
 * DeckList コンポーネントに委譲しています。
 */

/**
 * src/pages/HomePage.tsx
 *
 * アプリケーションのランディングページ。主要機能への導線と、
 * アプリケーションの重要なステータス（パック数、資産、通貨など）の概要を提供する。
 */

/**
 * src/pages/PackEditorPage.tsx
 *
 * パックデータ（基本情報、レアリティ設定、収録カード）の作成・編集を行うページ。
 * このコンポーネントはページラッパーとして、usePackEditorカスタムフックから状態とロジックを取得し、
 * PackEditorコンポーネントにプロパティを渡す。
 * 主要な責務として、未保存の変更がある場合にルーティングをブロックする機能（useBlocker）を実装する。
 */

/**
 * src/pages/PackListPage.tsx
 *
 * ページラッパーコンポーネント。このアプリケーションのパック管理機能のルートページを定義する。
 * 責務は、ルーティングのコンテキスト内でページ全体のレイアウト（パディング、マージン）を構築し、
 * タイトルを表示し、主要なフィーチャーコンポーネントであるPackList（一覧表示UI）を配置することに専念する。
 * データ取得やビジネスロジックは全てPackListフィーチャーに委譲するため、自身は純粋なプレゼンテーション層として機能する。
 */

/**
* src/pages/PackOpenerPage.tsx
*
* パック開封シミュレータのページコンポーネント。
* URLパラメータからpackIdを取得し、PackOpener Featureコンポーネントにロジックを委譲する。
* このページ自体には状態管理ロジックを含まない。
*/



## services
### cards
/**
 * src/services/cards/CardDataService.ts
 *
 * Card（カード）データに関する**ドメインロジック**と**データ永続化（IndexedDB）**を担うサービス層。
 * 責務は以下の通り：
 * 1. DBからのデータロードと**グローバルキャッシュ（cardCache）**の構築・提供。
 * 2. パックごとの**自動採番（numbering）**ロジックの実行。
 * 3. 24時間以上経過した**ドラフトカードの自動クリーンアップ**。
 * 4. パック削除時の**関連カードの一括物理削除（カスケード削除の受け入れ）**。
 */

 /**
 * src/services/cards/CardSearchService.ts
 *
 * Card（カード）データに関する**検索/クエリ**のロジックを担うサービス層。
 * 責務は、UIや他のドメインロジックからの要求に基づき、**IndexedDB (db.cards)**に対して特定の条件でクエリを実行し、結果を返すことです。
 *
 * - キャッシングやCRUDロジックは**CardDataService**に委譲します。
 * - 主に、特定のパック、レアリティ、または検索条件に基づくカードリストの取得を提供します。
 */

### card-pool
/**
 * src/services/card-pool-logic/CardPoolDataService.ts
 *
 * CardPool（所有カード資産）データに関する**ドメインロジック**と**データ永続化（IndexedDB）**を担うサービス層。
 * 責務は以下の通り：
 * 1. DBからのデータロードと**グローバルキャッシュ（cardPoolCache）**の構築・提供。
 * 2. 所有枚数の**更新/削除（CRUD）**ロジックの実行。
 * 3. 一括更新（バルク処理）の提供。
 * 4. カードプール全体のクリア。
 */

 /**
 * src/services/card-pool-logic/CardPoolSearchService.ts
 *
 * CardPool（所有カード資産）データに関する**検索/参照**のロジックを担うサービス層。
 * 責務は、**IndexedDB (db.cardPool)**に対してクエリを実行し、結果を特定の形式（Map）で返すことです。
 *
 * - データ永続化（CRUD）は**CardPoolDataService**に委譲します。
 */

### currency
/**
 * src/services/currency/currencyService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブル内の通貨データ (コイン)
 * に対する操作を扱うサービス。コインのロードと保存のロジックを提供する。
 */

### database
/**
 * src/services/database/db.ts
 *
 * IndexedDB (Dexie) を使用したアプリケーションのデータベース接続と
 * スキーマ定義 (テーブルとインデックス) を提供する。
 * Pack, Card, CardPool, Deck, UserSettings, Preset のテーブルを含む。
 */

 /**
 * src/services/database/dbUtils.ts
 *
 * IndexedDB (Dexie) の汎用的なデータ操作ユーティリティ関数群。
 * 主に、採番ロジックに必要な**最大値の効率的な取得**などのロジックを提供する。
 */

### data-io
/**
 * src/services/data-io/cardPoolJsonIO.ts
 *
 * CardPoolState (主に Map 構造を持つ ownedCards) のデータ構造を
 * JSON文字列へシリアライズ/デシリアライズ（Mapの変換/復元）するドメイン固有のI/Oサービス。
 */

 /**
 * src/services/data-io/deckJsonIO.ts
 *
 * Deckモデル内のMap構造（mainDeck, sideDeck, extraDeck）をJSON互換の形式へ
 * シリアライズ/デシリアライズ（Mapの変換/復元）するドメイン固有のI/Oサービス。
 */

 /**
 * src/services/data-io/packJsonIO.ts
 *
 * 単一のPackとその収録カード（関連データ）をまとめてJSON形式でシリアライズ/デシリアライズするドメインI/Oサービス。
 * JSONI/Oだけでなく、インポート時のID再採番とデータ初期化ロジックも担う。
 */

 /**
 * src/services/data-io/userDataJsonIO.ts
 *
 * UserDataStateのデータ構造をJSON文字列へシリアライズ/デシリアライズするドメイン固有のI/Oサービス。
 * (UserDataStateはMap構造を含まないため、汎用JsonIOのデフォルト動作を利用する)
 */

 /**
 * src/services/data-io/zipIOService.ts
 *
 * アプリケーションの全データ（パック、デッキ、ユーザー設定、カードプール）を
 * 収集し、ZIPファイルとしてエクスポート/インポートするサービスのオーケストレーター。
 * 各エンティティのJSON I/Oロジックは外部のJsonIOサービスに完全に委譲する。
 */
### decks
/**
 * src/services/decks/DeckService.ts
 *
 * Deck（デッキ）データに関する**ドメインロジック**と**データ永続化（localStorage）**を担うサービス層。
 * Pack/CardサービスがIndexedDBを使用するのに対し、このサービスは**localStorage**をデータストアとして使用する。
 * 責務は以下の通り：
 * 1. localStorageからのデータロードと**グローバルキャッシュ（deckCache）**の構築・提供。
 * 2. **自動採番（numbering）**ロジックの実行（キャッシュ内の最大値を基準）。
 * 3. デッキのCRUD操作と、インポート時の**ID衝突解決（リネームとID再割り当て）**。
 */

### packs
/**
 * src/services/packs/PackService.ts
 *
 * Pack（パック）データに関する**ドメインロジック**と**データ永続化（IndexedDB）**を担うサービス層。
 * 責務は以下の通り：
 * 1. DBからのデータロードと**グローバルキャッシュ（packCache）**の構築・提供。
 * 2. **自動採番（numbering）**ロジックの実行。
 * 3. 24時間以上経過した**ドラフトパックの自動クリーンアップ**。
 * 4. パック削除時の**関連カードの物理削除（カスケード削除）**。（CardDataServiceに依存）
 */

 /**
 * src/services/packs/packLogicUtils.ts
 *
 * TCGパックデータに関連するロジックを提供するユーティリティ関数群。
 * 主にパック固有の複雑なビジネスロジック（計算など）を扱う。
 */

 /**
 * src/services/packs/packSimulation.ts
 *
 * TCGパックの開封シミュレーションロジックを提供するユーティリティ関数群。
 * パックの設定に基づき、レアリティの確率抽選と、
 * cardSearchServiceを介したカードプールからのカード選択を非同期で行う。
 */

### user-logic
/**
 * src/services/user-logic/presetService.ts
 *
 * IndexedDB (Dexie) の 'presets' テーブルに対するプリセットデータ
 * (PackPreset, CardCustomPreset) の永続化操作を扱うサービス。
 * CRUD操作および初期データ投入ロジックを提供する。
 */

 /**
 * src/services/user-logic/userSettingsService.ts
 *
 * IndexedDB (Dexie) の 'userSettings' テーブルに対して、
 * コイン以外のユーザー設定（isDTCGEnabled, isGodMode, cheatCountなど）
 * のロードと保存を行うサービス。設定は単一のキーで管理される。
 */



## stores
/**
 * src/stores/cardPoolStore.ts
 *
 * ユーザーの**カード資産（Card Pool）**の状態管理を行うZustandストア。
 * 責務は、**所有カードの枚数データ（ownedCards）**と**総枚数（totalOwnedCards）**のグローバルな保持と、
 * DBへの永続化ロジックの実行です。
 *
 * - データアクセスは**cardPoolDataService**に完全に委譲され、Storeは状態の同期とビジネスロジック（枚数計算、DB連携）に集中します。
 */

/**
 * src/stores/cardStore.ts
 *
 * Card（カード）データの**グローバルな状態管理**を行うZustandストア。
 * 責務は、**カードのリスト（cards）**の保持、およびカードに関する**非同期操作の実行**と**Storeの同期**です。
 *
 * - DB操作は**cardDataService**に委譲し、本ストアは主にUIが必要とする状態のキャッシュと同期を担当します。
 * - 論理削除/復元（isInStoreフラグの更新）のビジネスロジックを実行します。
 * - CSVインポート/エクスポートの際のデータ連携窓口として機能します。
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
 * Deck（デッキ）データの**グローバルな状態管理**を行うZustandストア。
 * 責務は、**デッキのリスト（decks）**の保持、**編集中のデッキ（currentDeck）**の管理、およびデッキの編集（カードの増減、情報更新）に関するUIロジックの実行です。
 *
 * - DB操作は**deckService**に委譲し、本ストアは主にUIが必要とする状態のキャッシュと同期を担当します。
 * - カードの所有状況チェック（hasUnownedCards）のロジックを実行するために、**useCardPoolStore**に依存します。
 * - デッキのCRUD操作（永続化/削除/インポート）を実行します。
 */

/**
 * src/stores/packStore.ts
 *
 * Pack（パック）データの**グローバルな状態管理**を行うZustandストア。
 * 責務は、**パックのリスト（packs）**の保持、**編集対象パック（packForEdit）**の管理、およびパックに関する**非同期操作の実行**と**Storeの同期**です。
 *
 * - DB操作は**packService**に委譲し、本ストアは主にUIが必要とする状態のキャッシュと同期を担当します。
 * - 論理削除/復元（isInStoreフラグの更新）や新規パックの初期化など、パックのライフサイクルに関するビジネスロジックを実行します。
 * - 関連する**useCardStore**の状態更新も一部行います。
 */

/**
 * src/stores/presetStore.ts
 *
 * Zustandを使用してパックおよびカードのカスタムプロパティのプリセットを管理するストア。
 * 責務は、プリセットリストの保持、DBサービスを介したIndexedDBへの永続化、およびメモリ状態の同期を行う。
 */

/**
 * src/stores/uiStore.ts
 *
 * アプリケーション全体のUIの状態を管理するZustandストア。
 * CardViewModalの表示状態と、表示対象のカードIDを一元管理する。
 */

 /**
 * src/stores/userDataStore.ts
 *
 * ユーザーの設定（DTCG/Free/God Mode）および、それに関連するメタデータ（チート回数）の
 * グローバルな状態を管理するZustandストア。
 * 責務は、モード間の複雑なロジック処理と、userSettingsServiceを介した設定の永続化である。
 */



## utils
/**
 * src/utils/csvFormatter.ts
 *
 * 汎用的なフォーマットロジックを提供するユーティリティ関数群。
 * 主に、特定のモデルオブジェクトの配列をCSV文字列に変換する処理を担う。
 */

 /**
 * src/utils/csvParser.ts
 *
 * CSV形式の文字列を受け取り、ヘッダー行とデータ行の配列にパースするユーティリティ関数。
 * CSV標準（ダブルクォーテーションによるエスケープ）に対応する。
 */

 /**
 * src/utils/dataUtils.ts
 *
 * アプリケーションのコアエンティティ（Deck, Pack, Card）の初期データ生成と、
 * 汎用的なID生成機能を提供するドメインレスなユーティリティ群。
 */

 /**
 * src/utils/genericJsonIO.ts
 *
 * JSONシリアライズ/デシリアライズの汎用ロジックを提供するユーティリティ。
 * MapなどJSON非互換構造を扱うためのSerializer/Deserializer関数の実行をラップする。
 */

 /**
 * src/utils/imageUtils.ts
 * * 画像表示に関する汎用ユーティリティ関数群。
 * プレースホルダー生成ロジックは placeholderUtils.ts に委譲し、ここでは最終的な表示URLの決定を担う。
 */

 /**
 * src/utils/numberingUtils.ts
 *
 * アイテムの採番（連番）ロジックを管理するドメインレスなユーティリティ関数群。
 * 主に、既存の最大値に基づいて次の番号を計算する純粋な計算処理を担う。
 */

 /**
 * src/utils/placeholderUtils.ts
 * 
 * 画像URLがない場合に表示するプレースホルダーURLを生成するユーティリティ。
 * 外部サービス (placehold.jp) のURL形式管理と、汎用的な色プリセットを提供する。
 */

 /**
 * src/utils/randomUtils.ts
 * 
 * ランダム抽選に関する汎用ユーティリティ関数。
 * アプリケーションのドメイン（パック、カードなど）に依存しない、純粋な確率計算ロジックを担う。
 */

 /**
 * src/utils/sortingUtils.ts
 * 
 * データソートに関する汎用ユーティリティ関数群。
 * 数値（number/図鑑No.）と文字列による比較関数を提供し、外部から渡された accessor を利用することで、
 * どのエンティティでも再利用可能なソート処理を担う。
 */

 /**
 * src/utils/validationUtils.ts
 * 
 * データ検証に関する汎用ユーティリティ関数群。
 * 浮動小数点誤差を考慮した確率の検証や、Map形式データの枚数チェックなど、ドメインを問わない検証ロジックを担う。
 */