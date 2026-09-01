import { Dimensions } from "react-native";

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;



const formatNumberValueIndian = (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue === 0) return '0';
    if (absValue < 1000) return value.toLocaleString('en-IN');

    let formatted = '';
    let suffix = '';

    if (absValue < 100000) {
        // Thousand
        formatted = (absValue / 1000).toFixed(absValue >= 10000 ? 2 : 2);
        suffix = 'K';
    } else if (absValue < 10000000) {
        // Lakh
        formatted = (absValue / 100000).toFixed(absValue >= 1000000 ? 2 : 2);
        suffix = 'L';
    } else {
        // Crore (last suffix)
        formatted = (absValue / 10000000).toFixed(absValue >= 100000000 ? 2 : 2);
        suffix = 'Cr';
    }

    formatted = formatted.replace(/\.0$/, '');

    return sign + formatted + suffix;
};

export const formatShortNumber = (
    num: number | string | null | undefined
): string => {
    if (num == null || num === '') {
        return '0';
    }

    if (typeof num === 'number') {
        return formatNumberValueIndian(num);
    }

    let cleanString = String(num).trim().replace(/,/g, '');
    const parsed = Number(cleanString);

    if (isNaN(parsed)) {
        console.warn('Invalid number format:', num);
        return '0';
    }

    return formatNumberValueIndian(parsed);
};