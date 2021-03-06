/* Table of Contents
––––––––––––––––––––––––––––––––––––––––––––––––––
- Base Functions
- Initialization
- Front Page
- Map Page
- Image Page
- Utilities
*/


/* Base Functions
–––––––––––––––––––––––––––––––––––––––––––––––––– */

// global variables //
var s = Snap('#map');
var showCallouts = false;
var showCT = false;
var showGFY = false;
var maps = null;

/**
 * Removes 'index.html' from url.
 *
 */
function removeIndex() {
    if (location.href.indexOf('index.html') >= 0 && window.location.protocol !== 'file:') {
        location.replace(location.href.replace('index.html', ''));
    }
}

/**
 * Captures and reports JavaScript errors.
 *
 */
function stackTrace() {
    window.addEventListener('error', function(message, file, line, column, errorObj) {
        if (errorObj !== undefined) {
            console.log('ERROR: ' + errorObj.stack);
        }
    });
}

/**
 * Grabs and parses JSON files.
 *
 * @param {string} url - URL path of the JSON file.
 * @param {callback} callback - JSON callback function to grab and parse the data.
 */
function getJson(url, callback) {
    (function(url, callback) {
        var xhttp;
        if (window.XMLHttpRequest) {
            xhttp = new XMLHttpRequest();
        } else {
            xhttp = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xhttp.addEventListener('readystatechange', function() {
            if (xhttp.readyState === XMLHttpRequest.DONE) {
                if (typeof callback !== 'function') {
                    return;
                }
                if (xhttp.status === 200) {
                    var data = JSON.parse(xhttp.responseText);
                    //console.log('LOADED: ' + url);
                    callback(data);
                } else {
                    console.log('FAILED TO GET FILE: ' + url);
                    callback(null);
                }
            }
        });
        xhttp.overrideMimeType('application/json');
        xhttp.open('GET', url, true);
        xhttp.send();
    })(url, callback);
}

/**
 * Loads JSON files containing map and nades information.
 *
 */
function grabMaps() {
    getJson('js/maps.json', function(data) {
        maps = data;
        var mapNames = Object.keys(maps);
        var remaining = mapNames.length;
        for (var i = 0; i < mapNames.length; i++) {
            getJson(maps[mapNames[i]], function(data) {
                maps[this] = data;
                remaining--;
                if (remaining <= 0) {
                    init();
                }
            }.bind(mapNames[i]));
        }
    });
}

/* Initialization
–––––––––––––––––––––––––––––––––––––––––––––––––– */

// grab list of maps and then initialize page
grabMaps();

// initialize the main page of nade.space
function init() {
    removeIndex();
    stackTrace();

    /**
     * Loads the map selections and shows the front page.
     *
     */
    function showFront() {
        var mapNames = Object.keys(maps);
        listMaps(mapNames);
        for (var i = 0; i < mapNames.length; i++) {
            var map = maps[mapNames[i]];
            var opt = document.createElement('option');
            opt.setAttribute('value', mapNames[i]);
            opt.innerHTML = map.name;
            document.getElementById('map-select').appendChild(opt);
            document.getElementById('footer').classList.remove('hide');
        }
    }
    showFront();
    accordion();
    buttons();

    /**
     * Hides all elements with the class name 'page'.
     *
     */
    function hideAll() {
        var pages = document.getElementsByClassName('page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.add('hide');
        }
    }

    /**
     * Displays the map page.
     *
     * @param {string} mapName - The filename of the map's JSON file. 
     * @param {callback} callback - Callback function useful for updating the map page.
     * @returns {boolean} - True - by default, False - if mapName can't be found.
     */
    function showMap(mapName, callback) {
        console.log('MAP: ' + mapName);
        if (!maps.hasOwnProperty(mapName)) {
            return false;
        }
        document.getElementById('nade-image').innerHTML = '';
        document.getElementById('nade-gfy').innerHTML = '';
        var mapPage = document.getElementById('map-page');
        if (mapPage.classList.contains('hide')) {
            hideAll();
            mapPage.classList.remove('hide');
            updateMap(mapName);
            if (callback) {
                callback();
            }
        } else {
            updateMap(mapName);
            if (callback) {
                callback();
            }
        }
        return true;
    }

    /**
     * Displays the nade image/gfy page.
     *
     * @param {string} mapName - The filename of the map's JSON file. 
     * @param {string} team - The team that the nade is designated for - CT(Counter-Terrorists) / T(Terrorists).
     * @param {string} nadeType - The type of nade being thrown - Smokes, Fires, Flashes, Wallbangs.
     * @param {integer} id - The number of the nade - identifies which nade to show.
     * @returns {boolean} - True - by default, False - if mapName, nadeType, or id can't be found.
     */
    function showImage(mapName, team, nadeType, id) {
        if (!maps.hasOwnProperty(mapName)) {
            return false;
        }
        if (!maps[mapName].hasOwnProperty(nadeType)) {
            return false;
        }
        if (!maps[mapName][nadeType].hasOwnProperty(id)) {
            return false;
        }
        hideAll();
        document.getElementById('nade-page').classList.remove('hide');
        updateImage(maps[mapName][nadeType][id]);
        updateVideo(maps[mapName][nadeType][id]);
        return true;
    }

    /**
     * Sets the title of the window to 'nade.space | (map)'.
     *
     * @param {string} mapName - The filename of the map's JSON file. 
     */
    function setTitle(mapName) {
        document.title = 'nade.space';
        if (mapName) {
            document.title += ' | ' + maps[mapName].name;
        }
    }

    // setup crossroads
    crossroads.addRoute('', function() {
        window.scrollTo(0, 0);
        setTitle();
        hideAll();
        document.getElementById('front-page').classList.remove('hide');
        document.getElementById('map').classList.add('hide');
    });
    crossroads.addRoute('{mapName}', function(mapName) {
        document.getElementById('nade-select').value = '';
        if (!showMap(mapName)) {
            revert();
        }
        setTitle(mapName);
    });
    crossroads.addRoute('{mapName}/{team}/{nadeType}', function(mapName, team, nadeType) {
        window.scrollTo(0, 0);
        if(!showCT) {
            team = 'T';
        } else {
            team = 'CT';
        }
        document.getElementById('nade-select').value = nadeType;
        if (!showMap(mapName, function() {
                if (nadeType === 'all') {
                    updateMapNades(mapName, team, 'smokes');
                    updateMapNades(mapName, team, 'fires');
                    updateMapNades(mapName, team, 'flashes');
                    updateMapNades(mapName, team, 'wbangs');
                } else if (!updateMapNades(mapName, team, nadeType)) {
                    revert();
                }
            }))
            revert();
        setTitle(mapName);
    });
    crossroads.addRoute('{mapName}/{team}/{nadeType}/{id}', function(mapName, team, nadeType, id) {
        window.scrollTo(0, 0);
        setTitle(mapName);
        if (!showImage(mapName, team, nadeType, id)) {
            revert();
        }
    });

    // setup hasher
    function parseHash(newHash, oldHash){
        crossroads.parse(newHash);
    }

    hasher.initialized.add(parseHash);
    hasher.changed.add(parseHash);
    hasher.init();
}

/* Front Page
–––––––––––––––––––––––––––––––––––––––––––––––––– */

/**
 * Creates the map thumbnail elements for the front page.
 *
 * @param {string} mapNames - The filenames of the JSON files. 
 */
function listMaps(mapNames) {
    var thumbs = document.getElementById('thumbs');
    thumbs.innerHTML = '';
    var row;
    for (var i = 0; i < mapNames.length; i++) {
        if (i % 2 === 0) {
            row = document.createElement('div');
            row.classList.add('row');
            thumbs.appendChild(row);
        }
        var map = maps[mapNames[i]];
        var thumb = document.createElement('div');
        thumb.className = 'thumb six columns';
        thumb.innerHTML = '<h4>' + map.name + '</h4>';
        thumb.style.backgroundImage =
            "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('" + map.thumb + "')";
        thumb.addEventListener('click', function() {
            resetGfy();
            resetCallouts();
            resetTeam();
            resetZoom();
            hasher.setHash(this, 'T', 'smokes');
        }.bind(mapNames[i]));
        row.appendChild(thumb);
    }
}


/* Map Page
–––––––––––––––––––––––––––––––––––––––––––––––––– */

/**
 * Updates the interactive map according to the map selection.
 *
 * @param {string} mapName - The filename of the map's JSON file. 
 * @returns {boolean} - True - by default, False - if mapName can't be found.
 */
function updateMap(mapName) {
    document.getElementById('map-select').value = mapName;
    document.getElementById('nade-table').innerHTML = '';
    if (!maps.hasOwnProperty(mapName)) {
        if (mapName) {
            alert('Invalid map: ' + mapName);
        }
        return false;
    }
    s.clear();

    // set up the map radar image, the image scale, and the mouse click coordinates for the nades
    var map = maps[mapName];
    var scale = map.scale * 1024;
    var radar = s.image(map.minimap, 0, 0, scale, scale);
    document.getElementById('map').setAttribute('viewBox', [0, 0, scale, scale].join(' '));
    radar.node.onload = function() {
        document.getElementById('map').classList.remove('hide');
    };
    radar.click(function(e, x, y) {
        var box = radar.node.getBoundingClientRect();
        var dx = scale * (x - box.left) / (box.right - box.left);
        var dy = scale * (y - box.top) / (box.bottom - box.top);
        //console.log('x, y ('+ (0 | dx) + ', ' + (0 | dy) + ')');
    });
    s.group().attr({
        id: 'nadeGroup'
    });
    if (map.callouts) {
        Snap.load(map.callouts, function(event) {
            s.append(event.select('g').attr({
                class: 'hide',
                id: 'callouts'
            }));
            var callouts = document.getElementById('callouts');
            callouts.parentNode.insertBefore(callouts, document.getElementById('nadeGroup'));
            if (showCallouts) {
                document.getElementById('callouts').classList.remove('hide');
            }
        });
    }
    return true;
}

/**
 * Draws the nades on the interactive map.
 *
 * @param {string} mapName - The filename of the map's JSON file. 
 * @param {string} team - The team that the nade is designated for - CT(Counter-Terrorists) / T(Terrorists).
 * @param {string} type - The type of nade being thrown - Smokes, Fires, Flashes, Wallbangs.
 * @returns {boolean} - True - by default, False - if mapName or type can't be found.
 */
function updateMapNades(mapName, team, type) {
    if (!maps.hasOwnProperty(mapName)) {
        return false;
    }
    var map = maps[mapName];
    if (!map.hasOwnProperty(type)) {
        return false;
    }

    // sets properties of the nades on the interactive map
    var scale = map.scale * 1024;
    var shadow = s.filter(Snap.filter.shadow(0, 0, 20, '#000', 1.0));
    var light = '#fff';
    var dark = {
        smokes: '#ecf0f1',
        fires: '#f39c12',
        flashes: '#FFF457',
        wbangs: '#62C462'
    }[type];

    // plots the nades on the interactive map
    var locMapper = function(n, i) {
        return i % 2 === 0 ? n - map.pos_x : map.pos_y - n;
    };
    for (var i = 0; i < map[type].length; i++) {
        var nade = map[type][i];
        if (nade.loc.length < 2) {
            continue;
        }
        var loc = nade.loc.map(locMapper);
        var group = s.group();
        if (nade.team === team) {
            // sets properties of the nade line
            var thickness = {
                smokes: 30,
                fires: 30,
                flashes: 30,
                wbangs: 30
            }[type];
            for (var j = 3; j < loc.length; j += 2) {
                var line = s.line.apply(s, loc.slice(j - 3, j + 1)).attr({
                    strokeWidth: thickness,
                    fillOpacity: 0,
                });
                group.add(line);
                if (j + 2 < loc.length) {
                    var joint = s.circle(loc[j - 1], loc[j], thickness / 2);
                    group.add(joint);
                }
            }

            // the circle at the start of the nade line
            var start = s.circle(loc[0], loc[1], {
                smokes: 40,
                fires: 40,
                flashes: 40,
                wbangs: 40
            }[type]);

            // the icon at the end of the nade line
            var end = s.use().attr('href', 'img/nade-space/icons.svg#' + type);
            end.attr({
                x: loc[loc.length - 2],
                y: loc[loc.length - 1]
            });

            // this is used for unhighlighting the nade
            var fakeEnd = s.circle(loc[loc.length - 2], loc[loc.length - 1],
                135).attr({
                fill: 'transparent',
                stroke: 'transparent'
            });

            group.add(start, end, fakeEnd);

            // adds list of nades to nade table
            (function nadeList() {
                var tr = document.createElement('tr');
                tr.style.opacity = 0.5;
                tr.classList.add('nadeRow');

                // set properties for elements in the nade table
                var enter = function() {
                    this.parent().append(this);
                    this.attr({
                        fill: light,
                        stroke: light,
                        opacity: 0.9
                    });
                    tr.style.opacity = 1;
                }.bind(group);
                var leave = function() {
                    this.attr({
                        fill: dark,
                        stroke: dark,
                        opacity: 0.7
                    });
                    tr.style.opacity = 0.5;
                }.bind(group);
                var click = function() {
                    hasher.setHash(this.mapName, this.team, this.type, this.i);
                }.bind({
                    mapName: mapName,
                    team: team,
                    type: type,
                    i: i
                });
                group.addClass('arrow').attr({
                    fill: dark,
                    stroke: dark,
                    opacity: 0.7,
                    filter: shadow
                }).hover(enter, leave).click(click);

                if (!isSafari() && !isMobile()) {
                    tr.innerHTML =
                        '<td><svg width="16px" height="16px" viewBox="-128 -128 256 256"><use href="img/nade-space/icons.svg#' +
                        type + '" /></svg></td><td>' + nade.from + '</td><td>' + nade.to + '</td>';
                } else {
                    tr.innerHTML =
                        '<td><svg width="16px" height="16px" viewBox="-128 -128 256 256"><use xlink:href="img/nade-space/icons.svg#' +
                        type + '" /></svg></td><td>' + nade.from + '</td><td>' + nade.to + '</td>';
                }
                tr.addEventListener('mouseenter', enter);
                tr.addEventListener('mouseleave', leave);
                tr.addEventListener('click', click);
                document.getElementById('nade-table').appendChild(tr);
            })();
        }
        document.getElementById('nadeGroup').appendChild(group.node).style.cursor = 'pointer';
    }
    var emptyTable = document.getElementById('nade-table').innerHTML === '';
    if (emptyTable) {
        var list = document.getElementById('nade-list');
        var tr = document.createElement('tr');
        tr.classList.add('error-tr');
        tr.innerHTML = '<td>ERROR: None found!</td>';
        document.getElementById('nade-table').appendChild(tr);
    } else {
        sortTable();
    }
    return true;
}


/* Image Page
–––––––––––––––––––––––––––––––––––––––––––––––––– */

/**
 * Updates the nade image according to the nade selection.
 *
 * @param {object} nade - Contains mapName, nadeType, and id.
 */
function updateImage(nade) {
    document.getElementById('nade-image').innerHTML = '';
    var img = document.createElement('img');
    img.setAttribute('alt', '[nade-image]');
    img.setAttribute('height', '100%');
    img.setAttribute('width', '100%');
    img.setAttribute('src', nade.img);
    var copy = document.getElementById('copy-button');
    copy.setAttribute('data-clipboard-text', nade.copy);
    console.log('IMG: ' + nade.from + ' --> ' + nade.to);
    document.getElementById('nade-image').appendChild(img);
    document.getElementById('nade-from').innerHTML = nade.from;
    document.getElementById('nade-to').innerHTML = nade.to;
    document.getElementById('nade-team').innerHTML = nade.team;
    document.getElementById('nade-type').innerHTML = nade.type;
}

/**
 * Updates the nade gfy according to the nade selection.
 *
 * @param {object} nade - Contains mapName, nadeType, and id.
 */
function updateVideo(nade) {
    document.getElementById('nade-gfy').innerHTML = '';
    var vid = document.createElement('video');
    vid.setAttribute('poster', 'img/nade-space/vid-loading.gif');
    vid.setAttribute('playsinline', 'true');
    vid.setAttribute('preload', 'metadata');
    vid.setAttribute('alt', '[nade-gfy]');
    vid.setAttribute('height', '100%');
    vid.setAttribute('muted', 'muted');
    vid.setAttribute('width', '100%');
    vid.setAttribute('loop', 'true');
    vid.addEventListener('click', function() {
        vid.setAttribute('controls', 'true');
    });
    if(!isMobile()) {
        vid.addEventListener('canplaythrough', function() {
            vid.play();
        });
    } else {
        vid.setAttribute('autoplay', 'true');
    }
    if (nade.hasOwnProperty('webm')) {
        var src = document.createElement('source');
        src.setAttribute('type', 'video/webm');
        src.setAttribute('src', nade.webm);
        vid.appendChild(src);
    }
    if (nade.hasOwnProperty('mp4')) {
        var src = document.createElement('source');
        src.setAttribute('type', 'video/mp4');
        src.setAttribute('src', nade.mp4);
        vid.appendChild(src);
    }
    if (nade.hasOwnProperty('gif')) {
        var anc = document.createElement('a');
        anc.setAttribute('href', nade.gif);
        anc.innerHTML = 'GIF';
        vid.appendChild(anc);
    }
    document.getElementById('nade-gfy').appendChild(vid);
}

/**
 * Changes the map selection.
 *
 * @param {string} mapName - The filename of the map's JSON file.
 */
function changeMap(mapName) {
    if (hasher.getHashAsArray()[1]) {
        hasher.setHash(mapName, hasher.getHashAsArray()[1], hasher.getHashAsArray()[2]);
    } else {
        hasher.setHash(mapName);
    }
}

/**
 * Changes the team selection.
 *
 * @param {string} team - The team that the nade is designated for - CT(Counter-Terrorists) / T(Terrorists).
 */
function changeTeamType(team) {
    if (team) {
        hasher.setHash(hasher.getHashAsArray()[0], team, hasher.getHashAsArray()[2]);
    } else {
        hasher.setHash(hasher.getHashAsArray()[0]);
    }
}

/**
 * Changes the nade type.
 *
 * @param {string} type - The type of nade being thrown - Smokes, Fires, Flashes, Wallbangs.
 */
function changeNadeType(type) {
    if (type) {
        hasher.setHash(hasher.getHashAsArray()[0], hasher.getHashAsArray()[1], type);
    } else {
        hasher.setHash(hasher.getHashAsArray()[0]);
    }
}

/* Utilities
–––––––––––––––––––––––––––––––––––––––––––––––––– */

/**
 * Returns to the previous page.
 *
 */
function revert() {
    setTimeout(function() {
        history.back();
    }, 0);
}

/**
 * Resets the callouts to hidden.
 *
 * @returns {undefined}
 */
function resetCallouts() {
    var button = document.getElementById('toggle-callouts');
    var callouts = document.getElementById('callouts');
    if (!callouts) {
        return;
    }
    showCallouts = false;
    callouts.classList.add('hide');
    button.textContent = 'Show Callouts';
}

/**
 * Resets the team selection filter back to 'Terrorists'.
 *
 */
function resetTeam() {
    var button = document.getElementById('toggle-team');
    showCT = false;
    button.textContent = 'Terrorists';
    button.value = 'T';
}

/**
 * Resets the gfy selection on the image page so that it defaults show the image instead of the gfy.
 *
 */
function resetGfy() {
    var button = document.getElementById('toggle-gfy');
    var img = document.getElementById('nade-image');
    var gfy = document.getElementById('nade-gfy');
    showGFY = false;
    button.textContent = 'View GFY';
    gfy.classList.add('hide');
    img.classList.remove('hide');
}

/**
 * Resets the zoom on the nade image.
 *
 */
function resetZoom() {
    var img = document.getElementById('nade-image');
    img.classList.remove('zoom');
}

/**
 * Sorts the nade table alphabetically.
 *
 */
function sortTable() {
    var table = document.getElementById('nade-table');
    var tableArray = [];
    for (var i = 0, len = table.rows.length; i < len; i++) {
        var row = table.rows[i];
        var firstCell = row.cells[1].textContent;
        tableArray.push([firstCell, row]);
    }
    tableArray = tableArray.sort(function(a, b) {
        if (a[0] === b[0]) {
            return 0;
        } else {
            return (a[0] < b[0]) ? -1 : 1;
        }
    });
    for (var i = 0, len = tableArray.length; i < len; i++) {
        table.appendChild(tableArray[i][1]);
    }
    tableArray = null;
}

/**
 * Handles the accordion style dropdown for the instruction box.
 *
 */
function accordion() {
    var accordionItem = document.getElementsByClassName('accordion-item');
    var accordionHeading = document.getElementsByClassName('accordion-item-heading');
    var accordionContent = document.getElementsByClassName('accordion-item-content');
    document.body.addEventListener('click', function (event) {
        var target = event.target || event.srcElement;
        for (i = 0; i < accordionHeading.length; i++) {
            if (accordionHeading[i].parentNode.className === 'accordion-item open') {
                if (target !== accordionContent[i] && !isChildOf(target, accordionContent[i])) {
                    if (target !== accordionHeading[i] && !isChildOf(target, accordionHeading[i])) {
                        for (i = 0; i < accordionItem.length; i++) {
                            accordionItem[i].className = 'accordion-item close';
                            window.scrollTo(0, 0);
                        }
                    }
                }
            }
        }
    }, false);
    for (i = 0; i < accordionHeading.length; i++) {
        accordionHeading[i].addEventListener('click', toggleItem, false);
    }

    // toggles the accordion-item open / close
    function toggleItem() {
        var itemClass = this.parentNode.className;
        for (i = 0; i < accordionItem.length; i++) {
            accordionItem[i].className = 'accordion-item close';
        }
        if (itemClass === 'accordion-item close') {
            this.parentNode.className = 'accordion-item open';
        }
    }
}

/**
 * Detects if element is a child of a parent. This is used in the accordion function.
 *
 * @param {element} child - The child element.
 * @param {element} parent - The parent element.
 * @returns {boolean} True - if element is child of parent, False - if element is not child of parent.
 */
function isChildOf(child, parent) {
    if (child.parentNode === parent) {
        return true;
    } else if (child.parentNode === null) {
        return false;
    } else {
        return isChildOf(child.parentNode, parent);
    }
}

/**
 * Detects if the user is on a mobile device.
 *
 * @returns {boolean} True - if mobile device.
 */
function isMobile() {
    if (/Mobi/.test(navigator.userAgent)) {
        return true;
    }
}

/**
 * Detects if the user's browser is Safari.
 *
 * @returns {boolean} True - if browser is Safari.
 */
function isSafari() {
    if (/constructor/i.test(window.HTMLElement) ||
            (function (p) {
                return p.toString() === '[object SafariRemoteNotification]';
            })(!window['safari'] || safari.pushNotification)) {
        return true;
    }
}

/**
 * Handles the functionality for all the buttons.
 *
 */
function buttons() {
    document.getElementById('title').addEventListener('click', function() {
        hasher.setHash('');
    });
    document.getElementById('back-button').addEventListener('click', function() {
        history.back();
        resetGfy();
        resetZoom();
    });
    document.getElementById('map-select').addEventListener('change', function() {
        changeMap(this.value);
    });
    document.getElementById('nade-select').addEventListener('change', function() {
        changeNadeType(this.value);
    });
    document.getElementById('toggle-callouts').addEventListener('click', function() {
        var button = document.getElementById('toggle-callouts');
        var callouts = document.getElementById('callouts');
        showCallouts = !showCallouts;
        if (!callouts) {
            return;
        }
        if (showCallouts) {
            callouts.classList.remove('hide');
            button.textContent = 'Hide Callouts';
        } else {
            callouts.classList.add('hide');
            button.textContent = 'Show Callouts';
        }
    });
    document.getElementById('toggle-team').addEventListener('click', function() {
        var button = document.getElementById('toggle-team');
        showCT = !showCT;
        if (!showCT) {
            button.textContent = 'Terrorists';
            button.value = 'T';
            changeTeamType(this.value);
        } else {
            button.textContent = 'Counter-Terrorists';
            button.value = 'CT';
            changeTeamType(this.value);
        }
    });
    document.getElementById('toggle-gfy').addEventListener('click', function() {
        var button = document.getElementById('toggle-gfy');
        var img = document.getElementById('nade-image');
        var gfy = document.getElementById('nade-gfy');
        showGFY = !showGFY;
        if (!showGFY) {
            button.textContent = 'View GFY';
            gfy.classList.add('hide');
            img.classList.remove('hide');
        } else {
            button.textContent = 'View IMG';
            img.classList.add('hide');
            gfy.classList.remove('hide');
        }
    });
    var clipboard = new Clipboard('.copy');
    clipboard.on('success', function(event) {
        event.clearSelection();
        event.trigger.textContent = 'Copied';
        window.setTimeout(function() {
            event.trigger.textContent = 'Copy Location';
        }, 1000);
    });
    var img = document.getElementById('nade-image');
    img.addEventListener('click', function() {
        if (img.classList.contains('zoom')) {
            img.classList.remove('zoom');
        } else {
            img.classList.add('zoom');
        }
    });
}