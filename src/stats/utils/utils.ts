import { Statistic } from '../objects/Statistic';
import { writeFile, createWriteStream } from 'fs';
import { Logger } from '@nestjs/common';

/**
 * Comparable of 'popularity' prop in statistic to sort by Highest priority
 * @param {Statistic} a
 * @param {Statistic} b
 */
export const sortByPopularity = (a: Statistic, b: Statistic) => {
    if (a.popularity > b.popularity) { return -1; }
    if (b.popularity > a.popularity) { return 1; }

    return 0;
};

/**
 * Comparable of 'name' prop in statistic to sort by Highest priority
 * @param {Statistic} a
 * @param {Statistic} b
 */
export const sortAlphabetically = (a: Statistic, b: Statistic) => {
    // return a.name.localeCompare(b.name);
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) { // sort ascending
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0; // default return value (no sorting)
};

export const writeStatisticsToFile = (newStatistics: Statistic[], logger: Logger): void => {
    // Code commented because watch mode is always recompiling, need to check why
    /*writeFile('offline/gameData.json', JSON.stringify([...newStatistics]), (err) => {
        if (err) {
            throw err;
        }
        logger.log('New game data cached in file');
    });*/
};
