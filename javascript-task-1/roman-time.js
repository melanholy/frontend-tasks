'use strict';

var roman = ['L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
var arabic = [50, 40, 10, 9, 5, 4, 1];

function toRoman(number) {
    if (number === 0) {
        return 'N';
    }

    var result = '';
    for (var i = 0; i < roman.length; i++) {
        result += roman[i].repeat(Math.floor(number / arabic[i]));
        number %= arabic[i];
    }

    return result;
}

function romanTime(time) {
    if (!/^(?:2[0-3]|[0-1][0-9]):[0-5][0-9]$/.test(time)) {
        throw new TypeError();
    }

    var parts = time.split(':');
    var hours = parseInt(parts[0]);
    var minutes = parseInt(parts[1]);

    return toRoman(hours) + ':' + toRoman(minutes);
}

module.exports = romanTime;
