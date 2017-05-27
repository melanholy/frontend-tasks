'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var DAYS = ['ПН', 'ВТ', 'СР'];

function dateToTimestamp(date) {
    var isoDate = date;
    DAYS.forEach(function (day, i) {
        isoDate = isoDate.replace(day, i + 1);
    });

    /* Будем считать, что понедельник - 1 января 1970 года.
       соответственно банк меняет сигнализацию 4 января 1970 года. */
    isoDate = isoDate.replace(/^(\d) (\d{2}:\d{2})(\+\d+)$/, '1 $1 1970 $2 UTC$3');

    return Date.parse(isoDate);
}

function getTimezone(time) {
    var match = /^\d{2}:\d{2}\+(\d+)$/.exec(time);

    return match && Number(match[1]);
}

function toTimestampInterval(interval) {
    return {
        from: dateToTimestamp(interval.from),
        to: dateToTimestamp(interval.to)
    };
}

function getBusyIntervals(schedule) {
    return Object.keys(schedule).reduce(function (busyIntervals, thugName) {
        return busyIntervals.concat(
            schedule[thugName].map(toTimestampInterval)
        );
    }, []);
}

function getWorkingDays(workingHours) {
    return DAYS.map(function (day) {
        var from = day + ' ' + workingHours.from;
        var to = day + ' ' + workingHours.to;

        return {
            from: dateToTimestamp(from),
            to: dateToTimestamp(to)
        };
    });
}

function invertBusyIntervals(busyIntervals, weekStart, deadline) {
    var sortedBusyIntervals = busyIntervals.slice().sort(function (one, another) {
        return one.from - another.from;
    });
    var spareIntervals = [];
    var current = weekStart;
    sortedBusyIntervals.forEach(function (interval) {
        if (current < interval.from) {
            spareIntervals.push({
                from: current,
                to: interval.from
            });
        }
        current = Math.max(interval.to, current);
    });
    if (current < deadline) {
        spareIntervals.push({
            from: current,
            to: deadline
        });
    }

    return spareIntervals;
}

function getRobberyIntervals(spareIntervals, workingDays, durationInMilliseconds) {
    var robberyIntervals = [];
    spareIntervals.forEach(function (interval) {
        workingDays.forEach(function (day) {
            var attemptTo = Math.min(day.to, interval.to);
            var attemptFrom = Math.max(day.from, interval.from);
            if (attemptTo - attemptFrom >= durationInMilliseconds) {
                robberyIntervals.push({
                    from: attemptFrom,
                    to: attemptTo
                });
            }
        });
    });

    return robberyIntervals;
}

function twoDigitsFormat(number) {
    return number.toLocaleString(undefined, { 'minimumIntegerDigits': 2 });
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var bankTimezone = getTimezone(workingHours.from);
    var weekStart = dateToTimestamp('ПН 00:00+' + bankTimezone);
    var deadline = dateToTimestamp('СР 23:59+' + bankTimezone);

    var busyIntervals = getBusyIntervals(schedule);
    var spareIntervals = invertBusyIntervals(busyIntervals, weekStart, deadline);

    var durationInMilliseconds = duration * 60 * 1000;
    var workingDays = getWorkingDays(workingHours);
    var robberyIntervals = getRobberyIntervals(
        spareIntervals,
        workingDays,
        durationInMilliseconds
    );
    var currentRobberyIndex = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyIntervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            var hourInMilliseconds = 60 * 60 * 1000;
            var date = new Date(
                robberyIntervals[currentRobberyIndex].from +
                bankTimezone * hourInMilliseconds
            );
            var minutes = twoDigitsFormat(date.getUTCMinutes());
            var hours = twoDigitsFormat(date.getUTCHours());
            var day = DAYS[date.getUTCDate() - 1];

            return template
                .replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }

            var halfHourInMilliseconds = 30 * 60 * 1000;
            var i = currentRobberyIndex;
            var delayedRobberyStart = robberyIntervals[i].from + halfHourInMilliseconds;
            while (i < robberyIntervals.length && robberyIntervals[i].from < delayedRobberyStart) {
                if (robberyIntervals[i].to - delayedRobberyStart >= durationInMilliseconds) {
                    robberyIntervals[i].from = delayedRobberyStart;
                    currentRobberyIndex = i;

                    return true;
                }
                i++;
            }

            if (i < robberyIntervals.length) {
                currentRobberyIndex = i;

                return true;
            }

            return false;
        }
    };
};
