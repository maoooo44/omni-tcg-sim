/**
 * src/pages/PackOpenerPage.tsx
 *
 * * パック開封シミュレータ機能のメインページコンポーネント。
 * このコンポーネントは、URLパラメータからパックIDを取得し、実際の開封シミュレーションのロジックを
 * 全て機能コンポーネント（PackOpener）に委譲します。
 * 責務は、IDの取得、ページタイトルと基本レイアウトの提供、およびPackOpenerコンポーネントの配置に限定されます。
 *
 * * 責務:
 * 1. URLパラメータ（packId）を取得し、機能コンポーネントに初期選択IDとして渡す。
 * 2. ページのルート要素（Box）と基本的な余白、表示領域を定義する。
 * 3. ページのタイトル（Typography: 'パック開封シミュレータ'）を表示する。
 * 4. 実際の開封シミュレーション機能を提供するコンポーネント（PackOpener）を埋め込む。
 */
import React from 'react';
import { useParams } from '@tanstack/react-router';
import PackOpener from '../features/pack-opener/PackOpener';

interface PackOpenerParams {
    packId: string;
}

const PackOpenerPage: React.FC = () => {
    const { packId } = useParams({ strict: false }) as PackOpenerParams;

    return <PackOpener preselectedPackId={packId} />;

};

export default PackOpenerPage;