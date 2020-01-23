import { Statistic } from '../objects/Statistic';
import { Logger } from '@nestjs/common';
import { writeFile } from 'fs';

/**
 * Comparable of 'popularity' prop in statistic to sort by Highest priority
 * @param {Statistic} a
 * @param {Statistic} b
 */
export const sortByPopularity = (a: Statistic, b: Statistic) => {
    if (a.popularity > b.popularity) {
        return -1;
    }
    if (b.popularity > a.popularity) {
        return 1;
    }

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
    if (nameA < nameB) {
        // sort ascending
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0; // default return value (no sorting)
};

export const writeStatisticsToFile = (newStatistics: Statistic[], logger: Logger): void => {
    // -> Comment block in watch mode because is recompiling in loop, need to check why
    writeFile('offline/gameData.json', JSON.stringify([...newStatistics]), (err) => {
        if (err) {
            throw err;
        }
        logger.log('New game data cached in file');
    });
};

/**
 * Program to add VERY large numbers in javascript
 * Note - numbers should be passed as strings.
 * example -
 * add("15", "15");  // returns "30"
 * Adapted from {@link https://github.com/niinpatel/addVeryLargeNumbers}
 */
export const largeSum = (str1: string, str2: string): string => {
    let sum = ''; // our result will be stored in a string.

    // we'll need these in the program many times.
    const str1Length = str1.length;
    const str2Length = str2.length;

    // if s2 is longer than s1, swap them.
    if (str2Length > str1Length) {
        const aux = str2;
        str2 = str1;
        str1 = aux;
    }

    let carry = 0; // number that is carried to next decimal place, initially zero.
    let a;
    let b;
    let temp;
    let digitSum;
    for (let i = 0; i < str1.length; i++) {
        a = parseInt(str1.charAt(str1.length - 1 - i), 10); // get ith digit of str1 from right, we store it in a
        b = parseInt(str2.charAt(str2.length - 1 - i), 10); // get ith digit of str2 from right, we store it in b
        b = b ? b : 0; // make sure b is a number, (this is useful in case, str2 is shorter than str1
        temp = (carry + a + b).toString(); // add a and b along with carry, store it in a temp string.
        digitSum = temp.charAt(temp.length - 1); //
        carry = parseInt(temp.substr(0, temp.length - 1), 10); // split the string into carry and digitSum ( least significant digit of abSum.
        carry = carry ? carry : 0; // if carry is not number, make it zero.

        // append digitSum to 'sum'. If we reach leftmost digit, append abSum which includes carry too.
        sum = i === str1.length - 1 ? temp + sum : digitSum + sum;
    }

    return sum; // return sum
};
