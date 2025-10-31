/**
 * src/configs/defaults.ts
 *
 * * 責務:
 * 1. アプリケーション全体で使用される各種デフォルト設定ファイル（`gridDefaults`, `gcDefaults`, `userDataDefaults` など）を
 * 外部に再エクスポートする単一のエントリーポイントを提供する。
 * 2. 設定ファイル群を集中管理することで、インポートパスの抽象化と簡略化を目的とする。
 */

export * from './gridDefaults';
export * from './gcDefaults';
export * from './userDataDefaults';