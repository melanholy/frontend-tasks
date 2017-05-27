'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var FUNCTION_PRIORITY = {
    select: 1,
    filterIn: 3,
    format: 0,
    limit: 0,
    and: 3,
    or: 3,
    sortBy: 2
};

function copyObjectArray(array) {
    return array.map(function (element) {
        return Object.assign({}, element);
    });
}

/**
 * Запрос к коллекции
 * @param {Array} collection
 * @params {...Function} – Функции для запроса
 * @returns {Array}
 */
exports.query = function (collection) {
    var queries = [].slice.call(arguments, 1);
    var collectionCopy = copyObjectArray(collection);

    queries
        .sort(function (one, another) {
            return FUNCTION_PRIORITY[another.name] - FUNCTION_PRIORITY[one.name];
        })
        .forEach(function (query) {
            collectionCopy = query(collectionCopy);
        });

    return collectionCopy;
};

/**
 * Выбор полей
 * @params {...String}
 * @returns {Function}
 */
exports.select = function () {
    var fields = [].slice.call(arguments);

    return function select(collection) {
        return collection.map(function (element) {
            return fields.reduce(function (selected, field) {
                if (field in element) {
                    selected[field] = element[field];
                }

                return selected;
            }, {});
        });
    };
};

/**
 * Фильтрация поля по массиву значений
 * @param {String} property – Свойство для фильтрации
 * @param {Array} values – Доступные значения
 * @returns {Function}
 */
exports.filterIn = function (property, values) {
    return function filterIn(collection) {
        return collection.reduce(function (filtered, element) {
            if (values.indexOf(element[property]) >= 0) {
                filtered.push(Object.assign({}, element));
            }

            return filtered;
        }, []);
    };
};

/**
 * Сортировка коллекции по полю
 * @param {String} property – Свойство для фильтрации
 * @param {String} order – Порядок сортировки (asc - по возрастанию; desc – по убыванию)
 * @returns {Function}
 */
exports.sortBy = function (property, order) {
    return function sortBy(collection) {
        return copyObjectArray(collection).sort(function (one, another) {
            var propertyOne = one[property];
            var propertyAnother = another[property];

            if (propertyOne === propertyAnother) {
                return 0;
            }
            var result = propertyOne > propertyAnother ? 1 : -1;

            return order === 'asc' ? result : -result;
        });
    };
};

/**
 * Форматирование поля
 * @param {String} property – Свойство для фильтрации
 * @param {Function} formatter – Функция для форматирования
 * @returns {Function}
 */
exports.format = function (property, formatter) {
    return function format(collection) {
        return collection.map(function (element) {
            var copy = Object.assign({}, element);

            if (property in element) {
                copy[property] = formatter(copy[property]);
            }

            return copy;
        });
    };
};

/**
 * Ограничение количества элементов в коллекции
 * @param {Number} count – Максимальное количество элементов
 * @returns {Function}
 */
exports.limit = function (count) {
    return function limit(collection) {
        var result = [];

        for (var i = 0; i < count; i++) {
            result.push(Object.assign(collection[i]));
        }

        return result;
    };
};

if (exports.isStar) {

    /**
     * Фильтрация, объединяющая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Array}
     */
    exports.or = function () {
        var filters = [].slice.call(arguments);

        return function or(collection) {
            return collection.filter(function (element) {
                return filters.some(function (filter) {
                    return filter([element]).length > 0;
                });
            });
        };
    };

    /**
     * Фильтрация, пересекающая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Array}
     */
    exports.and = function () {
        var filters = [].slice.call(arguments);

        return function and(collection) {
            return filters.reduce(function (result, filter) {
                return filter(result);
            }, collection);
        };
    };
}
