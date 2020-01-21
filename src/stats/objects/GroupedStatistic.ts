import { Statistic } from './Statistic';

export class GroupedStatistic {
    constructor(public totalPopularity: string, public totalGames: number, public games: Statistic[]) {}
}
