'use strict';

function compareFriends(one, another) {
    if (one.level !== another.level) {
        return one.level > another.level ? 1 : -1;
    }

    return one.friend.name > another.friend.name ? 1 : -1;
}

function getFriendsWithLevels(friends) {
    var friendsWithLevel = [];
    var currentLevelFriends = [];
    var nameToFriend = {};
    var nextLevelFriends = [];
    var currentLevel = 2;

    friends.forEach(function (friend) {
        var friendWithLevel = {
            friend: friend,
            level: friend.best ? 1 : 0
        };

        if (friend.best) {
            currentLevelFriends.push(friendWithLevel);
        }
        friendsWithLevel.push(friendWithLevel);
        nameToFriend[friend.name] = friendWithLevel;
    });

    var addNextLevelFriend = function (friendName) {
        var friendsFriend = nameToFriend[friendName];

        if (!friendsFriend.level) {
            friendsFriend.level = currentLevel;
            nextLevelFriends.push(friendsFriend);
        }
    };

    while (currentLevelFriends.length > 0 || nextLevelFriends.length > 0) {
        var friendWithLevel = currentLevelFriends.pop();

        friendWithLevel.friend.friends.forEach(addNextLevelFriend);
        if (currentLevelFriends.length === 0) {
            currentLevel++;
            currentLevelFriends = nextLevelFriends;
            nextLevelFriends = [];
        }
    }

    return friendsWithLevel;
}

/**
 * Итератор по друзьям
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 */
function Iterator(friends, filter) {
    if (!(filter instanceof Filter)) {
        throw new TypeError('filter должен быть экземпляром Filter');
    }

    this._friendsWithLevel = getFriendsWithLevels(friends)
        .filter(function (friendWithLevel) {
            return friendWithLevel.level > 0 && filter.apply(friendWithLevel.friend);
        })
        .sort(compareFriends);
    this._currentIndex = 0;
}

Iterator.prototype.done = function () {
    return this._currentIndex === this._friendsWithLevel.length;
};

Iterator.prototype.next = function () {
    if (this.done()) {
        return null;
    }

    return this._friendsWithLevel[this._currentIndex++].friend;
};

/**
 * Итератор по друзям с ограничением по кругу
 * @extends Iterator
 * @constructor
 * @param {Object[]} friends
 * @param {Filter} filter
 * @param {Number} maxLevel – максимальный круг друзей
 */
function LimitedIterator(friends, filter, maxLevel) {
    Iterator.call(this, friends, filter);

    this._friendsWithLevel = this._friendsWithLevel.filter(function (friendWithLevel) {
        return friendWithLevel.level <= maxLevel;
    });
}

LimitedIterator.prototype = Object.create(Iterator.prototype);

var filters = {
    default: function () {
        return true;
    },

    isMale: function (friend) {
        return friend.gender === 'male';
    },

    isFemale: function (friend) {
        return friend.gender === 'female';
    }
};

/**
 * Фильтр друзей
 * @constructor
 */
function Filter() {
    this._filterFunction = filters.default;
}

Filter.prototype.apply = function () {
    return this._filterFunction.apply(null, arguments);
};

/**
 * Фильтр друзей
 * @extends Filter
 * @constructor
 */
function MaleFilter() {
    this._filterFunction = filters.isMale;
}

MaleFilter.prototype = Object.create(Filter.prototype);

/**
 * Фильтр друзей-девушек
 * @extends Filter
 * @constructor
 */
function FemaleFilter() {
    this._filterFunction = filters.isFemale;
}

FemaleFilter.prototype = Object.create(Filter.prototype);

exports.Iterator = Iterator;
exports.LimitedIterator = LimitedIterator;

exports.Filter = Filter;
exports.MaleFilter = MaleFilter;
exports.FemaleFilter = FemaleFilter;
