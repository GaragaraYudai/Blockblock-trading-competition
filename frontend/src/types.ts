export interface LeaderboardItem {
    rank: number;
    address: string;
    accountValue: number;
    equity: number;
    roi24h?: number;
    name?: string;
    avatar?: string;
}

export interface TraderData {
    name: string;
    avatar: string;
}
